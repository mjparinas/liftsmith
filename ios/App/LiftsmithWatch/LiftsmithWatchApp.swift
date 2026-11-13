import HealthKit
import SwiftUI
import WatchKit

/// The Apple Watch app: the workout running on the phone, on the wrist (docs/decisions/watch-apps.md).
@main
struct LiftsmithWatchApp: App {
    @WKApplicationDelegateAdaptor(AppDelegate.self) private var delegate

    var body: some Scene {
        WindowGroup {
            WorkoutView().environmentObject(WatchModel.shared)
        }
    }
}

final class AppDelegate: NSObject, WKApplicationDelegate {
    func applicationDidFinishLaunching() {
        Task { @MainActor in WatchModel.shared.start() }
    }

    /// The phone started a workout and opened this app (HKHealthStore.startWatchApp in WatchLink.swift).
    func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
        Task { @MainActor in
            WatchModel.shared.start()
            WatchModel.shared.beginWorkout(workoutConfiguration)
        }
    }
}

/// The set, the weight and reps (or the rest countdown), plates, heart rate, and Log set and +30 s.
/// Everything comes from the phone; a tap goes back to it, and the phone sends the next state.
struct WorkoutView: View {
    @EnvironmentObject private var model: WatchModel

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            if let s = model.current {
                running(s, now: context.date)
            } else {
                VStack(spacing: 6) {
                    Text("No workout running").font(.headline).multilineTextAlignment(.center)
                    Text("Start one on your phone and it shows here.")
                        .font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                }
                .padding()
            }
        }
        .tint(Color.brand)
    }

    @ViewBuilder
    private func running(_ s: WatchState, now: Date) -> some View {
        let resting = s.resting(at: now)
        ScrollView {
            VStack(spacing: 4) {
                if !s.setLabel.isEmpty {
                    Text(s.setLabel.uppercased()).font(.caption2.bold()).foregroundStyle(Color.brand)
                }
                Text(s.title).font(.headline).lineLimit(2).multilineTextAlignment(.center)
                if let p = s.phase(at: now) {
                    // The set timer (holds, carries, cardio), counted on the watch's own clock.
                    Text(p.label).font(.footnote).foregroundStyle(.secondary)
                    Group {
                        if let end = p.end {
                            Text(timerInterval: now...end, countsDown: true)
                        } else {
                            Text(p.start, style: .timer)
                        }
                    }
                    .font(.system(.largeTitle, design: .rounded, weight: .heavy).monospacedDigit())
                } else if resting, let end = s.restEnd {
                    Text(timerInterval: now...end, countsDown: true)
                        .font(.system(.largeTitle, design: .rounded, weight: .heavy).monospacedDigit())
                    Text("Next: \(s.next)").font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                } else {
                    Text(s.next).font(.system(.title2, design: .rounded, weight: .heavy).monospacedDigit())
                        .multilineTextAlignment(.center).minimumScaleFactor(0.7)
                    if !s.plates.isEmpty {
                        Text(s.plates).font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }
                }
                if let bpm = model.bpm ?? s.hr {
                    Label("\(bpm) bpm", systemImage: "heart.fill")
                        .font(.footnote.bold().monospacedDigit()).foregroundStyle(.red)
                        .accessibilityLabel(Text("Heart rate \(bpm) beats per minute"))
                }
                Button("Log set") { model.send("log") }
                    .buttonStyle(.borderedProminent)
                    .padding(.top, 4)
                if resting {
                    Button("+30 s") { model.send("add30") }
                }
            }
        }
    }
}

extension Color {
    /// The app's brand blue (src/app/globals.css --color-accent).
    static let brand = Color(red: 0x4C / 255, green: 0x8D / 255, blue: 0xFF / 255)
}
