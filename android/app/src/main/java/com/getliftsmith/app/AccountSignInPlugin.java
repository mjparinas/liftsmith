package com.getliftsmith.app;

import android.os.CancellationSignal;
import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

/**
 * Sign in with Google for Liftsmith accounts (src/lib/auth.ts), Android side (iOS: AccountSignInPlugin.swift).
 * Uses Credential Manager's "Sign in with Google" sheet and returns Google's ID token; the server checks it
 * (src/server/idToken.ts). The token is issued to the web client id (serverClientId); Google matches this app
 * by its package name and signing certificate through the Android OAuth client in the same Google Cloud project.
 * Sign in with Apple isn't offered on Android (AGENTS.md "Platform deltas").
 */
@CapacitorPlugin(name = "AccountSignIn")
public class AccountSignInPlugin extends Plugin {

    @PluginMethod
    public void google(PluginCall call) {
        String serverClientId = call.getString("serverClientId", "");
        String nonce = call.getString("nonce", "");
        if (serverClientId == null || serverClientId.isEmpty()) {
            call.reject("Google sign-in isn't set up in this build.");
            return;
        }
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(serverClientId).setNonce(nonce).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        CredentialManager manager = CredentialManager.create(getContext());
        manager.getCredentialAsync(
            getActivity(),
            request,
            new CancellationSignal(),
            ContextCompat.getMainExecutor(getContext()),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse result) {
                    Credential c = result.getCredential();
                    if (c instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())) {
                        GoogleIdTokenCredential g = GoogleIdTokenCredential.Companion.createFrom(((CustomCredential) c).getData());
                        JSObject out = new JSObject();
                        out.put("idToken", g.getIdToken());
                        call.resolve(out);
                    } else {
                        call.reject("Google didn't return a sign-in.");
                    }
                }

                @Override
                public void onError(GetCredentialException e) {
                    if (e instanceof GetCredentialCancellationException) call.reject("cancelled", "cancelled");
                    else if (e instanceof NoCredentialException) call.reject("No Google account on this phone. Add one in Settings, or use email.");
                    else call.reject(e.getMessage() != null ? e.getMessage() : "Google sign-in didn't work.");
                }
            }
        );
    }

    @PluginMethod
    public void apple(PluginCall call) {
        call.unavailable("Sign in with Apple isn't offered on Android.");
    }
}
