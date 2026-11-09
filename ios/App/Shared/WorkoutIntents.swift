import AppIntents
import Foundation

// Shared by the app and the widget extension (LiftsmithWidgets). In the app they back Siri and the App Shortcuts
// (ShortcutIntents.swift); in the extension, the iOS 18 Control Center control runs StartWorkoutIntent, which opens
// the app (openAppWhenRun), so perform() always runs in the app process.

/// Carries a shortcut action to the web app. `pending` holds it when the app was cold-started and the plugin
/// hasn't loaded yet; the plugin delivers it on load.
enum ShortcutInbox {
    static let notification = Notification.Name("liftsmith.shortcut")
    static var pending: String?

    static func send(_ action: String) {
        pending = action
        NotificationCenter.default.post(name: notification, object: nil, userInfo: ["action": action])
    }

    /// Widget and Live Activity links: liftsmith://start, liftsmith://log, liftsmith://add30. Returns whether the URL was ours.
    @discardableResult
    static func open(_ url: URL) -> Bool {
        guard url.scheme == "liftsmith", let a = url.host, ["start", "log", "add30"].contains(a) else { return false }
        send(a)
        return true
    }
}

@available(iOS 16.0, *)
struct StartWorkoutIntent: AppIntent {
    static let title: LocalizedStringResource = "Start workout"
    static let description: IntentDescription? = IntentDescription("Opens Liftsmith and starts today's workout, or the one already running.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        ShortcutInbox.send("start")
        return .result()
    }
}

@available(iOS 16.0, *)
struct LogSetIntent: AppIntent {
    static let title: LocalizedStringResource = "Log set"
    static let description: IntentDescription? = IntentDescription("Logs the current set as planned. Does nothing when no workout is running.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        ShortcutInbox.send("log")
        return .result()
    }
}

@available(iOS 16.0, *)
struct AddRestIntent: AppIntent {
    static let title: LocalizedStringResource = "Add 30 seconds of rest"
    static let description: IntentDescription? = IntentDescription("Adds 30 seconds to the rest timer.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        ShortcutInbox.send("add30")
        return .result()
    }
}
