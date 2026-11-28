import CoreMotion
import Foundation
import HealthKit
import WatchConnectivity
import WatchKit

/// The watch app's one source of truth: the phone's workout (WatchConnectivity), the heart rate the watch
/// measures (a strength training workout session, which also keeps the app running with the wrist down),
/// and the messages back to the phone. Keys match the phone's WatchLink.swift.
@MainActor
final class WatchModel: NSObject, ObservableObject {
    static let shared = WatchModel()

    @Published private(set) var state: WatchState?
    @Published private(set) var bpm: Int?
    /// Today's call from the phone (the complication's), shown while no workout runs.
    @Published private(set) var today: WatchToday? = WatchToday.load()
    /// A workout run here with the phone away (docs/decisions/watch-apps.md "Phone-free workouts"), kept on the watch
    /// so closing the app loses nothing.
    @Published private(set) var run: WatchRun? = WatchModel.loadRun()
    /// Today's plan worked out set by set, as the phone last sent it (WatchLink.swift carry).
    @Published private(set) var carryJson: String? = UserDefaults.standard.string(forKey: WatchModel.carryKey)
    /// Phone-free workouts finished here that haven't reached the phone yet.
    @Published private(set) var waiting = 0
    /// Start timer tapped here on the phone's set `startedKey` at `startedAt` (ms): counted here at once, and the phone
    /// starts the same timer from that moment (docs/decisions/set-timer.md "Started from the watch").
    @Published private var startedKey = ""
    @Published private var startedAt: Double = 0
    private var timerLog: Timer?

    private static let runKey = "liftsmith.watchRun"
    private static let carryKey = "liftsmith.watchCarry"
    /// Finished results not yet handed to WatchConnectivity (it wasn't active yet).
    private static let pendingKey = "liftsmith.watchDone"

    private let health = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var lastHrSent = Date.distantPast
    private var restTap: Timer?
    private var warnTap: Timer?
    /// Seconds before rest ends for the heads-up tap; the same as REST_WARN_S in the phone's src/lib/training.ts.
    private static let restWarn: TimeInterval = 10
    private var timerTaps: [Timer] = []
    /// A timer phase this long or longer gets a nudge halfway (the same as Wear OS's HALF_FROM_MS).
    private static let halfFrom: TimeInterval = 20
    private let motion = MotionStream()
    /// How far this watch's clock is from the phone's, learnt from each state the phone sends.
    private var clock = WatchClock()

    func start() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
        if run != nil {
            logRanOut()
            beginWorkout()
        }
    }

    /// The workout to show: the one running here with the phone away first, then the phone's, unless the phone forgot
    /// it long ago.
    var current: WatchState? {
        if let r = run { return WatchState.parse(r.state(now: Self.ms())) }
        guard let s = state, !s.stale(at: Date()) else { return nil }
        return s.withStarted(startedKey, startedAt)
    }

    /// Today's carried plan, when nothing runs and the watch could start it on its own.
    var carried: Carry? { run == nil ? Carry.parse(carryJson, day: Carry.today()) : nil }

    private static func ms(_ d: Date = Date()) -> Double { (d.timeIntervalSince1970 * 1000).rounded() }

    private static func loadRun() -> WatchRun? {
        guard let data = UserDefaults.standard.data(forKey: runKey) else { return nil }
        return try? JSONDecoder().decode(WatchRun.self, from: data)
    }

    private func saveRun() {
        if let r = run, let data = try? JSONEncoder().encode(r) {
            UserDefaults.standard.set(data, forKey: Self.runKey)
        } else {
            UserDefaults.standard.removeObject(forKey: Self.runKey)
        }
    }

    fileprivate func applyCarry(_ json: String) {
        guard json != carryJson else { return }
        carryJson = json.isEmpty ? nil : json
        UserDefaults.standard.set(carryJson, forKey: Self.carryKey)
    }

    fileprivate func countWaiting() {
        let kept = UserDefaults.standard.stringArray(forKey: Self.pendingKey)?.count ?? 0
        waiting = kept + WCSession.default.outstandingUserInfoTransfers.filter { $0.userInfo["done"] != nil }.count
    }

    // MARK: Phone-free workouts

    /// Starts today's carried plan here, with the phone away.
    func startLocal() {
        guard run == nil, let c = carried else { return }
        WKInterfaceDevice.current().play(.start)
        run = WatchRun(carry: c, now: Self.ms())
        saveRun()
        scheduleRestTap()
        beginWorkout()
    }

    /// Ends the run here and queues what was logged for the phone, which saves it whenever it's near again.
    func finishLocal() {
        guard let r = run else { return }
        if let json = r.result(now: Self.ms()) {
            var list = UserDefaults.standard.stringArray(forKey: Self.pendingKey) ?? []
            list.append(json)
            UserDefaults.standard.set(Array(list.suffix(30)), forKey: Self.pendingKey)
        }
        flushPending()
        WKInterfaceDevice.current().play(.success)
        run = nil
        saveRun()
        scheduleRestTap()
        countWaiting()
        if current == nil { endWorkout() }
    }

    /// Queues finished results with WatchConnectivity, which delivers them whenever the phone is near, app open or not.
    fileprivate func flushPending() {
        let s = WCSession.default
        guard s.activationState == .activated, let list = UserDefaults.standard.stringArray(forKey: Self.pendingKey), !list.isEmpty else { return }
        for json in list { s.transferUserInfo(["done": json]) }
        UserDefaults.standard.removeObject(forKey: Self.pendingKey)
        countWaiting()
    }

    /// A tap on the run here instead of the phone.
    private func local(_ action: String, _ f: [String: Any]) {
        guard var r = run else { return }
        let now = Self.ms()
        let kg = (f["kg"] as? NSNumber)?.doubleValue
        let reps = (f["reps"] as? NSNumber)?.intValue
        switch action {
        case "log": r.log(now: now, kg: kg, reps: reps)
        case "adjust": r.adjust(kg: kg, reps: reps)
        case "add30": r.add30(now: now)
        case "rate": r.rate((f["v"] as? NSNumber)?.intValue ?? 9)
        case "timer": r.startTimer(now: now)
        default: return
        }
        run = r
        saveRun()
        scheduleRestTap()
    }

    /// Today's call for the complication and the idle screen; "" when the phone took it away (signed out).
    fileprivate func applyToday(_ json: String) {
        let next = WatchToday.parse(json)
        guard next != today else { return }
        today = next
        WatchToday.save(next == nil ? nil : json)
    }

    fileprivate func apply(_ json: String?, live: Bool = false) {
        // The phone's times onto this watch's clock, so both count down to the same moment (WatchClock).
        let parsed = WatchState.parse(json)
        if let p = parsed, let current = state, p.at > 0, p.at < current.at { return }
        if live, let p = parsed { clock.heard(sentAt: p.at, now: Self.ms()) }
        let next = parsed?.shifted(by: clock.offset)
        guard next != state else { return }
        // A run here owns the screen and the workout session; the phone's own workout waits until it's finished.
        if run != nil {
            state = next
            return
        }
        // Hands-free watch sets (Labs): one tap when the set started or logged itself, so the lifter knows without looking.
        if let n = next, n.vibrate, n.newCue(after: state) { WKInterfaceDevice.current().play(.click) }
        state = next
        scheduleRestTap()
        if next == nil { endWorkout() } else { beginWorkout() }
        motion.set(current?.streamMotion(at: Date()) == true)
    }

    /// A hold timed here with the phone away logs itself when its countdown runs out, as on the phone.
    private func logRanOut() {
        guard var r = run, let end = r.timerEnd, Self.ms() >= end else { return }
        r.log(now: end, kg: nil, reps: nil)
        run = r
        saveRun()
        scheduleRestTap()
    }

    /// Start timer on a timed hold, carry or cardio set: counted here at once on the watch's own clock (with taps on
    /// the wrist), and the phone starts the same timer from this moment (timerRun.ts startFromWatch).
    func startTimer() {
        guard let s = current, s.canStartTimer(at: Date()), let ts = s.ts else { return }
        WKInterfaceDevice.current().play(.click)
        if run != nil { return local("timer", [:]) }
        startedKey = ts.key
        startedAt = Self.ms()
        deliver(["action": "timer", "key": ts.key])
        scheduleRestTap()
    }

    // MARK: Taps, sent to the phone

    func send(_ action: String) {
        WKInterfaceDevice.current().play(.click)
        if run != nil { return local(action, [:]) }
        deliver(["action": action])
    }

    /// A tap with what goes with it: Log set or adjust with the weight and reps chosen here, or rate with how the
    /// exercise felt (docs/decisions/watch-apps.md "Adjust and rate a set"). The phone checks every field.
    func send(_ action: String, fields: [String: Any], click: Bool = true) {
        if click { WKInterfaceDevice.current().play(.click) }
        if run != nil { return local(action, fields) }
        var m = fields
        m["action"] = action
        deliver(m)
    }

    private func deliver(_ message: [String: Any]) {
        let s = WCSession.default
        guard s.activationState == .activated else { return }
        if s.isReachable {
            // A message the phone can't take right now is queued instead, so a tap is never lost.
            s.sendMessage(message, replyHandler: nil) { _ in s.transferUserInfo(message) }
        } else if message["action"] != nil {
            s.transferUserInfo(message)
        }
    }

    // MARK: Rest

    /// A tap on the wrist when rest ends, if the lifter's rest-over alert vibrates (Workout preferences).
    private func scheduleRestTap() {
        restTap?.invalidate()
        restTap = nil
        warnTap?.invalidate()
        warnTap = nil
        timerTaps.forEach { $0.invalidate() }
        timerTaps = []
        timerLog?.invalidate()
        timerLog = nil
        // The set timer: a tap as each phase ends (go, switch sides, time's up), a light tick at 3, 2 and 1 seconds
        // left, and a nudge halfway through a phase of 20 seconds or more, so the wrist can stay down.
        if let s = current, s.vibrate, !s.resting(at: Date()) {
            let now = Date()
            func at(_ d: Date, _ kind: WKHapticType) {
                guard d > now else { return }
                timerTaps.append(Timer.scheduledTimer(withTimeInterval: d.timeIntervalSince(now), repeats: false) { _ in
                    WKInterfaceDevice.current().play(kind)
                })
            }
            for p in s.phases {
                guard let end = p.end else { continue }
                at(end, .notification)
                for k in 1...3 where end.addingTimeInterval(-Double(k)) > p.start { at(end.addingTimeInterval(-Double(k)), .click) }
                if end.timeIntervalSince(p.start) >= Self.halfFrom { at(p.start.addingTimeInterval(end.timeIntervalSince(p.start) / 2), .directionUp) }
            }
        }
        // With the phone away, a hold that runs out logs itself.
        if let end = run?.timerEnd {
            timerLog = Timer.scheduledTimer(withTimeInterval: max(0, end / 1000 - Date().timeIntervalSince1970), repeats: false) { _ in
                Task { @MainActor in WatchModel.shared.logRanOut() }
            }
        }
        guard let s = current, s.vibrate, let end = s.restEnd, end > Date() else { return }
        restTap = Timer.scheduledTimer(withTimeInterval: end.timeIntervalSinceNow, repeats: false) { _ in
            WKInterfaceDevice.current().play(.stop)
        }
        // The heads-up before the end: a soft rising tap, so the lifter can get set with the phone in a bag.
        let soon = end.timeIntervalSinceNow - Self.restWarn
        if s.warn, soon > 0 {
            warnTap = Timer.scheduledTimer(withTimeInterval: soon, repeats: false) { _ in
                WKInterfaceDevice.current().play(.directionUp)
            }
        }
    }

    // MARK: Heart rate

    /// Starts a strength training session when a workout shows up (heart rate, and the app stays up between sets).
    func beginWorkout(_ config: HKWorkoutConfiguration? = nil) {
        guard session == nil, HKHealthStore.isHealthDataAvailable() else { return }
        let types: Set<HKObjectType> = [HKQuantityType(.heartRate)]
        health.requestAuthorization(toShare: [HKObjectType.workoutType()], read: types) { ok, _ in
            guard ok else { return }
            Task { @MainActor in self.startSession(config) }
        }
    }

    private func startSession(_ given: HKWorkoutConfiguration?) {
        guard session == nil else { return }
        let config = given ?? {
            let c = HKWorkoutConfiguration()
            c.activityType = .traditionalStrengthTraining
            c.locationType = .indoor
            return c
        }()
        guard let s = try? HKWorkoutSession(healthStore: health, configuration: config) else { return }
        let b = s.associatedWorkoutBuilder()
        b.dataSource = HKLiveWorkoutDataSource(healthStore: health, workoutConfiguration: config)
        b.delegate = self
        session = s
        builder = b
        let now = Date()
        s.startActivity(with: now)
        b.beginCollection(withStart: now) { _, _ in }
    }

    /// The phone saves the finished workout to Apple Health itself (calories and heart rate), so the watch's
    /// own copy is dropped rather than saved twice.
    private func endWorkout() {
        bpm = nil
        motion.set(false)
        guard let s = session, let b = builder else { return }
        session = nil
        builder = nil
        s.end()
        b.endCollection(withEnd: Date()) { _, _ in b.discardWorkout() }
    }

    fileprivate func heartRate(_ reading: Int) {
        bpm = reading
        guard Date().timeIntervalSince(lastHrSent) >= 2 else { return }
        lastHrSent = Date()
        if run != nil {
            // With the phone away, the watch keeps the readings itself and hands back the average, high and low.
            run?.heartRate(reading)
            saveRun()
            return
        }
        // Only while the phone is reachable: an old reading is no use to it later.
        if WCSession.default.isReachable { WCSession.default.sendMessage(["hr": reading], replyHandler: nil, errorHandler: nil) }
    }
}

extension WatchModel: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let json = session.receivedApplicationContext["json"] as? String
        let today = session.receivedApplicationContext["today"] as? String
        let carry = session.receivedApplicationContext["carry"] as? String
        Task { @MainActor in
            self.apply(json)
            if let today { self.applyToday(today) }
            if let carry { self.applyCarry(carry) }
            // A run left on the wrist for hours is finished with what was logged.
            if let r = self.run, r.forgotten(now: Self.ms()) { self.finishLocal() }
            self.flushPending()
            self.countWaiting()
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
        let json = context["json"] as? String
        let today = context["today"] as? String
        let carry = context["carry"] as? String
        Task { @MainActor in
            self.apply(json)
            if let today { self.applyToday(today) }
            if let carry { self.applyCarry(carry) }
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        // Today's call goes on its own, so it never touches the workout.
        if let today = message["today"] as? String {
            Task { @MainActor in self.applyToday(today) }
        }
        if let carry = message["carry"] as? String {
            Task { @MainActor in self.applyCarry(carry) }
        }
        guard let json = message["json"] as? String else { return }
        Task { @MainActor in self.apply(json, live: true) }
    }

    /// A phone-free workout reached the phone.
    nonisolated func session(_ session: WCSession, didFinish userInfoTransfer: WCSessionUserInfoTransfer, error: Error?) {
        Task { @MainActor in self.countWaiting() }
    }

    /// Today's call sent for the complication (transferCurrentComplicationUserInfo), which wakes the watch app for it.
    nonisolated func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        guard let today = userInfo["today"] as? String else { return }
        Task { @MainActor in self.applyToday(today) }
    }
}

extension WatchModel: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        let type = HKQuantityType(.heartRate)
        guard collectedTypes.contains(type),
              let q = workoutBuilder.statistics(for: type)?.mostRecentQuantity() else { return }
        let reading = Int(q.doubleValue(for: HKUnit.count().unitDivided(by: .minute())).rounded())
        guard (30...240).contains(reading) else { return }
        Task { @MainActor in self.heartRate(reading) }
    }
}

/// Wrist motion for watch rep counting (Labs), sent to the phone about four times a second while the phone asks for
/// it (a set is under way and the lab is on). The phone counts the reps (src/lib/reps/watchMotion.ts), so the watch
/// only measures. Each batch is ["t": first reading's time in ms, "s": [ms after t, up, rot, ...]], where up is vertical
/// linear acceleration in m/s² (up positive) and rot the rotation rate in rad/s: the same as Wear OS's MotionBatch.
/// Only while the phone is reachable: motion that arrives late is no use to a live count.
final class MotionStream {
    private let manager = CMMotionManager()
    private let queue: OperationQueue = {
        let q = OperationQueue()
        q.maxConcurrentOperationCount = 1
        q.name = "liftsmith.motion"
        return q
    }()
    private var on = false
    // Read and written on `queue` only.
    private var first: Double = -1
    private var last: Double = -1
    private var readings: [Double] = []

    static let sendEvery: Double = 250
    static let maxReadings = 200

    func set(_ want: Bool) {
        guard want != on, manager.isDeviceMotionAvailable else { return }
        on = want
        if want {
            manager.deviceMotionUpdateInterval = 1.0 / 50
            manager.startDeviceMotionUpdates(to: queue) { [weak self] m, _ in
                guard let self, let m else { return }
                self.add(m)
            }
        } else {
            manager.stopDeviceMotionUpdates()
            queue.addOperation { [weak self] in self?.flush() }
        }
    }

    private func add(_ m: CMDeviceMotion) {
        // Motion times count from boot; the phone only needs them to be in order and in ms.
        let t = (Date().timeIntervalSince1970 - (ProcessInfo.processInfo.systemUptime - m.timestamp)) * 1000
        if last >= 0, t - last < 18 { return }
        last = t
        if first < 0 { first = t }
        // Core Motion's gravity points down and its user acceleration is the opposite of the push, so their dot product
        // is the push along up. Both are in g.
        let a = m.userAcceleration, g = m.gravity
        let up = (a.x * g.x + a.y * g.y + a.z * g.z) * 9.81
        let r = m.rotationRate
        let rot = (r.x * r.x + r.y * r.y + r.z * r.z).squareRoot()
        readings.append(contentsOf: [(t - first).rounded(), Self.round(up), Self.round(rot)])
        if readings.count / 3 >= Self.maxReadings || t - first >= Self.sendEvery { flush() }
    }

    private func flush() {
        defer {
            first = -1
            readings = []
        }
        guard !readings.isEmpty else { return }
        let s = WCSession.default
        guard s.activationState == .activated, s.isReachable else { return }
        s.sendMessage(["motion": ["t": first.rounded(), "s": readings]], replyHandler: nil, errorHandler: nil)
    }

    private static func round(_ v: Double) -> Double {
        guard v.isFinite else { return 0 }
        return max(-99, min(99, (v * 1000).rounded() / 1000))
    }
}

