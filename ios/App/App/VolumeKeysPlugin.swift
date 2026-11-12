import AVFoundation
import Capacitor
import MediaPlayer
import UIKit

/// Volume up logs a set (a lab, labVolumeLog; src/lib/volumeKeys.ts). Melvin picked the volume button over
/// play/pause on 2026-11-12, because play/pause belongs to the music app and would stop the music.
///
/// iOS gives apps no volume key events, so this watches the audio session's output volume: a rise, from the
/// phone's button or from earbuds, is a press, and the volume is put straight back through a hidden system
/// volume slider (which also keeps the volume pop-up from showing). The session is mixable (.ambient), so
/// music from another app keeps playing. Volume down is left alone. Only while Liftsmith is in front.
/// Android counterpart: VolumeKeysPlugin.java (and MainActivity.dispatchKeyEvent).
@objc(VolumeKeysPlugin)
public class VolumeKeysPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "VolumeKeysPlugin"
    public let jsName = "VolumeKeys"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disable", returnType: CAPPluginReturnPromise),
    ]

    private var enabled = false
    private var observation: NSKeyValueObservation?
    private var volumeView: MPVolumeView?
    /// Set while this plugin is moving the volume itself, so that change isn't read as a press.
    private var restoring = false

    override public func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(resignActive), name: UIApplication.willResignActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(becomeActive), name: UIApplication.didBecomeActiveNotification, object: nil)
    }

    @objc func enable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.enabled = true
            self.start()
            call.resolve()
        }
    }

    @objc func disable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.enabled = false
            self.stop()
            call.resolve()
        }
    }

    @objc private func resignActive() {
        DispatchQueue.main.async { self.stop() }
    }

    @objc private func becomeActive() {
        DispatchQueue.main.async { if self.enabled { self.start() } }
    }

    private var slider: UISlider? {
        volumeView?.subviews.compactMap { $0 as? UISlider }.first
    }

    private func setVolume(_ value: Float) {
        restoring = true
        slider?.value = value
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { self.restoring = false }
    }

    /// Safe to call again: another plugin (the voice coach, voice set logging) may have changed or ended the session.
    private func start() {
        let session = AVAudioSession.sharedInstance()
        // The default category would stop other apps' music when the session starts; .ambient mixes with it.
        if session.category == .soloAmbient { try? session.setCategory(.ambient, options: [.mixWithOthers]) }
        try? session.setActive(true)
        if volumeView == nil, let host = bridge?.viewController?.view {
            // In the view tree but out of sight: that's what keeps the system volume pop-up away.
            let v = MPVolumeView(frame: CGRect(x: -200, y: -200, width: 10, height: 10))
            v.alpha = 0.01
            v.isUserInteractionEnabled = false
            host.addSubview(v)
            volumeView = v
        }
        // At the top a press can't raise the volume, so nothing would be seen: start one step down.
        if session.outputVolume >= 0.999 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { self.setVolume(1 - 1 / 16) }
        }
        guard observation == nil else { return }
        observation = session.observe(\.outputVolume, options: [.old, .new]) { [weak self] _, change in
            guard let self = self, let old = change.oldValue, let new = change.newValue else { return }
            DispatchQueue.main.async {
                guard self.enabled, !self.restoring, new > old + 0.001 else { return }
                self.notifyListeners("press", data: ["from": "volume"])
                self.setVolume(old)
            }
        }
    }

    private func stop() {
        observation?.invalidate()
        observation = nil
        volumeView?.removeFromSuperview()
        volumeView = nil
    }
}
