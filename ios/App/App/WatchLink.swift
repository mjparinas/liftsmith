import Foundation
import HealthKit
import WatchConnectivity

/// Phone side of the Apple Watch app (LiftsmithWatch). The live workout goes to the watch as its application
/// context, which the system delivers whenever the watch wakes (and straight away as a message while it's
/// reachable). The watch's Log set, +30 s and heart rate come back as messages or queued user info.
/// Android counterpart: WatchLink.java and WatchListenerService.java.
final class WatchLink: NSObject, WCSessionDelegate {
    static let shared = WatchLink()

    /// Log set or +30 s from the watch, handled exactly like the Live Activity's buttons, plus adjust and rate with
    /// what came with them (the weight and reps chosen on the watch, or how the exercise felt; WatchMessages.data).
    var onAction: ((String, [String: Any]?) -> Void)?
    /// A reading from the watch's own heart rate sensor.
    var onHeartRate: ((Int) -> Void)?
    /// A batch of wrist motion (Labs, watch rep counting), counted by the web app.
    var onMotion: (([String: Any]) -> Void)?
    /// A workout the watch ran with the phone away reached the phone (WatchWorkouts): the web app saves it.
    var onWorkout: (() -> Void)?

    private var launchedFor: String?
    /// The application context holds the live workout ("json") and today's call ("today") together, because each
    /// update replaces the whole context: sending one alone would wipe the other.
    private var context: [String: Any] = [:]
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

    /// Today's call for the complication and the watch's idle screen, from the home-screen widget's snapshot, which
    /// the app sends only when a line changes (src/lib/widget.ts). An empty snapshot (signed out) clears it.
    func today(_ snapshot: String) {
        guard let s = session else { return }
        let json = WatchMessages.today(snapshot) ?? ""
        guard context["today"] as? String != json else { return }
        send(["today": json], on: s)
        // A complication on the watch face gets its own budgeted transfer, which wakes the watch app to redraw it.
        if s.isComplicationEnabled, s.remainingComplicationUserInfoTransfers > 0 {
            s.transferCurrentComplicationUserInfo(["today": json])
        }
    }

    /// Today's plan worked out set by set (src/lib/watchWorkout.ts Carry), for a workout on the watch with the phone
    /// away. It rides in the application context with the rest, so the watch has the newest one whenever it wakes.
    func carry(_ json: String) {
        guard let s = session else { return }
        let c = WatchMessages.carry(json) ?? ""
        guard context["carry"] as? String != c else { return }
        send(["carry": c], on: s)
    }

    private func send(_ part: [String: Any], on s: WCSession) {
        // After a relaunch, start from what the watch already has, so today's call never wipes a running workout.
        if context.isEmpty { context = s.applicationContext }
        context.merge(part) { _, new in new }
        try? s.updateApplicationContext(context)
        if s.isReachable { s.sendMessage(part, replyHandler: nil, errorHandler: nil) }
    }

    private func receive(_ message: [String: Any]) {
        DispatchQueue.main.async {
            if let action = WatchMessages.tapAction(message["action"]), let data = WatchMessages.data(action, message) {
                self.onAction?(action, data.isEmpty ? nil : data)
            }
            if let bpm = WatchMessages.bpm(message["hr"]) { self.onHeartRate?(bpm) }
            if let m = WatchMessages.motion(message["motion"]) { self.onMotion?(m) }
            // A workout the watch ran on its own, sent as queued user info, which reaches the phone even when the app
            // isn't running: kept until the web app saves it.
            if let done = message["done"] as? String, WatchWorkouts.add(done) { self.onWorkout?() }
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

/// Workouts a watch ran on its own, with the phone away (docs/decisions/watch-apps.md "Phone-free workouts"), kept
/// until the web app has saved them (src/lib/watchWorkout.ts). Apple Watch sends them as queued user info and Garmin
/// as a message; both land here. Android counterpart: WatchWorkouts.java.
enum WatchWorkouts {
    static let key = "liftsmith.watchWorkouts"
    static let max = 30
    static let maxChars = 64_000

    /// The result's id when it looks like one (letters, digits, - and _, 4 to 64), or nil.
    static func id(_ o: [String: Any]?) -> String? {
        guard let id = o?["id"] as? String, (4...64).contains(id.count),
              id.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "-" || $0 == "_") }) else { return nil }
        return id
    }

    /// A watch's result, checked for shape only (the web app checks every set again), or nil.
    static func parse(_ json: String) -> [String: Any]? {
        guard json.count <= maxChars, let data = json.data(using: .utf8),
              let o = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              id(o) != nil, !((o["c"] as? String) ?? "").isEmpty, o["sets"] is [Any] else { return nil }
        return o
    }

    static func all() -> [String] { UserDefaults.standard.stringArray(forKey: key) ?? [] }

    /// Keeps one; the same id twice is kept once. False when it isn't one, or there's no room.
    static func add(_ json: String) -> Bool {
        guard let o = parse(json), let rid = id(o) else { return false }
        var list = all()
        if list.contains(where: { parse($0).flatMap(self.id) == rid }) { return true }
        guard list.count < max else { return false }
        list.append(json)
        UserDefaults.standard.set(list, forKey: key)
        return true
    }

    static func remove(_ id: String) {
        UserDefaults.standard.set(all().filter { parse($0).flatMap(self.id) != id }, forKey: key)
    }
}

/// What the watch may send. Anything else is dropped, so a bad message can't reach the web app.
enum WatchMessages {
    /// The most a carried plan may weigh: 80 steps of words with plenty to spare (Android: WatchMessages.MAX_CARRY).
    static let maxCarry = 48_000

    /// Today's carried plan as the watch keeps it, or nil to take it off (empty, "{}", too big or not a plan).
    static func carry(_ json: String) -> String? {
        guard json.count <= maxCarry, let data = json.data(using: .utf8),
              let o = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              (o["v"] as? NSNumber)?.intValue == 1, !((o["id"] as? String) ?? "").isEmpty,
              o["st"] is [Any], o["ex"] is [Any] else { return nil }
        return json
    }

    /// Today's call for the watch, from the widget's snapshot: {day, kind, title, why, stale, call, mins, ready}, all
    /// strings, as JSON; nil for an empty snapshot. Same as Android's WatchMessages.today.
    static func today(_ snapshot: String) -> String? {
        guard let data = snapshot.data(using: .utf8),
              let s = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              (s["v"] as? NSNumber)?.intValue == 1 else { return nil }
        var out: [String: String] = [:]
        for k in ["day", "kind", "title", "why", "stale"] { out[k] = s[k] as? String ?? "" }
        let w = s["watch"] as? [String: Any]
        for k in ["call", "mins", "ready"] { out[k] = w?[k] as? String ?? "" }
        if out["call"]?.isEmpty ?? true { out["call"] = out["title"] }
        guard let json = try? JSONSerialization.data(withJSONObject: out, options: [.sortedKeys]) else { return nil }
        return String(data: json, encoding: .utf8)
    }

    /// Today's call for the Garmin glance, under "g" so the watch never takes it for a workout (GarminMessages.today).
    static func garminToday(_ json: String?) -> [String: Any] {
        let t = json.flatMap { $0.data(using: .utf8) }.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: String] } ?? [:]
        let keys = ["d": "day", "k": "kind", "t": "title", "y": "why", "c": "call", "m": "mins", "r": "ready", "x": "stale"]
        return ["g": keys.mapValues { t[$0] ?? "" }]
    }

    static func action(_ value: Any?) -> String? {
        guard let a = value as? String, a == "log" || a == "add30" || a == "taken" else { return nil }
        return a
    }

    /// Log set and +30 s, plus adjust and rate from the watches (docs/decisions/watch-apps.md "Adjust and rate a set").
    static func tapAction(_ value: Any?) -> String? {
        guard let a = value as? String, a == "log" || a == "add30" || a == "adjust" || a == "rate" else { return nil }
        return a
    }

    /// What came with a tap, field by field (the web app checks it against the set again, watchAdjust.ts), or nil
    /// when a tap that needs fields lacks them. Same rules as Android's WatchMessages.tap.
    static func data(_ action: String, _ m: [String: Any]) -> [String: Any]? {
        var d: [String: Any] = [:]
        if let key = m["key"] as? String, key.count <= 120 { d["key"] = key }
        if let kg = (m["kg"] as? NSNumber)?.doubleValue, kg.isFinite { d["kg"] = kg }
        if let reps = (m["reps"] as? NSNumber)?.intValue { d["reps"] = reps }
        if let ex = m["ex"] as? String, ex.count <= 120 { d["ex"] = ex }
        if let v = (m["v"] as? NSNumber)?.intValue, abs(v) <= 1 { d["v"] = v }
        if action == "rate", d["ex"] == nil || d["v"] == nil { return nil }
        if action == "adjust", d["key"] == nil || d["reps"] == nil { return nil }
        return d
    }

    /// The most readings one motion batch may carry (src/lib/reps/watchMotion.ts MAX_BATCH).
    static let maxMotion = 200

    /// A motion batch, ["t": ms, "s": [ms after t, up, rot, ...]], or nil. The web app checks every reading again.
    static func motion(_ value: Any?) -> [String: Any]? {
        guard let m = value as? [String: Any], let t = (m["t"] as? NSNumber)?.doubleValue, t.isFinite,
              let raw = m["s"] as? [Any], raw.count % 3 == 0, raw.count <= maxMotion * 3 else { return nil }
        var s: [Double] = []
        s.reserveCapacity(raw.count)
        for v in raw {
            guard let d = (v as? NSNumber)?.doubleValue, d.isFinite else { return nil }
            s.append(d)
        }
        return ["t": t, "s": s]
    }

    /// A believable heart rate (30 to 240 bpm), or nil.
    static func bpm(_ value: Any?) -> Int? {
        guard let b = value as? Int, (30...240).contains(b) else { return nil }
        return b
    }
}
