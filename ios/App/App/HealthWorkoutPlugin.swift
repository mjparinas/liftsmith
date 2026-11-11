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

        // Already saved (a retry, or the same workout from a second device): leave it.
        let predicate = HKQuery.predicateForObjects(withMetadataKey: HKMetadataKeyExternalUUID, allowedValues: [id])
        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: 1, sortDescriptors: nil) { [weak self] _, found, _ in
            guard let self else { return }
            if let found, !found.isEmpty { return call.resolve(["saved": true]) }
            self.write(id: id, start: start, end: end, kcal: kcal, avgHr: avgHr, title: title, call: call)
        }
        store.execute(query)
    }

    private func write(id: String, start: Date, end: Date, kcal: Double?, avgHr: Double?, title: String?, call: CAPPluginCall) {
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
            if samples.isEmpty { return finish() }
            builder.add(samples) { _, _ in finish() }
        }
    }
}
