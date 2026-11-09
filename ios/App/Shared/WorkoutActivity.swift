import ActivityKit
import Foundation

/// The Live Activity for a running workout: the lock-screen and Dynamic Island rest countdown, the next set and its
/// plates, and heart rate. The app starts, updates and ends it (WorkoutSessionPlugin.swift); the widget extension
/// draws it (LiftsmithWidgets/WorkoutLiveActivity.swift). Android counterpart: WorkoutService.java's ongoing notification.
@available(iOS 16.1, *)
struct WorkoutAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var title: String
        var setLabel: String
        var next: String
        var plates: String
        /// End of the current rest, or nil while lifting.
        var restUntil: Date?
        var hr: Int?
    }

    var startedAt: Date
}
