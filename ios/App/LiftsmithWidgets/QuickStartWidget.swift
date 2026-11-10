import SwiftUI
import WidgetKit

/// Home-screen and lock-screen widget: today's call and length with its one-line why, the weekly goal and the top
/// coach's note, with Start (Resume and Log set while a workout runs). The app builds every line (src/lib/widget.ts)
/// and saves it through WorkoutSessionPlugin.setWidget into the App Group; this only draws it. Without the App Group
/// (or before the app has run), it shows the plain Start and Log set buttons. Android counterpart: WorkoutWidget.java.
///
/// Battery: the timeline has two entries, now and just after midnight (when the plan turns into "open for today's
/// plan"), and never asks to be woken; the app reloads it when the snapshot changes.
struct QuickStartWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "QuickStart", provider: Provider()) { entry in
            QuickStartView(entry: entry)
        }
        .configurationDisplayName("Today's workout")
        .description("Today's workout and why, your weekly goal and coach's note, with Start.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular])
    }

    struct Entry: TimelineEntry {
        let date: Date
        let snap: Snapshot?
        /// The snapshot was built for an earlier day.
        let stale: Bool
    }

    /// What src/lib/widget.ts sends (WidgetSnapshot, v 1).
    struct Snapshot: Decodable {
        let v: Int
        let day: String
        let kind: String
        let title: String
        let why: String
        let goal: String
        let note: String
        let start: String
        let log: String
        let stale: String

        static func load() -> Snapshot? {
            guard let json = UserDefaults(suiteName: "group.com.getliftsmith.app")?.string(forKey: "widget"),
                  let data = json.data(using: .utf8),
                  let s = try? JSONDecoder().decode(Snapshot.self, from: data), s.v == 1 else { return nil }
            return s
        }
    }

    /// Same format as dayKey in src/lib/random.ts: local year-month-day, no padding.
    static func dayKey(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return "\(c.year ?? 0)-\(c.month ?? 0)-\(c.day ?? 0)"
    }

    struct Provider: TimelineProvider {
        func entry(at date: Date) -> Entry {
            let s = Snapshot.load()
            return Entry(date: date, snap: s, stale: s.map { $0.day != QuickStartWidget.dayKey(date) } ?? false)
        }

        func placeholder(in context: Context) -> Entry { Entry(date: Date(), snap: nil, stale: false) }
        func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(entry(at: Date())) }
        func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
            let now = Date()
            let midnight = Calendar.current.startOfDay(for: now).addingTimeInterval(86_400 + 60)
            completion(Timeline(entries: [entry(at: now), entry(at: midnight)], policy: .never))
        }
    }
}

struct QuickStartView: View {
    @Environment(\.widgetFamily) private var family
    let entry: QuickStartWidget.Entry

    private var snap: QuickStartWidget.Snapshot? { entry.snap }
    /// Every line comes from the app in the lifter's language; once stale, the title says to open the app for today.
    private var title: String { (entry.stale ? snap?.stale : snap?.title) ?? String(localized: "Start workout") }
    private var why: String { entry.stale ? "" : snap?.why ?? "" }
    private var startLabel: String { snap?.start ?? String(localized: "Start workout") }
    /// Log set shows while a workout runs, or always in the plain fallback (it does nothing without a workout).
    private var logLabel: String { snap == nil ? String(localized: "Log set") : entry.stale ? "" : snap?.log ?? "" }
    private var hue: Color {
        switch entry.stale ? "normal" : snap?.kind ?? "normal" {
        case "push": return Brand.ember
        case "recover", "rest": return Brand.cyan
        case "active": return Brand.mint
        case "program": return Brand.violet
        default: return Brand.accent
        }
    }

    var body: some View {
        switch family {
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                Image(systemName: "figure.strengthtraining.traditional").font(.title2)
            }
            .widgetURL(Brand.start)
            .widgetBackground(.clear)
        case .accessoryRectangular:
            VStack(alignment: .leading) {
                Text(title).font(.headline).lineLimit(1)
                Text(why.isEmpty ? "Liftsmith" : why).font(.caption).lineLimit(2)
            }
            .widgetURL(Brand.start)
            .widgetBackground(.clear)
        case .systemSmall:
            VStack(alignment: .leading, spacing: 6) {
                header
                if !why.isEmpty { Text(why).font(.caption).foregroundStyle(Brand.muted).lineLimit(3) }
                Spacer(minLength: 0)
                button(startLabel, Brand.start, primary: true)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetURL(Brand.start)
            .widgetBackground(Brand.bg)
        default:
            VStack(alignment: .leading, spacing: 6) {
                if snap != nil {
                    header
                    if !why.isEmpty { Text(why).font(.footnote).foregroundStyle(Brand.muted).lineLimit(2) }
                    if !entry.stale, let goal = snap?.goal, !goal.isEmpty {
                        Text(goal).font(.footnote).foregroundStyle(Brand.ember).lineLimit(2)
                    }
                    if family == .systemLarge, !entry.stale, let note = snap?.note, !note.isEmpty {
                        Text(note).font(.footnote).foregroundStyle(Brand.violet).lineLimit(3)
                    }
                }
                Spacer(minLength: 0)
                HStack(spacing: 8) {
                    button(startLabel, Brand.start, primary: true)
                    if !logLabel.isEmpty { button(logLabel, Brand.log, primary: false) }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground(Brand.bg)
        }
    }

    private var header: some View {
        HStack(spacing: 6) {
            Circle().fill(hue).frame(width: 9, height: 9).accessibilityHidden(true)
            Text(title).font(.headline).foregroundStyle(.white).lineLimit(entry.stale ? 2 : 1)
        }
    }

    private func button(_ label: String, _ url: URL, primary: Bool) -> some View {
        Link(destination: url) {
            Text(label)
                .font(.subheadline.bold())
                .lineLimit(1)
                .foregroundStyle(primary ? Brand.bg : .white)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(primary ? Brand.accent : Brand.card, in: RoundedRectangle(cornerRadius: 14))
        }
    }
}
