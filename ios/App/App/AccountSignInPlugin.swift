import AuthenticationServices
import Capacitor
import CryptoKit
import UIKit

/// Sign in for Liftsmith accounts (src/lib/auth.ts), iOS side (Android: AccountSignInPlugin.java).
/// - Apple: AuthenticationServices' own sheet. Returns the identity token and the one-time authorization code
///   (the server swaps it for a refresh token so deleting the account can revoke it, as Apple requires).
/// - Google: the OAuth code flow with PKCE in an ASWebAuthenticationSession, using the iOS client id, then the
///   code exchange (no client secret for iOS clients). Returns Google's ID token. No Google SDK is bundled.
/// In both, the nonce is the SHA-256 of a value the web layer keeps, and the server checks the token's
/// signature, audience and nonce (src/server/idToken.ts).
@objc(AccountSignInPlugin)
public class AccountSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding, ASWebAuthenticationPresentationContextProviding
{
    public let identifier = "AccountSignInPlugin"
    public let jsName = "AccountSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "apple", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "google", returnType: CAPPluginReturnPromise),
    ]

    private var appleCall: CAPPluginCall?
    private var webSession: ASWebAuthenticationSession?

    private func anchor() -> ASPresentationAnchor {
        bridge?.webView?.window ?? ASPresentationAnchor()
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor { anchor() }
    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor { anchor() }

    // MARK: Sign in with Apple

    @objc func apple(_ call: CAPPluginCall) {
        let nonce = call.getString("nonce") ?? ""
        DispatchQueue.main.async {
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.email]
            request.nonce = nonce
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.appleCall = call
            controller.performRequests()
        }
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = appleCall else { return }
        appleCall = nil
        guard let cred = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = cred.identityToken, let token = String(data: tokenData, encoding: .utf8)
        else {
            call.reject("Apple didn't return a sign-in.")
            return
        }
        var out: [String: Any] = ["idToken": token]
        if let codeData = cred.authorizationCode, let code = String(data: codeData, encoding: .utf8) { out["code"] = code }
        call.resolve(out)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = appleCall else { return }
        appleCall = nil
        if (error as? ASAuthorizationError)?.code == .canceled {
            call.reject("cancelled", "cancelled")
        } else {
            call.reject("Apple sign-in didn't work.", nil, error)
        }
    }

    // MARK: Sign in with Google (OAuth with PKCE)

    private static func randomString() -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return base64url(Data(bytes))
    }

    private static func base64url(_ data: Data) -> String {
        data.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }

    @objc func google(_ call: CAPPluginCall) {
        guard let clientId = call.getString("clientId"), !clientId.isEmpty else {
            call.reject("Google sign-in isn't set up in this build.")
            return
        }
        let nonce = call.getString("nonce") ?? ""
        // "123-abc.apps.googleusercontent.com" -> "com.googleusercontent.apps.123-abc", Google's redirect scheme for iOS clients.
        let scheme = clientId.components(separatedBy: ".").reversed().joined(separator: ".")
        let redirect = "\(scheme):/oauth2redirect"
        let verifier = Self.randomString()
        let challenge = Self.base64url(Data(SHA256.hash(data: Data(verifier.utf8))))
        let state = Self.randomString()
        var comps = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        comps.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: redirect),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email"),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "nonce", value: nonce),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "prompt", value: "select_account"),
        ]
        guard let url = comps.url else {
            call.reject("Google sign-in didn't work.")
            return
        }
        DispatchQueue.main.async {
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { [weak self] callback, error in
                self?.webSession = nil
                if let e = error as? ASWebAuthenticationSessionError, e.code == .canceledLogin {
                    call.reject("cancelled", "cancelled")
                    return
                }
                guard let callback = callback,
                      let items = URLComponents(url: callback, resolvingAgainstBaseURL: false)?.queryItems,
                      items.first(where: { $0.name == "state" })?.value == state,
                      let code = items.first(where: { $0.name == "code" })?.value
                else {
                    call.reject("Google sign-in didn't finish.")
                    return
                }
                Self.exchange(code: code, clientId: clientId, redirect: redirect, verifier: verifier, call: call)
            }
            session.presentationContextProvider = self
            self.webSession = session
            session.start()
        }
    }

    private static func exchange(code: String, clientId: String, redirect: String, verifier: String, call: CAPPluginCall) {
        var form = URLComponents()
        form.queryItems = [
            URLQueryItem(name: "code", value: code),
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: redirect),
            URLQueryItem(name: "grant_type", value: "authorization_code"),
            URLQueryItem(name: "code_verifier", value: verifier),
        ]
        var req = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        req.httpMethod = "POST"
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        req.httpBody = form.percentEncodedQuery?.data(using: .utf8)
        URLSession.shared.dataTask(with: req) { data, _, _ in
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let idToken = json["id_token"] as? String
            else {
                call.reject("Google sign-in didn't finish. Check your connection.")
                return
            }
            call.resolve(["idToken": idToken])
        }.resume()
    }
}
