import ActivityKit
import SwiftUI
import WidgetKit

/// The lock-screen and Dynamic Island view of a running workout: the rest countdown, the next set and plates, heart
/// rate, and Log set / +30 s links. Android counterpart: WorkoutService.java's ongoing notification.
struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutAttributes.self) { context in
            LockScreenView(state: context.state)
                .activityBackgroundTint(Brand.bg)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.setLabel).font(.caption).foregroundStyle(Brand.muted)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Countdown(state: context.state).font(.title3.monospacedDigit()).foregroundStyle(Brand.accent)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(context.state.next).font(.headline)
                        if !context.state.plates.isEmpty {
                            Text(context.state.plates).font(.caption).foregroundStyle(Brand.muted)
                        }
                        WorkoutProgress(state: context.state)
                        Actions()
                    }
                }
            } compactLeading: {
                Image(systemName: "dumbbell.fill").foregroundStyle(Brand.accent)
            } compactTrailing: {
                Countdown(state: context.state).monospacedDigit().frame(maxWidth: 52)
            } minimal: {
                Image(systemName: "dumbbell.fill").foregroundStyle(Brand.accent)
            }
            .widgetURL(URL(string: "liftsmith://open"))
        }
    }
}

/// The rest countdown while resting (the system ticks it, no updates needed), otherwise the set ("2/4"), or "Lift".
struct Countdown: View {
    let state: WorkoutAttributes.ContentState

    var body: some View {
        if let until = state.restUntil, until > Date() {
            Text(timerInterval: Date()...until, countsDown: true)
        } else if let chip = state.chip, !chip.isEmpty {
            Text(chip)
        } else {
            Text("Lift")
        }
    }
}

/// While resting, a rest bar that empties as rest runs out (the system animates it, no updates needed); otherwise
/// working sets logged of those planned in the whole workout. Android shows the same bars in its notification.
struct WorkoutProgress: View {
    let state: WorkoutAttributes.ContentState

    var body: some View {
        if let until = state.restUntil, let from = state.restFrom, until > Date(), from < until {
            ProgressView(timerInterval: from...until, countsDown: true) {
                EmptyView()
            } currentValueLabel: {
                EmptyView()
            }
            .tint(Brand.accent)
            .accessibilityLabel(Text("Rest left"))
        } else if let total = state.total, total > 0 {
            ProgressView(value: Double(min(state.done ?? 0, total)), total: Double(total))
                .tint(Brand.accent)
                .accessibilityLabel("\(min(state.done ?? 0, total)) of \(total) sets done")
        }
    }
}

struct Actions: View {
    var body: some View {
        HStack(spacing: 8) {
            Link(destination: Brand.log) {
                Label("Log set", systemImage: "checkmark").frame(maxWidth: .infinity).padding(.vertical, 8)
                    .background(Brand.accent, in: Capsule()).foregroundStyle(Brand.bg)
            }
            Link(destination: Brand.add30) {
                Text("+30 s").frame(maxWidth: .infinity).padding(.vertical, 8)
                    .background(Brand.card, in: Capsule()).foregroundStyle(.white)
            }
        }
        .font(.subheadline.bold())
    }
}

struct LockScreenView: View {
    let state: WorkoutAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.title).font(.headline).foregroundStyle(.white).lineLimit(1)
                    Text(state.setLabel).font(.caption).foregroundStyle(Brand.muted)
                }
                Spacer()
                Countdown(state: state).font(.title.monospacedDigit().bold()).foregroundStyle(Brand.accent)
                    .multilineTextAlignment(.trailing).frame(maxWidth: 110, alignment: .trailing)
            }
            HStack {
                Text("Next: \(state.next)").font(.subheadline).foregroundStyle(.white)
                Spacer()
                if let hr = state.hr {
                    Label("\(hr)", systemImage: "heart.fill").font(.subheadline.monospacedDigit()).foregroundStyle(.red)
                }
            }
            if !state.plates.isEmpty {
                Text(state.plates).font(.caption).foregroundStyle(Brand.muted)
            }
            WorkoutProgress(state: state)
            Actions()
        }
        .padding(16)
    }
}
