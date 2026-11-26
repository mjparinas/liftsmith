import SwiftUI
import WidgetKit

/// Today's call on the Apple Watch face (Melvin picked it, 2026-11-26): the circular slot shows the call's first
/// letters with its length, the rectangular one "Push · 45 min" with readiness and the reason, the inline one a line,
/// and the corner one the call. A tap opens the watch app, which shows the same call. watchOS can't open the iPhone
/// app from the watch, so there's no Start on phone here (Platform deltas). The phone sends a new call only when
/// a line changes and the timeline has one more entry at midnight, so yesterday's plan never shows as today's.
@main
struct LiftsmithWatchWidgets: WidgetBundle {
    var body: some Widget {
        TodayComplication()
    }
}

struct TodayEntry: TimelineEntry {
    let date: Date
    let today: WatchToday?

    /// Today's call, or nil when there's none for this day (the phone hasn't sent today's yet).
    var shown: WatchToday? {
        guard let t = today, t.current(at: date) else { return nil }
        return t
    }
}

struct TodayProvider: TimelineProvider {
    func placeholder(in context: Context) -> TodayEntry {
        TodayEntry(date: .now, today: WatchToday(day: WatchToday.dayKey(.now), kind: "push", title: "Push · 45 min", why: "",
                                                 stale: "", call: "Push", mins: "45 min", ready: "Readiness 82"))
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : TodayEntry(date: .now, today: WatchToday.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        let today = WatchToday.load()
        let now = Date()
        let midnight = Calendar.current.startOfDay(for: now).addingTimeInterval(86_400 + 5)
        // Now, and again just after midnight, when today's call goes stale; the phone's next call reloads it.
        completion(Timeline(entries: [TodayEntry(date: now, today: today), TodayEntry(date: midnight, today: today)], policy: .never))
    }
}

struct TodayComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LiftsmithToday", provider: TodayProvider()) { entry in
            TodayView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Liftsmith")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner])
    }
}

struct TodayView: View {
    let entry: TodayEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let t = entry.shown
        switch family {
        case .accessoryCircular:
            VStack(spacing: 0) {
                Image(systemName: "dumbbell.fill").font(.caption2)
                Text(t?.call ?? "Liftsmith").font(.caption2.bold()).lineLimit(1).minimumScaleFactor(0.5)
                if let m = t?.mins, !m.isEmpty { Text(m).font(.system(.caption2, design: .rounded)).lineLimit(1).minimumScaleFactor(0.5) }
            }
            .widgetAccentable()
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Label(t?.title ?? "Liftsmith", systemImage: "dumbbell.fill").font(.headline).lineLimit(1).widgetAccentable()
                if let t {
                    if !t.detail.isEmpty { Text(t.detail).font(.caption).lineLimit(1) }
                    if !t.why.isEmpty { Text(t.why).font(.caption2).foregroundStyle(.secondary).lineLimit(2) }
                } else if let stale = entry.today?.stale, !stale.isEmpty {
                    Text(stale).font(.caption2).foregroundStyle(.secondary).lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        case .accessoryCorner:
            Image(systemName: "dumbbell.fill")
                .widgetLabel {
                    Text(verbatim: t.map { $0.mins.isEmpty ? $0.call : "\($0.call) · \($0.mins)" } ?? "Liftsmith")
                }
        default:
            Text(t.map { $0.detail.isEmpty ? $0.title : "\($0.call) · \($0.detail)" } ?? "Liftsmith")
        }
    }
}
