import AVFoundation
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
        guard !text.isEmpty else { return call.resolve() }
        DispatchQueue.main.async {
            let session = AVAudioSession.sharedInstance()
            try? session.setCategory(.playback, mode: .voicePrompt, options: [.duckOthers, .mixWithOthers])
            try? session.setActive(true)
            if self.synth.isSpeaking { self.synth.stopSpeaking(at: .immediate) }
            let u = AVSpeechUtterance(string: text)
            u.rate = AVSpeechUtteranceDefaultSpeechRate * rate
            u.voice = AVSpeechSynthesisVoice(language: Locale.current.identifier.hasPrefix("en") ? Locale.current.identifier.replacingOccurrences(of: "_", with: "-") : "en-US")
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
