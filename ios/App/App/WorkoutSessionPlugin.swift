import ActivityKit
import Capacitor
import UIKit
import UserNotifications

/// Registers the app's own plugins with the bridge (Capacitor 8 with SPM has no auto-registration
/// for plugins that live in the app target). Main.storyboard and SceneDelegate use this class.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WorkoutSessionPlugin())
        bridge?.registerPluginInstance(CalendarPlugin())
        bridge?.registerPluginInstance(InstallInfoPlugin())
        bridge?.registerPluginInstance(VoiceCoachPlugin())
        bridge?.registerPluginInstance(AppIconPlugin())
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
    ]

    private let restId = "liftsmith.rest"
    private let category = "liftsmith.workout"

    override public func load() {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        let log = UNNotificationAction(identifier: "log", title: "Log set", options: [])
        let add = UNNotificationAction(identifier: "add30", title: "+30 s", options: [])
        center.setNotificationCategories([UNNotificationCategory(identifier: category, actions: [log, add], intentIdentifiers: [], options: [])])

        // Siri, Shortcuts, the Action button and Control Center (ShortcutIntents.swift).
        NotificationCenter.default.addObserver(self, selector: #selector(shortcut(_:)), name: ShortcutInbox.notification, object: nil)
        if let a = ShortcutInbox.pending { deliverShortcut(a) }
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
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [restId])
        let restUntil = call.getDouble("restUntil") ?? 0
        let delay = restUntil / 1000 - Date().timeIntervalSince1970
        guard delay > 0.5 else { return call.resolve() }

        let content = UNMutableNotificationContent()
        content.title = "Rest over"
        content.body = ["Up next: \(call.getString("next") ?? "")", call.getString("plates")].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: "\n")
        content.categoryIdentifier = category
        content.sound = (call.getBool("sound") ?? true) ? UNNotificationSound.default : nil
        if #available(iOS 15.0, *) { content.interruptionLevel = .timeSensitive }
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
        center.add(UNNotificationRequest(identifier: restId, content: content, trigger: trigger))
        call.resolve()
    }

    @available(iOS 16.2, *)
    private func updateActivity(_ call: CAPPluginCall) {
        let restUntil = call.getDouble("restUntil").flatMap { $0 > 0 ? Date(timeIntervalSince1970: $0 / 1000) : nil }
        let state = WorkoutAttributes.ContentState(
            title: call.getString("title") ?? "Workout",
            setLabel: call.getString("setLabel") ?? "",
            next: call.getString("next") ?? "",
            plates: call.getString("plates") ?? "",
            restUntil: restUntil,
            hr: call.getInt("hr")
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

    @objc func stop(_ call: CAPPluginCall) {
        endActivity()
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [restId])
        center.removeDeliveredNotifications(withIdentifiers: [restId])
        call.resolve()
    }

    // The app plays its own sound and haptic when rest ends in the foreground.
    public func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([])
    }

    public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let action = response.actionIdentifier
        if action == "log" || action == "add30" {
            notifyListeners("action", data: ["action": action], retainUntilConsumed: true)
        }
        completionHandler()
    }
}
