import Capacitor
import ConnectIQ
import Foundation
import UIKit

/// Phone side of the Garmin watch app (garmin/, a Connect IQ app), through Garmin's Connect IQ SDK. iOS can't ask
/// Garmin Connect for its watches, so the lifter picks them once (Connected apps › Garmin › Choose my watch, which
/// opens Garmin Connect and comes back on liftsmith-ciq://); they're kept on this phone. The live workout goes to
/// each picked watch, the watch app is asked to open when a workout starts, and Log set, +30 s and heart rate come
/// back like the Apple Watch's. The SDK talks Bluetooth, so it only starts once a watch was picked (no Bluetooth
/// prompt for lifters without a Garmin). Android counterpart: GarminLink.java.
final class GarminLink: NSObject, IQAppMessageDelegate, IQUIOverrideDelegate {
    static let shared = GarminLink()
    static let appId = UUID(uuidString: "a818f484-8205-4d7f-a025-f6b704934614")!
    static let scheme = "liftsmith-ciq"
    private static let devicesKey = "garmin.devices"

    var onAction: ((String) -> Void)?
    var onHeartRate: ((Int) -> Void)?
    /// The picked watches changed (Connected apps refreshes).
    var onChange: (() -> Void)?

    private var started = false
    private var devices: [IQDevice] = []
    private var last: [String: Any]?
    private var lastAt = Date.distantPast
    private var launchedFor: String?

    var garminConnectInstalled: Bool {
        guard let url = URL(string: "gcm-ciq://") else { return false }
        return UIApplication.shared.canOpenURL(url)
    }

    /// Called at launch: starts the SDK only if this phone already has picked watches.
    func restore() {
        devices = Self.load()
        if !devices.isEmpty { start() }
    }

    private func start() {
        guard !started else { return }
        started = true
        ConnectIQ.sharedInstance().initialize(withUrlScheme: Self.scheme, uiOverrideDelegate: self)
        listen()
    }

    private func listen() {
        ConnectIQ.sharedInstance().unregister(forAllAppMessages: self)
        for d in devices { ConnectIQ.sharedInstance().register(forAppMessages: app(d), delegate: self) }
    }

    private func app(_ device: IQDevice) -> IQApp {
        IQApp(uuid: Self.appId, store: nil, device: device)
    }

    /// Opens Garmin Connect's watch picker (or its App Store page when it's missing).
    func choose() {
        start()
        let picker = NSSelectorFromString("showConnectIQDeviceSelection")
        let store = NSSelectorFromString("showAppStoreForConnectMobile")
        let sdk = ConnectIQ.sharedInstance()!
        if garminConnectInstalled, sdk.responds(to: picker) {
            sdk.perform(picker)
        } else if sdk.responds(to: store) {
            sdk.perform(store)
        }
    }

    /// Garmin Connect's answer to the picker. True when the link was ours.
    @discardableResult
    func open(_ url: URL) -> Bool {
        guard url.scheme == Self.scheme else { return false }
        start()
        if let picked = ConnectIQ.sharedInstance().parseDeviceSelectionResponse(from: url) as? [IQDevice] {
            devices = picked
            Self.save(picked)
            listen()
            onChange?()
        }
        return true
    }

    /// For Connected apps: {app: "missing" | "ready", devices: [{name, connected, installed}]}.
    func status(_ done: @escaping ([String: Any]) -> Void) {
        let connect = garminConnectInstalled ? "ready" : "missing"
        guard !devices.isEmpty else { return done(["app": connect, "devices": []]) }
        start()
        var rows: [[String: Any]] = []
        let group = DispatchGroup()
        for d in devices {
            let connected = ConnectIQ.sharedInstance().getDeviceStatus(d) == .connected
            var row: [String: Any] = ["name": d.friendlyName ?? d.modelName ?? "Garmin", "connected": connected, "installed": false]
            guard connected else {
                rows.append(row)
                continue
            }
            group.enter()
            var answered = false
            let finish: (Bool) -> Void = { installed in
                DispatchQueue.main.async {
                    guard !answered else { return }
                    answered = true
                    row["installed"] = installed
                    rows.append(row)
                    group.leave()
                }
            }
            ConnectIQ.sharedInstance().getAppStatus(app(d)) { s in finish(s?.isInstalled ?? false) }
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) { finish(false) }
        }
        group.notify(queue: .main) { done(["app": connect, "devices": rows]) }
    }

    /// The workout as the watch shows it (WorkoutSession.update).
    func update(_ state: [String: Any]) {
        guard started, !devices.isEmpty else { return }
        let now = Date()
        let next = GarminMessages.state(state, now: now)
        if GarminMessages.worthSending(last, next, since: now.timeIntervalSince(lastAt)) {
            last = next
            lastAt = now
            send(next)
        }
        if let id = state["sessionId"] as? String, !id.isEmpty, id != launchedFor {
            launchedFor = id
            for d in connected() { ConnectIQ.sharedInstance().openAppRequest(app(d)) { _ in } }
        }
    }

    /// The workout ended: the watch goes back to "No workout running".
    func stop() {
        launchedFor = nil
        last = nil
        guard started else { return }
        send(["end": true])
    }

    private func connected() -> [IQDevice] {
        devices.filter { ConnectIQ.sharedInstance().getDeviceStatus($0) == .connected }
    }

    private func send(_ message: [String: Any]) {
        for d in connected() {
            ConnectIQ.sharedInstance().sendMessage(message, to: app(d), progress: { _, _ in }, completion: { _ in })
        }
    }

    // IQAppMessageDelegate. The selector is spelled out so a renamed Swift import can't silently drop messages.
    @objc(receivedMessage:fromApp:)
    func receivedMessage(_ message: Any!, from app: IQApp!) {
        let dict = message as? [String: Any] ?? [:]
        DispatchQueue.main.async {
            if let a = GarminMessages.action(dict["a"]) { self.onAction?(a) }
            if let b = GarminMessages.bpm(dict["hr"]) { self.onHeartRate?(b) }
        }
    }

    // IQUIOverrideDelegate: no SDK alert when Garmin Connect is missing; Connected apps says so instead.
    @objc func needsToInstallConnectMobile() {}

    private static func load() -> [IQDevice] {
        guard let data = UserDefaults.standard.data(forKey: devicesKey),
              let list = try? NSKeyedUnarchiver.unarchivedObject(ofClasses: [NSArray.self, IQDevice.self], from: data) as? [IQDevice]
        else { return [] }
        return list
    }

    private static func save(_ list: [IQDevice]) {
        if let data = try? NSKeyedArchiver.archivedData(withRootObject: list as NSArray, requiringSecureCoding: true) {
            UserDefaults.standard.set(data, forKey: devicesKey)
        }
    }
}

/// What goes to and comes from the Garmin watch (same keys as GarminMessages.java): "t" title, "s" set label, "n"
/// the set, "p" plates, "r" seconds of rest left, "h" heart rate from a Bluetooth monitor, "v" vibrate when rest ends,
/// "w" a heads-up buzz 10 s before rest ends, "k" the set timer's phases as [seconds from now to its start, to its end or -1 for a count-up, label], "ki" which timer.
enum GarminMessages {
    static let hrOnly: TimeInterval = 10

    static func state(_ s: [String: Any], now: Date) -> [String: Any] {
        let restUntil = (s["restUntil"] as? Double ?? 0) / 1000
        let left = restUntil - now.timeIntervalSince1970
        // The set timer (holds, carries, cardio), in seconds from now like rest, so the two clocks never have to agree.
        var k: [[Any]] = []
        var first = 0.0
        if left <= 0 {
            for case let p as [String: Any] in (s["timer"] as? [Any] ?? []).prefix(8) {
                guard let from = (p["from"] as? NSNumber)?.doubleValue, from > 0 else { continue }
                let to = (p["to"] as? NSNumber)?.doubleValue
                if let to, to <= from { continue }
                if first == 0 { first = from }
                let start = Int(((from / 1000) - now.timeIntervalSince1970).rounded(.down))
                let end = to.map { Int((($0 / 1000) - now.timeIntervalSince1970).rounded(.up)) } ?? -1
                k.append([start, end, p["label"] as? String ?? ""])
            }
        }
        return [
            "k": k,
            "ki": first > 0 ? String(Int64(first)) : "",
            "t": s["title"] as? String ?? "",
            "s": s["setLabel"] as? String ?? "",
            "n": s["next"] as? String ?? "",
            "p": s["plates"] as? String ?? "",
            "r": left > 0 ? Int(left.rounded(.up)) : 0,
            "h": s["hr"] as? Int ?? 0,
            "v": s["vibrate"] as? Bool ?? true,
            "w": s["warn"] as? Bool ?? false,
        ]
    }

    static func worthSending(_ last: [String: Any]?, _ next: [String: Any], since: TimeInterval) -> Bool {
        guard let last else { return true }
        for k in ["t", "s", "n", "p", "ki"] where last[k] as? String != next[k] as? String { return true }
        if last["v"] as? Bool != next["v"] as? Bool || last["w"] as? Bool != next["w"] as? Bool { return true }
        let a = last["r"] as? Int ?? 0, b = next["r"] as? Int ?? 0
        if (a > 0) != (b > 0) || (b > 0 && abs(Double(b) + since - Double(a)) > 1.5) { return true }
        return last["h"] as? Int != next["h"] as? Int && since >= hrOnly
    }

    static func action(_ value: Any?) -> String? { WatchMessages.action(value) }

    static func bpm(_ value: Any?) -> Int? {
        if let n = value as? NSNumber { return WatchMessages.bpm(n.intValue) }
        return nil
    }
}

/// Connected apps' Garmin row (src/lib/garmin.ts).
@objc(GarminPlugin)
public class GarminPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GarminPlugin"
    public let jsName = "Garmin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "choose", returnType: CAPPluginReturnPromise),
    ]

    override public func load() {
        GarminLink.shared.onChange = { [weak self] in self?.notifyListeners("change", data: [:]) }
    }

    @objc func status(_ call: CAPPluginCall) {
        DispatchQueue.main.async { GarminLink.shared.status { call.resolve($0) } }
    }

    @objc func choose(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            GarminLink.shared.choose()
            call.resolve()
        }
    }
}
