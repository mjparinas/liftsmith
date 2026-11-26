import Foundation
#if canImport(WidgetKit)
import WidgetKit
#endif

/// Today's call as the phone sends it for the complication (WatchMessages.today in the phone's WatchLink.swift, built
/// from the home-screen widget's snapshot in src/lib/widget.ts): the day it was made for, the kind of day,
/// "Push · 45 min", the reason, and the short pieces a watch face has room for. Shared by the watch app, which keeps
/// it, and the LiftsmithWatchWidgets extension, which draws it. Same fields as Wear OS's TodayState.java.
struct WatchToday: Codable, Equatable {
    var day: String
    var kind: String
    var title: String
    var why: String
    var stale: String
    var call: String
    var mins: String
    var ready: String

    static func parse(_ json: String?) -> WatchToday? {
        guard let json, let data = json.data(using: .utf8),
              let o = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        func s(_ k: String) -> String { o[k] as? String ?? "" }
        let t = WatchToday(day: s("day"), kind: s("kind"), title: s("title"), why: s("why"), stale: s("stale"),
                           call: s("call").isEmpty ? s("title") : s("call"), mins: s("mins"), ready: s("ready"))
        return t.day.isEmpty || t.title.isEmpty ? nil : t
    }

    /// The phone's day key (src/lib/random.ts dayKey): "2026-11-26" without leading zeros, on the watch's clock.
    static func dayKey(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return "\(c.year ?? 0)-\(c.month ?? 0)-\(c.day ?? 0)"
    }

    /// Made for today. Yesterday's plan is never shown as today's.
    func current(at date: Date) -> Bool { day == Self.dayKey(date) }

    var active: Bool { kind == "active" }

    /// "45 min · Readiness 82", leaving out what's empty.
    var detail: String { [mins, mins.isEmpty ? "" : ready].filter { !$0.isEmpty }.joined(separator: " · ") }

    // MARK: Kept on the watch

    /// The watch app and its complication share it through the App Group. Until both targets have that capability
    /// (an Apple Developer portal step, open items "iOS (deferred)") the suite is the app's own and the complication
    /// shows its plain Liftsmith mark.
    static let group = "group.com.getliftsmith.app"
    private static let key = "watchToday"

    static func load() -> WatchToday? {
        WatchToday.parse(UserDefaults(suiteName: group)?.string(forKey: key) ?? UserDefaults.standard.string(forKey: key))
    }

    /// A new call from the phone (nil when the phone took it away), then the complication redraws.
    static func save(_ json: String?) {
        for d in [UserDefaults(suiteName: group), UserDefaults.standard].compactMap({ $0 }) {
            if let json { d.set(json, forKey: key) } else { d.removeObject(forKey: key) }
        }
        #if canImport(WidgetKit)
        WidgetCenter.shared.reloadAllTimelines()
        #endif
    }
}
