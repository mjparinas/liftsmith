import SwiftUI
import WidgetKit

// The This week and Recovery widgets (Melvin chose both, 2026-11-15), beside the Today widget (QuickStartWidget).
// Both read the same App Group snapshot as Today: the app builds every line (src/lib/widget.ts weekPart and
// recoveryPart) and this only draws it. Android counterparts: WeekWidget.java and RecoveryWidget.java.
//
// Battery: timelines never ask to be woken. This week has entries now and just after midnight; Recovery adds an
// entry at each time an area becomes ready, so it moves areas to "Ready to train" without the app running.

/// The two optional parts of the snapshot. Older app builds don't send them, and the widgets then show only Start.
private struct Parts: Decodable {
    let v: Int
    let day: String
    let start: String
    let stale: String
    let week: Week?
    let rec: Rec?

    struct Week: Decodable {
        let title: String
        let streak: String
        let why: String
        let days: [Day]
    }

    struct Day: Decodable {
        let l: String
        let m: String
        let today: Bool
    }

    struct Rec: Decodable {
        let ready: String
        let resting: String
        let all: String
        let sep: String
        let areas: [Area]
    }

    struct Area: Decodable {
        let n: String
        /// Milliseconds since 1970 when the area is ready; 0 when it already is.
        let at: Double
        let line: String
    }

    static func load() -> Parts? {
        guard let json = UserDefaults(suiteName: "group.com.getliftsmith.app")?.string(forKey: "widget"),
              let data = json.data(using: .utf8),
              let p = try? JSONDecoder().decode(Parts.self, from: data), p.v == 1 else { return nil }
        return p
    }
}

private struct PartsEntry: TimelineEntry {
    let date: Date
    let parts: Parts?
    var stale: Bool { parts.map { $0.day != QuickStartWidget.dayKey(date) } ?? false }
    var startLabel: String { parts.map { stale ? String(localized: "Start workout") : $0.start } ?? String(localized: "Start workout") }
}

private struct PartsProvider: TimelineProvider {
    /// Recovery also redraws when each area becomes ready.
    let followRecovery: Bool

    func placeholder(in context: Context) -> PartsEntry { PartsEntry(date: Date(), parts: nil) }
    func getSnapshot(in context: Context, completion: @escaping (PartsEntry) -> Void) {
        completion(PartsEntry(date: Date(), parts: Parts.load()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<PartsEntry>) -> Void) {
        let now = Date()
        let parts = Parts.load()
        let midnight = Calendar.current.startOfDay(for: now).addingTimeInterval(86_400 + 60)
        var dates = [now, midnight]
        if followRecovery, let areas = parts?.rec?.areas {
            dates += areas.map { Date(timeIntervalSince1970: $0.at / 1000) }.filter { $0 > now && $0 < midnight }
        }
        let entries = Set(dates).sorted().map { PartsEntry(date: $0, parts: parts) }
        completion(Timeline(entries: entries, policy: .never))
    }
}

private func startButton(_ label: String) -> some View {
    Link(destination: Brand.start) {
        Text(label)
            .font(.subheadline.bold())
            .lineLimit(1)
            .foregroundStyle(Brand.bg)
            .frame(maxWidth: .infinity, minHeight: 44)
            .background(Brand.accent, in: RoundedRectangle(cornerRadius: 14))
    }
}

// MARK: - This week

struct WeekWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "Week", provider: PartsProvider(followRecovery: false)) { entry in
            WeekView(entry: entry)
        }
        .configurationDisplayName("This week")
        .description("Your week at a glance: days trained, your streak and what keeps it going, with Start.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

private struct WeekView: View {
    @Environment(\.widgetFamily) private var family
    let entry: PartsEntry

    private var week: Parts.Week? { entry.stale ? nil : entry.parts?.week }

    var body: some View {
        switch family {
        case .accessoryRectangular:
            VStack(alignment: .leading) {
                Text(week?.title ?? String(localized: "This week")).font(.headline).lineLimit(1)
                Text(week.map { $0.streak.isEmpty ? $0.why : $0.streak } ?? "Liftsmith").font(.caption).lineLimit(2)
            }
            .widgetURL(Brand.start)
            .widgetBackground(.clear)
        default:
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(week?.title ?? String(localized: "This week")).font(.headline).foregroundStyle(.white).lineLimit(1)
                    Spacer(minLength: 4)
                    if let streak = week?.streak, !streak.isEmpty, family != .systemSmall {
                        Text(streak).font(.footnote.bold()).foregroundStyle(Brand.ember).lineLimit(1)
                    }
                }
                if let week {
                    strip(week)
                    Text(week.why).font(.footnote).foregroundStyle(Brand.muted).lineLimit(2)
                } else if let stale = entry.parts?.stale, entry.stale {
                    Text(stale).font(.footnote).foregroundStyle(Brand.muted).lineLimit(2)
                }
                Spacer(minLength: 0)
                if family != .systemSmall { startButton(entry.startLabel) }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetURL(Brand.start)
            .widgetBackground(Brand.bg)
        }
    }

    /// Each mark has its own shape as well as colour: trained and stretch days filled, planned a ring, rest a small dot.
    private func strip(_ week: Parts.Week) -> some View {
        HStack(spacing: 0) {
            ForEach(Array(week.days.enumerated()), id: \.offset) { _, d in
                VStack(spacing: 4) {
                    Text(d.l).font(.caption2.bold()).foregroundStyle(d.today ? .white : Brand.muted)
                    mark(d.m)
                }
                .frame(maxWidth: .infinity)
            }
        }
        // Read as one line: the title and what to do.
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text("\(week.title). \(week.why)"))
    }

    @ViewBuilder
    private func mark(_ m: String) -> some View {
        switch m {
        case "done": Circle().fill(Brand.mint).frame(width: 12, height: 12)
        case "stretch": Circle().fill(Brand.cyan).frame(width: 12, height: 12)
        case "plan": Circle().strokeBorder(Brand.accent, lineWidth: 2).frame(width: 12, height: 12)
        default: Circle().fill(Brand.muted.opacity(0.6)).frame(width: 5, height: 5).frame(width: 12, height: 12)
        }
    }
}

// MARK: - Recovery

struct RecoveryWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "Recovery", provider: PartsProvider(followRecovery: true)) { entry in
            RecoveryView(entry: entry)
        }
        .configurationDisplayName("Recovery")
        .description("Which muscles are ready to train and when the rest will be, with Start.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular])
    }
}

private struct RecoveryView: View {
    @Environment(\.widgetFamily) private var family
    let entry: PartsEntry
    private static let muscles = URL(string: "liftsmith://muscles")!

    private var rec: Parts.Rec? { entry.parts?.rec }
    private var readyNames: [String] {
        let now = entry.date.timeIntervalSince1970 * 1000
        return rec?.areas.filter { $0.at <= now }.map(\.n) ?? []
    }
    private var resting: [String] {
        let now = entry.date.timeIntervalSince1970 * 1000
        return rec?.areas.filter { $0.at > now }.sorted { $0.at < $1.at }.map(\.line) ?? []
    }
    private var readyLine: String {
        guard let rec else { return "" }
        if resting.isEmpty { return rec.all }
        return readyNames.isEmpty ? "–" : readyNames.joined(separator: rec.sep)
    }

    var body: some View {
        switch family {
        case .accessoryRectangular:
            VStack(alignment: .leading) {
                Text(rec?.ready ?? String(localized: "Recovery")).font(.headline).lineLimit(1)
                Text(rec == nil ? "Liftsmith" : readyLine).font(.caption).lineLimit(2)
            }
            .widgetURL(Self.muscles)
            .widgetBackground(.clear)
        default:
            VStack(alignment: .leading, spacing: 4) {
                Text(rec?.ready ?? String(localized: "Recovery")).font(.footnote.bold()).foregroundStyle(Brand.mint).lineLimit(1)
                if rec != nil {
                    Text(readyLine).font(.headline).foregroundStyle(.white).lineLimit(family == .systemSmall ? 3 : 2)
                }
                if let rec, !resting.isEmpty, family != .systemSmall {
                    Text(rec.resting).font(.footnote.bold()).foregroundStyle(Brand.ember).lineLimit(1).padding(.top, 4)
                    ForEach(resting.prefix(family == .systemLarge ? 6 : 2), id: \.self) { line in
                        Text(line).font(.footnote).foregroundStyle(Brand.muted).lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
                if family != .systemSmall { startButton(entry.startLabel) }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetURL(Self.muscles)
            .widgetBackground(Brand.bg)
        }
    }
}
