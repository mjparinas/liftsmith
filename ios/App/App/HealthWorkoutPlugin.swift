import Capacitor
import HealthKit
import UIKit

/// Finished workouts as real workouts in Apple Health (src/lib/health.ts saveWorkout; Android:
/// HealthWorkoutPlugin.kt). The health plugin (@capgo/capacitor-health) can't write workouts, so this plugin
/// asks to save workouts, active energy and heart rate, and writes one traditional strength training workout
/// with its active energy (and average heart rate) attached, so it counts toward the Exercise and Move rings.
/// The workout carries the Liftsmith workout id (HKMetadataKeyExternalUUID), and one that's already there is
/// not written again.
@objc(HealthWorkoutPlugin)
public class HealthWorkoutPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthWorkoutPlugin"
    public let jsName = "HealthWorkout"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "characteristics", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "nutrition", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()
    private var energy: HKQuantityType { HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)! }
    private var heart: HKQuantityType { HKQuantityType.quantityType(forIdentifier: .heartRate)! }
    private var types: Set<HKSampleType> { [HKObjectType.workoutType(), energy, heart] }

    /// Apple Health does say whether saving was allowed (only reads are hidden).
    private var granted: Bool {
        HKHealthStore.isHealthDataAvailable() && store.authorizationStatus(for: HKObjectType.workoutType()) == .sharingAuthorized
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(["granted": granted])
    }

    @objc func request(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.resolve(["granted": false]) }
        if granted { return call.resolve(["granted": true]) }
        store.requestAuthorization(toShare: types, read: nil) { [weak self] _, _ in
            call.resolve(["granted": self?.granted ?? false])
        }
    }

    /// Sex and birth year for Your stats (src/lib/health.ts readBodyStats). The health plugin can't read
    /// characteristics, so this asks for them (only when `ask` is true; Apple Health shows its sheet once)
    /// and answers with whatever Apple Health has. A value the lifter didn't allow simply isn't there.
    @objc func characteristics(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.resolve([:]) }
        let read: Set<HKObjectType> = [
            HKObjectType.characteristicType(forIdentifier: .biologicalSex)!,
            HKObjectType.characteristicType(forIdentifier: .dateOfBirth)!,
        ]
        let answer = { [weak self] in
            var out: [String: Any] = [:]
            if let sex = try? self?.store.biologicalSex().biologicalSex {
                switch sex {
                case .female: out["sex"] = "female"
                case .male: out["sex"] = "male"
                default: break
                }
            }
            if let born = try? self?.store.dateOfBirthComponents(), let year = born.year { out["birthYear"] = year }
            call.resolve(out)
        }
        if call.getBool("ask") ?? false {
            store.requestAuthorization(toShare: nil, read: read) { _, _ in answer() }
        } else {
            answer()
        }
    }

    /// Opens the Health app, where the lifter changes what Liftsmith may read (profile picture › Apps › Liftsmith;
    /// src/lib/health.ts openHealthPermissions). Apple Health never tells an app a read was denied and won't show
    /// its sheet twice, so this is the way back. Falls back to Liftsmith's page in Settings.
    @objc func openPermissions(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let fallback = {
                guard let settings = URL(string: UIApplication.openSettingsURLString) else { return call.resolve(["opened": false]) }
                UIApplication.shared.open(settings) { ok in call.resolve(["opened": ok]) }
            }
            guard let health = URL(string: "x-apple-health://") else { return fallback() }
            UIApplication.shared.open(health) { ok in
                if ok { call.resolve(["opened": true]) } else { DispatchQueue.main.async { fallback() } }
            }
        }
    }

    /// Calories and protein eaten per day, for the food coach's notes (src/lib/health.ts readNutrition, insights.ts).
    /// Food apps such as MyFitnessPal or Cronometer write dietary energy and protein to Apple Health; this adds them up
    /// per local day (a statistics query, which Apple Health dedupes across sources) for the `days` finished days
    /// before today. Today is left out because it's still being logged. The health plugin can't read protein, so this
    /// asks for both (only when `ask` is true; Apple Health shows its sheet once) and reads both. Android:
    /// HealthWorkoutPlugin.kt.
    @objc func nutrition(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(),
              let kcalType = HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed),
              let proteinType = HKQuantityType.quantityType(forIdentifier: .dietaryProtein)
        else { return call.resolve(["days": []]) }
        let days = min(60, max(1, call.getInt("days") ?? 14))
        let cal = Calendar.current
        let end = cal.startOfDay(for: Date())
        guard let start = cal.date(byAdding: .day, value: -days, to: end) else { return call.resolve(["days": []]) }
        let read = { [weak self] in
            guard let self else { return call.resolve(["days": []]) }
            let group = DispatchGroup()
            var kcal: [String: Double] = [:]
            var protein: [String: Double] = [:]
            let lock = NSLock()
            let key: (Date) -> String = { d in
                let c = cal.dateComponents([.year, .month, .day], from: d)
                return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
            }
            for (type, unit, isKcal) in [(kcalType, HKUnit.kilocalorie(), true), (proteinType, HKUnit.gram(), false)] {
                group.enter()
                let q = HKStatisticsCollectionQuery(
                    quantityType: type,
                    quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate),
                    options: .cumulativeSum,
                    anchorDate: start,
                    intervalComponents: DateComponents(day: 1)
                )
                q.initialResultsHandler = { _, results, _ in
                    results?.enumerateStatistics(from: start, to: end) { stat, _ in
                        guard let sum = stat.sumQuantity() else { return }
                        lock.lock()
                        if isKcal { kcal[key(stat.startDate)] = sum.doubleValue(for: unit) } else { protein[key(stat.startDate)] = sum.doubleValue(for: unit) }
                        lock.unlock()
                    }
                    group.leave()
                }
                self.store.execute(q)
            }
            group.notify(queue: .main) {
                let out: [[String: Any]] = Set(kcal.keys).union(protein.keys).sorted().map { day in
                    var d: [String: Any] = ["day": day]
                    if let k = kcal[day] { d["kcal"] = k }
                    if let p = protein[day] { d["protein"] = p }
                    return d
                }
                call.resolve(["days": out])
            }
        }
        if call.getBool("ask") ?? false {
            store.requestAuthorization(toShare: nil, read: [kcalType, proteinType]) { _, _ in read() }
        } else {
            read()
        }
    }

    @objc func save(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), let startMs = call.getDouble("start"), let endMs = call.getDouble("end"), endMs > startMs else {
            return call.reject("Bad workout")
        }
        guard granted else { return call.resolve(["saved": false]) }
        let start = Date(timeIntervalSince1970: startMs / 1000)
        let end = Date(timeIntervalSince1970: endMs / 1000)
        let kcal = call.getDouble("kcal")
        let avgHr = call.getDouble("avgHr")
        let title = call.getString("title")
        // The workout's parts (warm-up, lifting, rehab, cool-down), each written as a workout activity on iOS 16+.
        let segments: [(kind: String, start: Date, end: Date)] = (call.getArray("segments") ?? []).compactMap { v in
            guard let s = v as? JSObject, let kind = s["kind"] as? String, let a = (s["start"] as? NSNumber)?.doubleValue,
                  let b = (s["end"] as? NSNumber)?.doubleValue, b > a else { return nil }
            return (kind, Date(timeIntervalSince1970: a / 1000), Date(timeIntervalSince1970: b / 1000))
        }

        // Already saved (a retry, or the same workout from a second device): leave it.
        let predicate = HKQuery.predicateForObjects(withMetadataKey: HKMetadataKeyExternalUUID, allowedValues: [id])
        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: 1, sortDescriptors: nil) { [weak self] _, found, _ in
            guard let self else { return }
            if let found, !found.isEmpty { return call.resolve(["saved": true]) }
            self.write(id: id, start: start, end: end, kcal: kcal, avgHr: avgHr, title: title, segments: segments, call: call)
        }
        store.execute(query)
    }

    private func write(
        id: String, start: Date, end: Date, kcal: Double?, avgHr: Double?, title: String?,
        segments: [(kind: String, start: Date, end: Date)], call: CAPPluginCall
    ) {
        let config = HKWorkoutConfiguration()
        config.activityType = .traditionalStrengthTraining
        config.locationType = .indoor
        let builder = HKWorkoutBuilder(healthStore: store, configuration: config, device: .local())
        var metadata: [String: Any] = [HKMetadataKeyExternalUUID: id, HKMetadataKeyIndoorWorkout: true]
        if let title, !title.isEmpty { metadata[HKMetadataKeyWorkoutBrandName] = title }
        var samples: [HKSample] = []
        if let kcal, kcal > 0 {
            samples.append(HKQuantitySample(type: energy, quantity: HKQuantity(unit: .kilocalorie(), doubleValue: kcal), start: start, end: end))
        }
        if let avgHr, avgHr > 0 {
            let bpm = HKUnit.count().unitDivided(by: .minute())
            samples.append(HKQuantitySample(type: heart, quantity: HKQuantity(unit: bpm, doubleValue: avgHr), start: start, end: end))
        }
        builder.beginCollection(withStart: start) { ok, _ in
            guard ok else { return call.resolve(["saved": false]) }
            let finish = {
                builder.addMetadata(metadata) { _, _ in
                    builder.endCollection(withEnd: end) { ended, _ in
                        guard ended else { return call.resolve(["saved": false]) }
                        builder.finishWorkout { workout, _ in call.resolve(["saved": workout != nil]) }
                    }
                }
            }
            let withSamples = {
                if samples.isEmpty { return finish() }
                builder.add(samples) { _, _ in finish() }
            }
            // One activity per part. A part HealthKit won't take is left out; the workout is still saved.
            guard #available(iOS 16.0, *), segments.count > 1 else { return withSamples() }
            let group = DispatchGroup()
            for seg in segments {
                let c = HKWorkoutConfiguration()
                c.activityType = (seg.kind == "warm" || seg.kind == "cool") ? .flexibility : .traditionalStrengthTraining
                c.locationType = .indoor
                group.enter()
                builder.addWorkoutActivity(HKWorkoutActivity(workoutConfiguration: c, start: seg.start, end: seg.end, metadata: nil)) { _, _ in
                    group.leave()
                }
            }
            group.notify(queue: .main) { withSamples() }
        }
    }
}
