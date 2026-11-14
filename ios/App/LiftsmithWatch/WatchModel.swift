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

    private let health = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var lastHrSent = Date.distantPast
    private var restTap: Timer?
    private var warnTap: Timer?
    /// Seconds before rest ends for the heads-up tap; the same as REST_WARN_S in the phone's src/lib/training.ts.
    private static let restWarn: TimeInterval = 10
    private var timerTaps: [Timer] = []
    private let motion = MotionStream()

    func start() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    /// The workout to show, unless the phone forgot it long ago.
    var current: WatchState? {
        guard let s = state, !s.stale(at: Date()) else { return nil }
        return s
    }

    fileprivate func apply(_ json: String?) {
        let next = WatchState.parse(json)
        guard next != state else { return }
        state = next
        scheduleRestTap()
        if next == nil { endWorkout() } else { beginWorkout() }
        motion.set(current?.streamMotion(at: Date()) == true)
    }

    // MARK: Taps, sent to the phone

    func send(_ action: String) {
        WKInterfaceDevice.current().play(.click)
        deliver(["action": action])
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
        // The set timer: a tap on the wrist as each phase ends (go, switch sides, time's up).
        if let s = current, s.vibrate, !s.resting(at: Date()) {
            timerTaps = s.timer.compactMap(\.end).filter { $0 > Date() }.map { end in
                Timer.scheduledTimer(withTimeInterval: end.timeIntervalSinceNow, repeats: false) { _ in
                    WKInterfaceDevice.current().play(.notification)
                }
            }
        } else {
            timerTaps = []
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
        // Only while the phone is reachable: an old reading is no use to it later.
        if WCSession.default.isReachable { WCSession.default.sendMessage(["hr": reading], replyHandler: nil, errorHandler: nil) }
    }
}

extension WatchModel: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let json = session.receivedApplicationContext["json"] as? String
        Task { @MainActor in self.apply(json) }
    }

    nonisolated func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
        let json = context["json"] as? String
        Task { @MainActor in self.apply(json) }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let json = message["json"] as? String else { return }
        Task { @MainActor in self.apply(json) }
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

