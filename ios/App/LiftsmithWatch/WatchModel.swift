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
        guard let s = current, s.vibrate, let end = s.restEnd, end > Date() else { return }
        restTap = Timer.scheduledTimer(withTimeInterval: end.timeIntervalSinceNow, repeats: false) { _ in
            WKInterfaceDevice.current().play(.stop)
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
