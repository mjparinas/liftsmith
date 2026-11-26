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
    /// The set as changed here (watch-apps.md "Adjust and rate a set"): for the set named `editKey`, the weight in kg
    /// (a weight, not a place on the ladder, so it survives the phone re-centring the ladder) and the reps.
    @State private var editKey = ""
    @State private var editKg: Double = 0
    @State private var editReps = 0
    /// The crown moves the reps rather than the weight (tap a number to choose).
    @State private var crownReps = false
    /// The exercise answered here, so its question goes until the phone moves on.
    @State private var answered: String?
    @State private var pendingAdjust: Task<Void, Never>?

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
                if !s.why.isEmpty {
                    // Why the exercise is there after a Machine taken swap (src/lib/takenSwap.ts).
                    Text(s.why).font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                }
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
                    if let adj = s.adj {
                        adjuster(adj)
                    } else {
                        Text(s.next).font(.system(.title2, design: .rounded, weight: .heavy).monospacedDigit())
                            .multilineTextAlignment(.center).minimumScaleFactor(0.7)
                    }
                    if !s.plates.isEmpty {
                        Text(s.plates).font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }
                }
                if let bpm = model.bpm ?? s.hr {
                    Label("\(bpm) bpm", systemImage: "heart.fill")
                        .font(.footnote.bold().monospacedDigit()).foregroundStyle(.red)
                        .accessibilityLabel(Text("Heart rate \(bpm) beats per minute"))
                }
                Button("Log set") { logSet(s, now: now) }
                    .buttonStyle(.borderedProminent)
                    .padding(.top, 4)
                if resting {
                    Button("+30 s") { model.send("add30") }
                }
                if !s.taken.isEmpty, s.phase(at: now) == nil {
                    // Machine taken: the phone swaps to the best pick at this gym, named under the button.
                    Button("Machine taken") { model.send("taken") }
                        .accessibilityHint(Text(s.taken))
                    Text(s.taken).font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                }
                if let ask = s.ask, ask.ex != answered {
                    // How did it feel, after an exercise's last set, with the phone's own three answers.
                    Text(ask.q).font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center).padding(.top, 6)
                    ForEach(0..<3, id: \.self) { k in
                        Button(ask.o[k]) {
                            model.send("rate", fields: ["ex": ask.ex, "v": ask.v[k]])
                            answered = ask.ex
                        }
                    }
                }
            }
        }
        .onChange(of: model.current?.ask?.ex) { _, ex in if ex == nil { answered = nil } }
    }

    // MARK: Adjust the set

    private func kgShown(_ a: WatchState.Adj) -> Double { editKey == a.key ? editKg : (a.hasWeight ? a.kg[a.i] : 0) }
    private func repsShown(_ a: WatchState.Adj) -> Int { editKey == a.key ? editReps : a.reps }

    /// The weight and reps with − / +, and the crown on whichever is chosen (the weight first, the reps on a
    /// bodyweight move). A change goes to the phone a moment after the last one, so its screen shows it too.
    @ViewBuilder
    private func adjuster(_ a: WatchState.Adj) -> some View {
        let onReps = crownReps || !a.hasWeight
        VStack(spacing: 4) {
            if a.hasWeight {
                stepper(
                    a.w[a.nearest(kgShown(a))], picked: !onReps,
                    down: ("Lighter", { stepWeight(a, -1) }), up: ("Heavier", { stepWeight(a, 1) }),
                    pick: { crownReps = false }
                )
            }
            stepper(
                a.rs.isEmpty ? "\(repsShown(a))" : "\(repsShown(a)) \(a.rs)", picked: onReps && a.hasWeight,
                down: ("Fewer reps", { stepReps(a, -1) }), up: ("More reps", { stepReps(a, 1) }),
                pick: { crownReps = true }
            )
        }
        .focusable(true)
        .digitalCrownRotation(
            crownBinding(a, onReps: onReps),
            from: 0, through: onReps ? Double(WatchState.Adj.repsMax) : Double(max(0, a.kg.count - 1)), by: 1,
            sensitivity: .low, isContinuous: false, isHapticFeedbackEnabled: true
        )
    }

    private func stepper(
        _ value: String, picked: Bool, down: (LocalizedStringKey, () -> Void), up: (LocalizedStringKey, () -> Void), pick: @escaping () -> Void
    ) -> some View {
        HStack(spacing: 4) {
            Button(action: down.1) { Image(systemName: "minus") }
                .accessibilityLabel(Text(down.0))
                .frame(width: 44)
            Button(action: pick) {
                Text(value).font(.system(.headline, design: .rounded, weight: .heavy).monospacedDigit())
                    .foregroundStyle(picked ? Color.brand : Color.primary)
                    .multilineTextAlignment(.center).minimumScaleFactor(0.6).lineLimit(2)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.plain)
            .accessibilityHint(Text("Turn the crown to change"))
            Button(action: up.1) { Image(systemName: "plus") }
                .accessibilityLabel(Text(up.0))
                .frame(width: 44)
        }
    }

    private func crownBinding(_ a: WatchState.Adj, onReps: Bool) -> Binding<Double> {
        Binding(
            get: { onReps ? Double(repsShown(a)) : Double(a.nearest(kgShown(a))) },
            set: { v in
                let n = Int(v.rounded())
                if onReps {
                    if WatchState.Adj.clampReps(n) != repsShown(a) { change(a, kg: kgShown(a), reps: WatchState.Adj.clampReps(n)) }
                } else if a.kg.indices.contains(n), a.kg[n] != kgShown(a) {
                    change(a, kg: a.kg[n], reps: repsShown(a))
                }
            }
        )
    }

    private func stepWeight(_ a: WatchState.Adj, _ dir: Int) {
        let at = a.nearest(kgShown(a)) + dir
        guard a.kg.indices.contains(at) else { return WKInterfaceDevice.current().play(.failure) }
        WKInterfaceDevice.current().play(.click)
        change(a, kg: a.kg[at], reps: repsShown(a))
    }

    private func stepReps(_ a: WatchState.Adj, _ dir: Int) {
        let r = WatchState.Adj.clampReps(repsShown(a) + dir)
        guard r != repsShown(a) else { return WKInterfaceDevice.current().play(.failure) }
        WKInterfaceDevice.current().play(.click)
        change(a, kg: kgShown(a), reps: r)
    }

    private func change(_ a: WatchState.Adj, kg: Double, reps: Int) {
        editKey = a.key
        editKg = kg
        editReps = reps
        pendingAdjust?.cancel()
        let f = fields(a, kg: kg, reps: reps)
        let m = model
        pendingAdjust = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 800_000_000)
            if Task.isCancelled { return }
            m.send("adjust", fields: f, click: false)
        }
    }

    private func fields(_ a: WatchState.Adj, kg: Double, reps: Int) -> [String: Any] {
        var f: [String: Any] = ["key": a.key, "reps": reps]
        if a.hasWeight { f["kg"] = kg }
        return f
    }

    /// Log set, with the weight and reps chosen here when the set can be changed.
    private func logSet(_ s: WatchState, now: Date) {
        pendingAdjust?.cancel()
        pendingAdjust = nil
        guard let a = s.adj, !s.resting(at: now), s.phase(at: now) == nil else { return model.send("log") }
        model.send("log", fields: fields(a, kg: kgShown(a), reps: repsShown(a)))
    }
}

extension Color {
    /// The app's brand blue (src/app/globals.css --color-accent).
    static let brand = Color(red: 0x4C / 255, green: 0x8D / 255, blue: 0xFF / 255)
}
