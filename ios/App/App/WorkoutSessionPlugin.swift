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

    private let restId = "liftsmith.rest"
    private let category = "liftsmith.workout"
    /// Capacitor's own notification router, which delivers reminder taps to @capacitor/local-notifications.
    /// This plugin only handles the workout's own notifications and passes everything else on to it.
    private weak var next: UNUserNotificationCenterDelegate?

    override public func load() {
        let center = UNUserNotificationCenter.current()
        next = (center.delegate !== self ? center.delegate : nil) ?? (bridge?.notificationRouter as UNUserNotificationCenterDelegate?)
        center.delegate = self
        let log = UNNotificationAction(identifier: "log", title: NSLocalizedString("Log set", comment: "Rest-over alert button"), options: [])
        let add = UNNotificationAction(identifier: "add30", title: "+30 s", options: [])
        center.setNotificationCategories([UNNotificationCategory(identifier: category, actions: [log, add], intentIdentifiers: [], options: [])])

        // Siri, Shortcuts, the Action button and Control Center (ShortcutIntents.swift).
        NotificationCenter.default.addObserver(self, selector: #selector(shortcut(_:)), name: ShortcutInbox.notification, object: nil)
        if let a = ShortcutInbox.pending { deliverShortcut(a) }

        // The Apple Watch app (WatchLink.swift): its taps work like the Live Activity's buttons, and its heart
        // rate is used when no Bluetooth monitor is connected.
        WatchLink.shared.onAction = { [weak self] a in self?.notifyListeners("action", data: ["action": a], retainUntilConsumed: true) }
        WatchLink.shared.onHeartRate = { [weak self] bpm in self?.notifyListeners("heartRate", data: ["bpm": bpm]) }
        WatchLink.shared.start()
        // The Garmin watch app (GarminLink.swift, garmin/): the same taps and heart rate.
        GarminLink.shared.onAction = WatchLink.shared.onAction
        GarminLink.shared.onHeartRate = WatchLink.shared.onHeartRate
        GarminLink.shared.restore()
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
        return s
    }

    @objc func stop(_ call: CAPPluginCall) {
        WatchLink.shared.stop()
        GarminLink.shared.stop()
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
        if action == "log" || action == "add30" {
            notifyListeners("action", data: ["action": action], retainUntilConsumed: true)
        }
        completionHandler()
    }
}
