import AVFoundation
import Capacitor
import Speech

/// Voice set logging (a lab; src/lib/speech.ts and voiceLog.ts), iOS side (Android: SpeechLogPlugin.java).
/// Hears one utterance ("100 for 8", "too easy") with SFSpeechRecognizer and hands back its guesses.
/// On-device only (requiresOnDeviceRecognition), so the audio never leaves the iPhone; a language the
/// phone can't recognize offline is "unavailable". Listening stops 1.2 s after the lifter stops talking,
/// or after 8 s, and when the app goes to the background. Music is ducked while it listens.
@objc(SpeechLogPlugin)
public class SpeechLogPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SpeechLogPlugin"
    public let jsName = "SpeechLog"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listen", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
    ]

    private let engine = AVAudioEngine()
    private var task: SFSpeechRecognitionTask?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var pending: CAPPluginCall?
    private var guesses: [String] = []
    private var quiet: DispatchWorkItem?
    private var cap: DispatchWorkItem?

    override public func load() {
        NotificationCenter.default.addObserver(
            self, selector: #selector(background), name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    private func recognizer(_ lang: String) -> SFSpeechRecognizer? {
        let r = lang.isEmpty ? SFSpeechRecognizer() : SFSpeechRecognizer(locale: Locale(identifier: lang))
        guard let r, r.isAvailable, r.supportsOnDeviceRecognition else { return nil }
        return r
    }

    @objc func available(_ call: CAPPluginCall) {
        call.resolve(["available": recognizer(call.getString("lang") ?? "") != nil])
    }

    @objc func listen(_ call: CAPPluginCall) {
        let lang = call.getString("lang") ?? ""
        let hints = (call.getArray("hints") as? [String]) ?? []
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else {
                return call.reject("Speech recognition not allowed", "denied")
            }
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                DispatchQueue.main.async {
                    guard granted else { return call.reject("Microphone not allowed", "denied") }
                    self.start(call, lang: lang, hints: hints)
                }
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.finish(code: "nomatch") }
        call.resolve()
    }

    @objc private func background() {
        DispatchQueue.main.async { self.finish(code: "nomatch") }
    }

    private func start(_ call: CAPPluginCall, lang: String, hints: [String]) {
        finish(code: "nomatch")
        guard let rec = recognizer(lang) else { return call.reject("No on-device recognizer", "unavailable") }
        pending = call
        guesses = []
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers, .defaultToSpeaker, .allowBluetooth])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            return finish(code: "error")
        }
        let req = SFSpeechAudioBufferRecognitionRequest()
        req.requiresOnDeviceRecognition = true
        req.shouldReportPartialResults = true
        req.contextualStrings = hints
        request = req
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in req.append(buffer) }
        engine.prepare()
        do {
            try engine.start()
        } catch {
            return finish(code: "error")
        }
        task = rec.recognitionTask(with: req) { [weak self] result, error in
            DispatchQueue.main.async {
                guard let self else { return }
                if let result {
                    self.guesses = result.transcriptions.prefix(5).map { $0.formattedString }
                    if result.isFinal { return self.finish(code: "nomatch") }
                    // Still talking: wait for 1.2 s of quiet before ending.
                    self.quiet?.cancel()
                    let q = DispatchWorkItem { [weak self] in self?.request?.endAudio() }
                    self.quiet = q
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.2, execute: q)
                } else if error != nil {
                    self.finish(code: "nomatch")
                }
            }
        }
        let c = DispatchWorkItem { [weak self] in self?.request?.endAudio() }
        cap = c
        DispatchQueue.main.asyncAfter(deadline: .now() + 8, execute: c)
    }

    /// Resolves or rejects the waiting call (once) and lets the microphone go. Main thread.
    private func finish(code: String) {
        quiet?.cancel()
        cap?.cancel()
        quiet = nil
        cap = nil
        if engine.isRunning {
            engine.stop()
            engine.inputNode.removeTap(onBus: 0)
        }
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        guard let call = pending else { return }
        pending = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        let heard = guesses.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        guesses = []
        if heard.isEmpty {
            call.reject("No speech", code)
        } else {
            call.resolve(["results": heard])
        }
    }
}
