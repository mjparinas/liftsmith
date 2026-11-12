import ActivityKit
import Capacitor
import UIKit
import UserNotifications
import WidgetKit

/// Registers the app's own plugins with the bridge (Capacitor 8 with SPM has no auto-registration
/// for plugins that live in the app target). Main.storyboard and SceneDelegate use this class.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WorkoutSessionPlugin())
        bridge?.registerPluginInstance(CalendarPlugin())
        bridge?.registerPluginInstance(InstallInfoPlugin())
        bridge?.registerPluginInstance(VoiceCoachPlugin())
        bridge?.registerPluginInstance(AppIconPlugin())
        bridge?.registerPluginInstance(AccountSignInPlugin())
        bridge?.registerPluginInstance(HealthWorkoutPlugin())
        bridge?.registerPluginInstance(GarminPlugin())
        bridge?.registerPluginInstance(SpeechLogPlugin())
        bridge?.registerPluginInstance(VolumeKeysPlugin())
        // iOS's back: a swipe in from the left edge goes to the previous screen, through the same history
        // the Android back button and the browser's back use (src/lib/back.ts, router.ts).
        webView?.allowsBackForwardNavigationGestures = true
    }
}

/// The live workout notification, iOS side (Android: WorkoutSessionPlugin.java + WorkoutService.java).
/// src/lib/sessionNotify.ts calls the same methods on both platforms.
///
/// iOS can't keep an ongoing notification, so this runs a Live Activity instead (lock screen and Dynamic Island:
/// rest countdown, next set and plates, heart rate, Log set / +30 s; drawn by LiftsmithWidgets), and schedules the
/// end-of-rest alert as a time-sensitive local notification with the same Log set / +30 s buttons.
@objc(WorkoutSessionPlugin)
public class WorkoutSessionPlugin: CAPPlugin, CAPBridgedPlugin, UNUserNotificationCenterDelegate {
    public let identifier = "WorkoutSessionPlugin"
    public let jsName = "WorkoutSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setWidget", returnType: CAPPluginReturnPromise),
    ]

    private let restId = WorkoutTaps.restId
    private let category = WorkoutTaps.category
    /// Capacitor's own notification router, which delivers reminder taps to @capacitor/local-notifications.
    /// This plugin only handles the workout's own notifications and passes everything else on to it.
    private weak var next: UNUserNotificationCenterDelegate?

    override public func load() {
        let center = UNUserNotificationCenter.current()
        let prior = center.delegate
        next = (prior !== self && !(prior is EarlyNotifications) ? prior : nil) ?? (bridge?.notificationRouter as UNUserNotificationCenterDelegate?)
        center.delegate = self
        // A reminder tapped before the bridge was there waited in AppDelegate's early delegate.
        EarlyNotifications.shared.handOff(to: next)
        let log = UNNotificationAction(identifier: "log", title: NSLocalizedString("Log set", comment: "Rest-over alert button"), options: [])
        let add = UNNotificationAction(identifier: "add30", title: "+30 s", options: [])
        center.setNotificationCategories([UNNotificationCategory(identifier: category, actions: [log, add], intentIdentifiers: [], options: [])])

        // Siri, Shortcuts, the Action button and Control Center (ShortcutIntents.swift).
        NotificationCenter.default.addObserver(self, selector: #selector(shortcut(_:)), name: ShortcutInbox.notification, object: nil)
        if let a = ShortcutInbox.pending { deliverShortcut(a) }
        deliverKeptTaps()
        NotificationCenter.default.addObserver(self, selector: #selector(becameActive), name: UIApplication.didBecomeActiveNotification, object: nil)

        // The Apple Watch app (WatchLink.swift): its taps work like the Live Activity's buttons, and its heart
        // rate is used when no Bluetooth monitor is connected.
        WatchLink.shared.onAction = { [weak self] a in self?.tap(a) }
        WatchLink.shared.onHeartRate = { [weak self] bpm in self?.notifyListeners("heartRate", data: ["bpm": bpm]) }
        WatchLink.shared.onMotion = { [weak self] m in self?.notifyListeners("watchMotion", data: m) }
        WatchLink.shared.start()
        // The Garmin watch app (GarminLink.swift, garmin/): the same taps and heart rate.
        GarminLink.shared.onAction = WatchLink.shared.onAction
        GarminLink.shared.onHeartRate = WatchLink.shared.onHeartRate
        GarminLink.shared.restore()
    }

    /// Taps kept while the app wasn't open (WorkoutTaps), handed over on load and each time the app comes back.
    private func deliverKeptTaps() {
        for t in WorkoutTaps.drain() {
            guard let a = t["action"] as? String else { continue }
            notifyListeners("action", data: ["action": a, "at": t["at"] ?? 0], retainUntilConsumed: true)
        }
    }

    @objc private func becameActive() {
        deliverKeptTaps()
    }

    /// A Log set or +30 s from the rest-over alert or a watch. With the app open the web app takes it now; in the
    /// background (where the web app is asleep) it's kept with its time and the Live Activity moves on by itself.
    private func tap(_ action: String, done: @escaping () -> Void = {}) {
        DispatchQueue.main.async {
            if UIApplication.shared.applicationState == .active {
                self.notifyListeners("action", data: ["action": action, "at": (Date().timeIntervalSince1970 * 1000).rounded()], retainUntilConsumed: true)
                done()
            } else {
                WorkoutTaps.tapped(action, done: done)
            }
        }
    }

    @objc private func shortcut(_ note: Notification) {
        if let a = note.userInfo?["action"] as? String { deliverShortcut(a) }
    }

    private func deliverShortcut(_ action: String) {
        ShortcutInbox.pending = nil
        notifyListeners("action", data: ["action": action], retainUntilConsumed: true)
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            call.resolve(["granted": granted])
        }
    }

    /// The running Live Activity (typed Any so the property needs no availability check).
    private var activity: Any?
    private var lastActivityState: Any?
    private var lastHrPush = Date.distantPast

    @objc func update(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) { updateActivity(call) }
        // What's on screen and the sets after it, for a Log set tapped with the app in the background or closed.
        var state: [String: Any] = [
            "title": call.getString("title") ?? "Workout",
            "setLabel": call.getString("setLabel") ?? "",
            "next": call.getString("next") ?? "",
            "plates": call.getString("plates") ?? "",
            "chip": call.getString("chip") ?? "",
            "sound": call.getBool("sound") ?? true,
        ]
        if let d = call.getInt("done") { state["done"] = d }
        if let t = call.getInt("total") { state["total"] = t }
        if let r = call.getDouble("restUntil"), r > 0 {
            state["restUntil"] = r
            if let total = call.getDouble("restTotal"), total > 0 { state["restFrom"] = r - total * 1000 }
        }
        WorkoutTaps.remember(state: state, ahead: call.getArray("ahead") ?? [])
        WatchLink.shared.update(watchState(call))
        GarminLink.shared.update(watchState(call))
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [restId])
        let restUntil = call.getDouble("restUntil") ?? 0
        let delay = restUntil / 1000 - Date().timeIntervalSince1970
        guard delay > 0.5 else { return call.resolve() }

        let content = UNMutableNotificationContent()
        content.title = NSLocalizedString("Rest over", comment: "Rest-over alert title")
        content.body = [String(format: NSLocalizedString("Up next: %@", comment: "Rest-over alert, the next set"), call.getString("next") ?? ""), call.getString("plates")].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: "\n")
        content.categoryIdentifier = category
        // Rest-over alert (Workout preferences): iOS can't vibrate a local notification without its sound,
        // or play the sound without the phone's own Sounds & Haptics choice, so "vibrate only" posts a
        // silent banner here and the app buzzes itself when it's open. Android does all four exactly.
        content.sound = (call.getBool("sound") ?? true) ? UNNotificationSound.default : nil
        if #available(iOS 15.0, *) { content.interruptionLevel = .timeSensitive }
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
        center.add(UNNotificationRequest(identifier: restId, content: content, trigger: trigger))
        call.resolve()
    }

    @available(iOS 16.2, *)
    private func updateActivity(_ call: CAPPluginCall) {
        let restUntil = call.getDouble("restUntil").flatMap { $0 > 0 ? Date(timeIntervalSince1970: $0 / 1000) : nil }
        let restTotal = call.getDouble("restTotal") ?? 0
        let restFrom = restUntil.flatMap { restTotal > 0 ? $0.addingTimeInterval(-restTotal) : nil }
        let state = WorkoutAttributes.ContentState(
            title: call.getString("title") ?? "Workout",
            setLabel: call.getString("setLabel") ?? "",
            next: call.getString("next") ?? "",
            plates: call.getString("plates") ?? "",
            restUntil: restUntil,
            restFrom: restFrom,
            hr: call.getInt("hr"),
            chip: call.getString("chip"),
            done: call.getInt("done"),
            total: call.getInt("total")
        )
        // Heart rate arrives about once a second; the system budgets updates, so a change in heart rate alone is
        // pushed at most every 15 s. Anything else (a set logged, rest added) goes out straight away.
        if let last = lastActivityState as? WorkoutAttributes.ContentState {
            var same = last
            same.hr = state.hr
            if same == state && Date().timeIntervalSince(lastHrPush) < 15 { return }
            if same == state { lastHrPush = Date() }
        }
        lastActivityState = state
        let content = ActivityContent(state: state, staleDate: nil)
        // After the app was closed and opened again, carry on with the Live Activity that's still showing.
        if activity == nil { activity = Activity<WorkoutAttributes>.activities.first }
        if let current = activity as? Activity<WorkoutAttributes> {
            Task { await current.update(content) }
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        activity = try? Activity.request(attributes: WorkoutAttributes(startedAt: Date()), content: content, pushType: nil)
        lastHrPush = Date()
    }

    private func endActivity() {
        guard #available(iOS 16.2, *) else { return }
        let current = activity as? Activity<WorkoutAttributes>
        activity = nil
        lastActivityState = nil
        Task {
            // Also ends any activity left over from a previous launch.
            for a in Activity<WorkoutAttributes>.activities where a.id != current?.id { await a.end(nil, dismissalPolicy: .immediate) }
            await current?.end(nil, dismissalPolicy: .immediate)
        }
    }

    /// The home-screen widget's snapshot (src/lib/widget.ts), read by QuickStartWidget in the widget extension.
    /// The extension can only read it through the shared App Group "group.com.getliftsmith.app"; until both targets
    /// have that capability, the snapshot stays in the app's own container and the widget shows its plain buttons.
    @objc func setWidget(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else { return call.resolve() }
        UserDefaults(suiteName: "group.com.getliftsmith.app")?.set(json, forKey: "widget")
        WidgetCenter.shared.reloadTimelines(ofKind: "QuickStart")
        call.resolve()
    }

    /// The fields the watch shows (LiftsmithWatch/WatchState.swift), in the same JSON as Android's.
    private func watchState(_ call: CAPPluginCall) -> [String: Any] {
        var s: [String: Any] = [
            "title": call.getString("title") ?? "Workout",
            "setLabel": call.getString("setLabel") ?? "",
            "next": call.getString("next") ?? "",
            "plates": call.getString("plates") ?? "",
            "vibrate": call.getBool("vibrate") ?? true,
            "sessionId": call.getString("sessionId") ?? "",
        ]
        if let r = call.getDouble("restUntil"), r > 0 { s["restUntil"] = r }
        if let hr = call.getInt("hr") { s["hr"] = hr }
        if let d = call.getInt("done") { s["done"] = d }
        if let t = call.getInt("total") { s["total"] = t }
        if call.getBool("motion") == true { s["motion"] = true }
        return s
    }

    @objc func stop(_ call: CAPPluginCall) {
        WatchLink.shared.stop()
        GarminLink.shared.stop()
        WorkoutTaps.forget()
        endActivity()
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [restId])
        center.removeDeliveredNotifications(withIdentifiers: [restId])
        call.resolve()
    }

    private func ours(_ n: UNNotification) -> Bool {
        n.request.identifier == restId || n.request.content.categoryIdentifier == category
    }

    // The app plays its own sound and haptic when rest ends in the foreground. Reminders go to Capacitor.
    public func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if ours(notification) { return completionHandler([]) }
        if let next = next, next.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler) != nil { return }
        completionHandler([.banner, .list])
    }

    public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        if !ours(response.notification) {
            if let next = next, next.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler) != nil { return }
            return completionHandler()
        }
        let action = response.actionIdentifier
        if action == "log" || action == "add30" { return tap(action, done: completionHandler) }
        completionHandler()
    }
}

/// Log set and +30 s taps on the rest-over alert made while the app isn't open (Android: WorkoutTaps.java). iOS runs
/// the alert's buttons in the background, where the web app is asleep or, if the app was closed, not there at all, so
/// a tap is kept with its time and handed to the web app when the app is next opened, which logs it at that time.
/// Meanwhile the Live Activity moves on by itself to the next set the app worked out ahead of time (sessionAhead.ts),
/// with its rest counting down, and the next rest-over alert is scheduled.
/// Kept in a file in Application Support that stays out of iCloud and computer backups, like the web view's storage.
enum WorkoutTaps {
    static let restId = "liftsmith.rest"
    static let category = "liftsmith.workout"
    /// A whole workout of taps is a few dozen; anything past this is a stuck button, not sets.
    private static let max = 200

    private static var file: URL? {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first?.appendingPathComponent("workout-taps.json")
    }

    private static func load() -> [String: Any] {
        guard let url = file, let data = try? Data(contentsOf: url),
              let d = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return [:] }
        return d
    }

    private static func save(_ d: [String: Any]) {
        guard var url = file, let data = try? JSONSerialization.data(withJSONObject: d) else { return }
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? data.write(to: url, options: .atomic)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try? url.setResourceValues(values)
    }

    /// The app's latest update: what the Live Activity shows now and the sets after it.
    static func remember(state: [String: Any], ahead: [Any]) {
        var d = load()
        d["state"] = state
        d["ahead"] = ahead
        d["aheadAt"] = 0
        d["ended"] = false
        save(d)
    }

    /// The workout ended: nothing left to step through. Taps not yet handed over stay.
    static func forget() {
        var d = load()
        d["state"] = nil
        d["ahead"] = nil
        save(d)
    }

    /// Every kept tap, oldest first, and the list emptied.
    static func drain() -> [[String: Any]] {
        var d = load()
        let taps = d["taps"] as? [[String: Any]] ?? []
        if taps.isEmpty { return [] }
        d["taps"] = nil
        save(d)
        return taps
    }

    /// A tap with the app not open. Calls `done` once the Live Activity and the next alert are updated.
    static func tapped(_ action: String, at: Date = Date(), done: @escaping () -> Void = {}) {
        var d = load()
        guard var state = d["state"] as? [String: Any] else {
            // No workout we know of (the app was closed before it sent one): keep the tap; the app decides.
            keep(action, at: at, in: &d)
            save(d)
            return done()
        }
        let now = at.timeIntervalSince1970 * 1000
        if action == "log" {
            // Every planned set is logged: further taps would log nothing, so they aren't kept either.
            if d["ended"] as? Bool == true { return done() }
            keep(action, at: at, in: &d)
            let ahead = d["ahead"] as? [[String: Any]] ?? []
            let i = d["aheadAt"] as? Int ?? 0
            guard i < ahead.count else {
                save(d)
                return done()
            }
            let step = ahead[i]
            d["aheadAt"] = i + 1
            d["ended"] = step["end"] as? Bool ?? false
            let rest = (step["rest"] as? NSNumber)?.doubleValue ?? 0
            for key in ["title", "setLabel", "next", "plates", "chip", "done", "total"] { state[key] = step[key] }
            state["restUntil"] = rest > 0 ? now + rest * 1000 : 0
            state["restFrom"] = rest > 0 ? now : 0
        } else if action == "add30" {
            let restUntil = (state["restUntil"] as? NSNumber)?.doubleValue ?? 0
            // Like the app's +30 s: only while resting.
            guard restUntil > now else { return done() }
            keep(action, at: at, in: &d)
            state["restUntil"] = restUntil + 30_000
        } else {
            return done()
        }
        d["state"] = state
        save(d)
        scheduleAlert(state)
        show(state, done: done)
    }

    private static func keep(_ action: String, at: Date, in d: inout [String: Any]) {
        var taps = d["taps"] as? [[String: Any]] ?? []
        guard taps.count < max else { return }
        taps.append(["action": action, "at": (at.timeIntervalSince1970 * 1000).rounded()])
        d["taps"] = taps
    }

    private static func date(_ v: Any?) -> Date? {
        guard let ms = (v as? NSNumber)?.doubleValue, ms > 0 else { return nil }
        return Date(timeIntervalSince1970: ms / 1000)
    }

    /// The rest-over alert for the rest that just started (or grew by 30 s), with the same Log set / +30 s buttons.
    private static func scheduleAlert(_ state: [String: Any]) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [restId])
        guard let until = date(state["restUntil"]), until.timeIntervalSinceNow > 0.5 else { return }
        let content = UNMutableNotificationContent()
        content.title = NSLocalizedString("Rest over", comment: "Rest-over alert title")
        let next = state["next"] as? String ?? ""
        let plates = state["plates"] as? String ?? ""
        content.body = [String(format: NSLocalizedString("Up next: %@", comment: "Rest-over alert, the next set"), next), plates].filter { !$0.isEmpty }.joined(separator: "\n")
        content.categoryIdentifier = category
        content.sound = (state["sound"] as? Bool ?? true) ? UNNotificationSound.default : nil
        if #available(iOS 15.0, *) { content.interruptionLevel = .timeSensitive }
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: until.timeIntervalSinceNow, repeats: false)
        center.add(UNNotificationRequest(identifier: restId, content: content, trigger: trigger))
    }

    private static func show(_ state: [String: Any], done: @escaping () -> Void) {
        guard #available(iOS 16.2, *) else { return done() }
        guard let activity = Activity<WorkoutAttributes>.activities.first else { return done() }
        let content = ActivityContent(state: contentState(state), staleDate: nil)
        Task {
            await activity.update(content)
            done()
        }
    }

    @available(iOS 16.2, *)
    static func contentState(_ s: [String: Any]) -> WorkoutAttributes.ContentState {
        WorkoutAttributes.ContentState(
            title: s["title"] as? String ?? "Workout",
            setLabel: s["setLabel"] as? String ?? "",
            next: s["next"] as? String ?? "",
            plates: s["plates"] as? String ?? "",
            restUntil: date(s["restUntil"]),
            restFrom: date(s["restFrom"]),
            hr: nil,
            chip: s["chip"] as? String,
            done: (s["done"] as? NSNumber)?.intValue,
            total: (s["total"] as? NSNumber)?.intValue
        )
    }
}

/// The notification delegate from launch until the bridge sets Capacitor's own (AppDelegate). A Log set or +30 s
/// tap that launched the app in the background lands here, before any web view exists: it goes to WorkoutTaps.
/// Anything else (a reminder) is held and handed to the plugin's delegate chain when it loads.
final class EarlyNotifications: NSObject, UNUserNotificationCenterDelegate {
    static let shared = EarlyNotifications()
    private var held: [(UNNotificationResponse, () -> Void)] = []
    private weak var target: UNUserNotificationCenterDelegate?

    func handOff(to next: UNUserNotificationCenterDelegate?) {
        target = next
        let all = held
        held = []
        for (response, done) in all {
            if let next = next, next.userNotificationCenter?(UNUserNotificationCenter.current(), didReceive: response, withCompletionHandler: done) != nil { continue }
            done()
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if let t = target, t.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler) != nil { return }
        completionHandler(notification.request.content.categoryIdentifier == WorkoutTaps.category ? [] : [.banner, .list])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let action = response.actionIdentifier
        if response.notification.request.content.categoryIdentifier == WorkoutTaps.category, action == "log" || action == "add30" {
            DispatchQueue.main.async { WorkoutTaps.tapped(action, done: completionHandler) }
            return
        }
        if let t = target, t.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler) != nil { return }
        DispatchQueue.main.async {
            self.held.append((response, completionHandler))
            // Never keep iOS waiting: if no web view comes (a launch in the background), let go after 20 s.
            DispatchQueue.main.asyncAfter(deadline: .now() + 20) {
                guard let i = self.held.firstIndex(where: { $0.0 === response }) else { return }
                let (_, done) = self.held.remove(at: i)
                done()
            }
        }
    }
}
