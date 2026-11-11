import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
        // Widget and Live Activity links (liftsmith://start, log, add30) that cold-started the app.
        connectionOptions.urlContexts.forEach { ShortcutInbox.open($0.url) }
        // Garmin Connect coming back from its watch picker (GarminLink.swift).
        connectionOptions.urlContexts.forEach { GarminLink.shared.open($0.url) }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
        URLContexts.forEach { ShortcutInbox.open($0.url) }
        URLContexts.forEach { GarminLink.shared.open($0.url) }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
