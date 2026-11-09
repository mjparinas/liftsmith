import AppIntents
import Foundation

/// Voice and system shortcuts, iOS side (Android: res/xml/shortcuts.xml, WorkoutTileService.java).
/// App Shortcuts show up in Siri ("Start a workout in Liftsmith"), Spotlight and the Shortcuts app with no setup,
/// and the lifter can put any of them on the Action button or in Control Center (iOS 18) as a Shortcut control.
/// Each intent opens the app and hands its action to src/lib/shortcuts.ts through WorkoutSessionPlugin.

// The intents themselves and ShortcutInbox live in ../Shared/WorkoutIntents.swift, which the widget extension
// also compiles so its Control Center control can run StartWorkoutIntent.

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
