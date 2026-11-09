import SwiftUI
import WidgetKit

/// Home-screen and lock-screen widget. Small and lock-screen sizes start today's workout (or reopen the one running);
/// the medium size adds Log set. Android counterpart: WorkoutWidget.java.
struct QuickStartWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "QuickStart", provider: Provider()) { _ in
            QuickStartView()
        }
        .configurationDisplayName("Start workout")
        .description("Start today's workout or log a set in one tap.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
    }

    struct Entry: TimelineEntry {
        let date: Date
    }

    struct Provider: TimelineProvider {
        func placeholder(in context: Context) -> Entry { Entry(date: Date()) }
        func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date())) }
        func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
            completion(Timeline(entries: [Entry(date: Date())], policy: .never))
        }
    }
}

struct QuickStartView: View {
    @Environment(\.widgetFamily) private var family

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
                Text("Liftsmith").font(.headline)
                Text("Start workout")
            }
            .widgetURL(Brand.start)
            .widgetBackground(.clear)
        case .systemMedium:
            HStack(spacing: 12) {
                tile("Start workout", "figure.strengthtraining.traditional", Brand.start, primary: true)
                tile("Log set", "checkmark.circle", Brand.log, primary: false)
            }
            .padding(4)
            .widgetBackground(Brand.bg)
        default:
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: "figure.strengthtraining.traditional").font(.title).foregroundStyle(Brand.accent)
                Spacer()
                Text("Start workout").font(.headline).foregroundStyle(.white)
                Text("Liftsmith").font(.caption).foregroundStyle(Brand.muted)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetURL(Brand.start)
            .widgetBackground(Brand.bg)
        }
    }

    private func tile(_ label: String, _ icon: String, _ url: URL, primary: Bool) -> some View {
        Link(destination: url) {
            VStack(spacing: 8) {
                Image(systemName: icon).font(.title2)
                Text(label).font(.headline)
            }
            .foregroundStyle(primary ? Brand.bg : .white)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(primary ? Brand.accent : Brand.card, in: RoundedRectangle(cornerRadius: 16))
        }
    }
}
