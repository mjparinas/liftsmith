import AdServices
import Capacitor
import UIKit

/// Device and install details for usage analytics (src/lib/installInfo.ts), iOS side
/// (Android: InstallInfoPlugin.java). The device model and iOS version, whether the app came from the
/// App Store or TestFlight, and the Apple Search Ads attribution token from AdServices, which Apple
/// provides without App Tracking Transparency. It never reads the advertising id (IDFA).
///
/// iOS has no install referrer like Play's: campaign links (pt/ct tokens) are reported in aggregate in
/// App Store Connect, and only Apple Search Ads gives a per-install answer.
@objc(InstallInfoPlugin)
public class InstallInfoPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "InstallInfoPlugin"
    public let jsName = "InstallInfo"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
    ]

    @objc func get(_ call: CAPPluginCall) {
        let device = UIDevice.current
        var out: [String: Any] = [
            "platform": "ios",
            "os": device.userInterfaceIdiom == .pad ? "iPadOS" : "iOS",
            "osVersion": device.systemVersion,
            "manufacturer": "Apple",
            "model": Self.modelIdentifier(),
            "store": Self.store(),
            // Remote push (Friends) goes through APNs, which needs no extra config file.
            "push": true,
        ]
        if let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String { out["appVersion"] = v }
        if let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String { out["build"] = b }
        if let token = try? AAAttribution.attributionToken() {
            out["asaToken"] = token
        }
        call.resolve(out)
    }

    /// "iPhone16,2" and so on (the server maps these to names). The simulator reports the model it runs.
    static func modelIdentifier() -> String {
        if let sim = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] { return sim }
        var info = utsname()
        uname(&info)
        let mirror = Mirror(reflecting: info.machine)
        return mirror.children.reduce(into: "") { s, el in
            if let v = el.value as? Int8, v != 0 { s.append(Character(UnicodeScalar(UInt8(v)))) }
        }
    }

    /// TestFlight installs carry a sandbox receipt; App Store installs a production one.
    static func store() -> String {
        #if targetEnvironment(simulator)
        return "simulator"
        #else
        guard let url = Bundle.main.appStoreReceiptURL else { return "unknown" }
        if url.lastPathComponent == "sandboxReceipt" { return "testflight" }
        return FileManager.default.fileExists(atPath: url.path) ? "appstore" : "unknown"
        #endif
    }
}
