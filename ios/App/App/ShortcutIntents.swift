import AppIntents
import Foundation

/// Voice and system shortcuts, iOS side (Android: res/xml/shortcuts.xml, WorkoutTileService.java).
/// App Shortcuts show up in Siri ("Start a workout in Liftsmith"), Spotlight and the Shortcuts app with no setup,
/// and the lifter can put any of them on the Action button or in Control Center (iOS 18) as a Shortcut control.
/// Each intent opens the app and hands its action to src/lib/shortcuts.ts through WorkoutSessionPlugin.

/// Carries a shortcut action to the web app. `pending` holds it when the app was cold-started and the plugin
/// hasn't loaded yet; the plugin delivers it on load.
enum ShortcutInbox {
    static let notification = Notification.Name("liftsmith.shortcut")
    static var pending: String?

    static func send(_ action: String) {
        pending = action
        NotificationCenter.default.post(name: notification, object: nil, userInfo: ["action": action])
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

@available(iOS 16.0, *)
struct LiftsmithShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartWorkoutIntent(),
            phrases: ["Start a workout in \(.applicationName)", "Start \(.applicationName)", "Start my \(.applicationName) workout"],
            shortTitle: "Start workout",
            systemImageName: "figure.strengthtraining.traditional"
        )
        AppShortcut(
            intent: LogSetIntent(),
            phrases: ["Log set in \(.applicationName)", "Log a set in \(.applicationName)"],
            shortTitle: "Log set",
            systemImageName: "checkmark.circle"
        )
        AppShortcut(
            intent: AddRestIntent(),
            phrases: ["Add rest in \(.applicationName)", "More rest in \(.applicationName)"],
            shortTitle: "+30 s rest",
            systemImageName: "timer"
        )
    }
}
