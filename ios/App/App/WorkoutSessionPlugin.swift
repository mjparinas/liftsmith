import Capacitor
import UIKit
import UserNotifications

/// Registers the app's own plugins with the bridge (Capacitor 8 with SPM has no auto-registration
/// for plugins that live in the app target). Main.storyboard and SceneDelegate use this class.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WorkoutSessionPlugin())
    }
}

/// The live workout notification, iOS side (Android: WorkoutSessionPlugin.java + WorkoutService.java).
/// src/lib/sessionNotify.ts calls the same methods on both platforms.
///
/// iOS can't keep an ongoing notification, so for now this schedules the end-of-rest alert as a time
/// sensitive local notification with the same Log set / +30 s buttons. The lock-screen countdown
/// (a Live Activity) is tracked in AGENTS.md, Open items.
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

    @objc func update(_ call: CAPPluginCall) {
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

    @objc func stop(_ call: CAPPluginCall) {
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
