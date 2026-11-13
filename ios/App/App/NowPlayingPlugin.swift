import Capacitor
import MediaPlayer
import UIKit

/// Now playing (src/lib/nowPlaying.ts; docs/decisions/now-playing.md): play, pause and skip music from Today
/// and the workout screen. Melvin asked for it on 2026-11-13 in place of the mood playlists.
///
/// iOS lets an app control only the Music app (MPMusicPlayerController.systemMusicPlayer, which needs the
/// lifter's OK for Apple Music and the media library). Spotify, YouTube Music and other apps can't be read or
/// controlled by another app on iOS; there's Control Centre for those. Platform deltas records the gap.
/// Listens only between watch and unwatch, while the control is on screen. Android counterpart:
/// NowPlayingPlugin.java.
@objc(NowPlayingPlugin)
public class NowPlayingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NowPlayingPlugin"
    public let jsName = "NowPlaying"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "state", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "watch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unwatch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "control", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "access", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "askAccess", returnType: CAPPluginReturnPromise),
    ]

    private var watching = false

    private var granted: Bool { MPMediaLibrary.authorizationStatus() == .authorized }
    private var canAsk: Bool { MPMediaLibrary.authorizationStatus() == .notDetermined }

    private func snapshot() -> [String: Any] {
        var out: [String: Any] = ["granted": granted]
        guard granted else {
            out["now"] = NSNull()
            return out
        }
        let player = MPMusicPlayerController.systemMusicPlayer
        guard let item = player.nowPlayingItem else {
            out["now"] = NSNull()
            return out
        }
        var now: [String: Any] = ["playing": player.playbackState == .playing, "app": "Apple Music"]
        if let title = item.title, !title.isEmpty { now["title"] = title }
        if let artist = item.artist, !artist.isEmpty { now["artist"] = artist }
        out["now"] = now
        return out
    }

    @objc private func changed() {
        guard watching else { return }
        notifyListeners("change", data: snapshot())
    }

    @objc func state(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(self.snapshot()) }
    }

    @objc func watch(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if !self.watching && self.granted {
                self.watching = true
                let player = MPMusicPlayerController.systemMusicPlayer
                player.beginGeneratingPlaybackNotifications()
                let center = NotificationCenter.default
                center.addObserver(self, selector: #selector(self.changed), name: .MPMusicPlayerControllerPlaybackStateDidChange, object: player)
                center.addObserver(self, selector: #selector(self.changed), name: .MPMusicPlayerControllerNowPlayingItemDidChange, object: player)
            }
            call.resolve(self.snapshot())
        }
    }

    @objc func unwatch(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.stop()
            call.resolve()
        }
    }

    private func stop() {
        guard watching else { return }
        watching = false
        let player = MPMusicPlayerController.systemMusicPlayer
        NotificationCenter.default.removeObserver(self, name: .MPMusicPlayerControllerPlaybackStateDidChange, object: player)
        NotificationCenter.default.removeObserver(self, name: .MPMusicPlayerControllerNowPlayingItemDidChange, object: player)
        player.endGeneratingPlaybackNotifications()
    }

    @objc func control(_ call: CAPPluginCall) {
        let what = call.getString("do") ?? ""
        DispatchQueue.main.async {
            guard self.granted else { return call.resolve() }
            let player = MPMusicPlayerController.systemMusicPlayer
            switch what {
            case "play": player.play()
            case "pause": player.pause()
            case "next": player.skipToNextItem()
            case "previous": player.skipToPreviousItem()
            default: break
            }
            call.resolve()
        }
    }

    @objc func access(_ call: CAPPluginCall) {
        call.resolve(["granted": granted, "canAsk": canAsk])
    }

    /// Asks for Apple Music once; after a no, iOS only lets the lifter change it in Settings, so that opens.
    @objc func askAccess(_ call: CAPPluginCall) {
        if canAsk {
            MPMediaLibrary.requestAuthorization { _ in
                DispatchQueue.main.async { call.resolve(["granted": self.granted, "canAsk": self.canAsk]) }
            }
            return
        }
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
            call.resolve(["granted": self.granted, "canAsk": self.canAsk])
        }
    }
}
