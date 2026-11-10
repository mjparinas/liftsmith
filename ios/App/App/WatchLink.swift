import Foundation
import HealthKit
import WatchConnectivity

/// Phone side of the Apple Watch app (LiftsmithWatch). The live workout goes to the watch as its application
/// context, which the system delivers whenever the watch wakes (and straight away as a message while it's
/// reachable). The watch's Log set, +30 s and heart rate come back as messages or queued user info.
/// Android counterpart: WatchLink.java and WatchListenerService.java.
final class WatchLink: NSObject, WCSessionDelegate {
    static let shared = WatchLink()

    /// Log set or +30 s from the watch, handled exactly like the Live Activity's buttons.
    var onAction: ((String) -> Void)?
    /// A reading from the watch's own heart rate sensor.
    var onHeartRate: ((Int) -> Void)?

    private var launchedFor: String?
    private let health = HKHealthStore()

    func start() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    private var session: WCSession? {
        guard WCSession.isSupported() else { return nil }
        let s = WCSession.default
        return s.activationState == .activated && s.isPaired && s.isWatchAppInstalled ? s : nil
    }

    /// The workout as the watch shows it: the Live Activity's own fields plus when it was sent.
    func update(_ state: [String: Any]) {
        guard let s = session else { return }
        var st = state
        st["at"] = Date().timeIntervalSince1970 * 1000
        guard let data = try? JSONSerialization.data(withJSONObject: st), let json = String(data: data, encoding: .utf8) else { return }
        send(["json": json], on: s)
        // A workout started on the phone: open the watch app, so heart rate and the rest tap start with it.
        if let id = state["sessionId"] as? String, !id.isEmpty, id != launchedFor {
            launchedFor = id
            let config = HKWorkoutConfiguration()
            config.activityType = .traditionalStrengthTraining
            config.locationType = .indoor
            health.startWatchApp(with: config) { _, _ in }
        }
    }

    /// The workout ended: the watch goes back to its "start on your phone" screen.
    func stop() {
        launchedFor = nil
        guard let s = session else { return }
        send(["json": ""], on: s)
    }

    private func send(_ context: [String: Any], on s: WCSession) {
        try? s.updateApplicationContext(context)
        if s.isReachable { s.sendMessage(context, replyHandler: nil, errorHandler: nil) }
    }

    private func receive(_ message: [String: Any]) {
        DispatchQueue.main.async {
            if let action = WatchMessages.action(message["action"]) { self.onAction?(action) }
            if let bpm = WatchMessages.bpm(message["hr"]) { self.onHeartRate?(bpm) }
        }
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) {
        // The lifter switched watches: talk to the new one.
        WCSession.default.activate()
    }
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) { receive(message) }
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) { receive(userInfo) }
}

/// What the watch may send. Anything else is dropped, so a bad message can't reach the web app.
enum WatchMessages {
    static func action(_ value: Any?) -> String? {
        guard let a = value as? String, a == "log" || a == "add30" else { return nil }
        return a
    }

    /// A believable heart rate (30 to 240 bpm), or nil.
    static func bpm(_ value: Any?) -> Int? {
        guard let b = value as? Int, (30...240).contains(b) else { return nil }
        return b
    }
}
