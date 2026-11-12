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
        /// Start of the current rest (+30 s included), for the rest bar that empties as rest runs out (Android: the same bar).
        var restFrom: Date?
        var hr: Int?
        /// A few characters for the compact Dynamic Island while lifting ("2/4"); Android's status bar chip shows the same.
        var chip: String?
        /// Working sets logged and planned in the whole workout, for the progress bar (Android: the notification's bar).
        var done: Int?
        var total: Int?
        /// The set timer for holds, carries and cardio, phase by phase (src/lib/sessionNotify.ts TimerSegment); only
        /// while lifting. Android: TimerPhases.java in its notification.
        var timer: [TimerPhase]? = nil
        /// What it says once the last phase has run out ("Time's up"), until the app logs the set.
        var timerOver: String? = nil

        /// The timer's phase at `now` (started, not ended); never while resting. Same rule as the phone's other apps.
        func phase(at now: Date) -> TimerPhase? {
            if let until = restUntil, until > now { return nil }
            return timer?.first { $0.from <= now && ($0.to.map { now < $0 } ?? true) }
        }

        /// The hold has run out (the last phase had an end and it's past).
        func timerDone(at now: Date) -> Bool {
            guard let last = timer?.last, let to = last.to else { return false }
            return now >= to && phase(at: now) == nil
        }

        /// The next moment the view must change by itself: rest ending, or the timer moving to its next phase.
        func nextChange(after now: Date) -> Date? {
            let bounds = [restUntil].compactMap { $0 } + (timer ?? []).compactMap { $0.to }
            return bounds.filter { $0 > now }.min()
        }
    }

    /// One phase of the set timer: counts down to `to` ("Time left", "Switch sides"…), or up from `from` with no end.
    struct TimerPhase: Codable, Hashable {
        var from: Date
        var to: Date?
        var label: String

        /// From the app's JSON ({from, to?, label} in ms since 1970), dropping anything that isn't a real phase.
        static func parse(_ list: [Any]?) -> [TimerPhase]? {
            let phases: [TimerPhase] = (list ?? []).prefix(8).compactMap { item in
                guard let o = item as? [String: Any], let from = (o["from"] as? NSNumber)?.doubleValue, from > 0 else { return nil }
                let to = (o["to"] as? NSNumber)?.doubleValue
                if let to, to <= from { return nil }
                return TimerPhase(
                    from: Date(timeIntervalSince1970: from / 1000),
                    to: to.map { Date(timeIntervalSince1970: $0 / 1000) },
                    label: o["label"] as? String ?? ""
                )
            }
            return phases.isEmpty ? nil : phases
        }
    }

    var startedAt: Date
}
