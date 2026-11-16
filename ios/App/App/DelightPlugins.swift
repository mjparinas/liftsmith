import AVFoundation
import StoreKit
import Capacitor
import UIKit

/// The voice coach (src/lib/voice.ts), iOS side (Android: VoiceCoachPlugin.java). Spoken cues through
/// AVSpeechSynthesizer; other audio (music, podcasts) is ducked while it talks and restored after.
/// iOS suspends the app in the background, so cues are spoken while the app is open (the screen stays on
/// during a workout); the rest-over notification covers the locked screen. See Platform deltas in AGENTS.md.
@objc(VoiceCoachPlugin)
public class VoiceCoachPlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    public let identifier = "VoiceCoachPlugin"
    public let jsName = "VoiceCoach"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
    ]

    private let synth = AVSpeechSynthesizer()

    override public func load() {
        synth.delegate = self
    }

    @objc func speak(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        let rate = call.getFloat("rate") ?? 1
        // The app's language (it can differ from the phone's), so a Spanish cue gets a Spanish voice.
        let lang = call.getString("lang") ?? ""
        guard !text.isEmpty else { return call.resolve() }
        DispatchQueue.main.async {
            let session = AVAudioSession.sharedInstance()
            try? session.setCategory(.playback, mode: .voicePrompt, options: [.duckOthers, .mixWithOthers])
            try? session.setActive(true)
            if self.synth.isSpeaking { self.synth.stopSpeaking(at: .immediate) }
            let u = AVSpeechUtterance(string: text)
            u.rate = AVSpeechUtteranceDefaultSpeechRate * rate
            u.voice = AVSpeechSynthesisVoice(language: lang.isEmpty ? Locale.current.identifier.replacingOccurrences(of: "_", with: "-") : lang)
                ?? AVSpeechSynthesisVoice(language: String(lang.prefix(2)))
            self.synth.speak(u)
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.synth.stopSpeaking(at: .immediate)
            self.release()
            call.resolve()
        }
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        release()
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        release()
    }

    /// Lets ducked music come back up.
    private func release() {
        guard !synth.isSpeaking else { return }
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}

/// Earned app icons (src/lib/themes.ts), iOS side (Android: AppIconPlugin.java, launcher aliases).
/// The icon sets are AppIcon-<name> in Assets.xcassets, listed in ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES,
/// drawn by scripts/make-theme-icons.py. iOS shows its own "You have changed the icon" alert; that can't be hidden.
@objc(AppIconPlugin)
public class AppIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppIconPlugin"
    public let jsName = "AppIcon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
    ]

    static let icons = ["default", "forge", "glacier", "aurora", "royal"]

    @objc func set(_ call: CAPPluginCall) {
        let name = call.getString("name") ?? "default"
        guard Self.icons.contains(name) else { return call.reject("Unknown icon \(name)") }
        DispatchQueue.main.async {
            guard UIApplication.shared.supportsAlternateIcons else { return call.reject("Alternate icons not supported") }
            UIApplication.shared.setAlternateIconName(name == "default" ? nil : "AppIcon-\(name)") { error in
                if let error { call.reject(error.localizedDescription) } else { call.resolve() }
            }
        }
    }

    @objc func get(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let n = UIApplication.shared.alternateIconName?.replacingOccurrences(of: "AppIcon-", with: "") ?? "default"
            call.resolve(["name": n])
        }
    }
}

/// The App Store's own rating prompt, shown at a happy moment after a workout (src/lib/rateApp.ts decides when;
/// docs/decisions/growth.md). iOS decides whether it appears (at most three times a year) and never says, so this
/// always resolves. Android counterpart: StoreReviewPlugin.java (Play In-App Review).
@objc(StoreReviewPlugin)
public class StoreReviewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreReviewPlugin"
    public let jsName = "StoreReview"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
    ]

    @objc func request(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                SKStoreReviewController.requestReview(in: scene)
            }
            call.resolve()
        }
    }
}

/// "A new version is ready" (src/lib/appUpdate.ts; docs/decisions/app-updates.md), iOS side. Asks the App Store's
/// public lookup, in the background on start, whether a newer version than this one is out for this phone's
/// storefront and iOS version, and opens its App Store page when the lifter taps Update. iOS has no in-app
/// download like Play's, so the App Store does the update. Before the app is in the App Store the lookup finds
/// nothing and nothing shows. Android counterpart: AppUpdatePlugin.java (Play In-App Updates).
@objc(AppUpdatePlugin)
public class AppUpdatePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppUpdatePlugin"
    public let jsName = "AppUpdate"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "check", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "complete", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
    ]

    private var storeURL: URL?

    @objc func check(_ call: CAPPluginCall) {
        guard let bundleId = Bundle.main.bundleIdentifier,
              let current = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String else {
            call.resolve(["available": false])
            return
        }
        var parts = URLComponents(string: "https://itunes.apple.com/lookup")!
        var query = [URLQueryItem(name: "bundleId", value: bundleId)]
        if let region = (Locale.current as NSLocale).countryCode, region.count == 2 {
            query.append(URLQueryItem(name: "country", value: region.lowercased()))
        }
        parts.queryItems = query
        var request = URLRequest(url: parts.url!, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.httpMethod = "GET"
        URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            guard let data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let first = (json["results"] as? [[String: Any]])?.first,
                  let version = first["version"] as? String else {
                call.resolve(["available": false])
                return
            }
            // Only offer a version this phone can install.
            if let minOS = first["minimumOsVersion"] as? String,
               UIDevice.current.systemVersion.compare(minOS, options: .numeric) == .orderedAscending {
                call.resolve(["available": false])
                return
            }
            let newer = version.compare(current, options: .numeric) == .orderedDescending
            if let link = first["trackViewUrl"] as? String { self?.storeURL = URL(string: link) }
            call.resolve(["available": newer, "version": version, "downloaded": false])
        }.resume()
    }

    /// iOS has no in-app download: Update opens the App Store page.
    @objc func start(_ call: CAPPluginCall) {
        call.resolve(["started": false])
    }

    @objc func complete(_ call: CAPPluginCall) {
        call.resolve()
    }

    @objc func open(_ call: CAPPluginCall) {
        let fallback = URL(string: "https://apps.apple.com/search?term=Liftsmith")!
        let url = storeURL ?? fallback
        DispatchQueue.main.async {
            UIApplication.shared.open(url)
            call.resolve()
        }
    }
}

/// Tells the web app when the lifter takes a screenshot of Liftsmith, so it can offer branded share cards with their
/// invite link (src/lib/screenshots.ts; docs/decisions/sharing.md "Share cards when you take a screenshot"). iOS posts
/// userDidTakeScreenshotNotification after the screenshot is saved, so it's never blocked or changed; this only passes
/// the news on. Android counterpart: ScreenshotsPlugin.java (Activity.ScreenCaptureCallback, Android 14+).
@objc(ScreenshotsPlugin)
public class ScreenshotsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenshotsPlugin"
    public let jsName = "Screenshots"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
    ]

    override public func load() {
        NotificationCenter.default.addObserver(
            self, selector: #selector(tookScreenshot), name: UIApplication.userDidTakeScreenshotNotification, object: nil)
    }

    @objc func tookScreenshot() {
        notifyListeners("screenshot", data: [:])
    }

    @objc func isSupported(_ call: CAPPluginCall) {
        call.resolve(["supported": true])
    }
}
