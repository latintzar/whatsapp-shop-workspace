package com.soyrocoto.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.browser.auth.AuthTabIntent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String AUTH_TAB_OPEN = "rocoto.auth-tab-open";
    private static final String AUTH_REDIRECT_HOST = "shop.example.invalid";
    private static final String AUTH_REDIRECT_PATH = "/bodega-app/auth";
    private boolean authTabOpen;

    /** Registered before onCreate, as AndroidX Auth Tab requires. */
    private final ActivityResultLauncher<Intent> authTabLauncher =
        AuthTabIntent.registerActivityResultLauncher(this, this::handleAuthResult);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        authTabOpen = savedInstanceState != null && savedInstanceState.getBoolean(AUTH_TAB_OPEN, false);
        setIntent(sanitized(getIntent()));
        registerPlugin(RocotoNativePlugin.class);
        registerPlugin(RocotoAuthPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        outState.putBoolean(AUTH_TAB_OPEN, authTabOpen);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (authTabOpen) {
            // A live Auth Tab stays above MainActivity, so reaching RESUMED without its result
            // means the saved launch latch outlived the browser activity. Clear only the latch:
            // foregrounding Rocoto is not provider evidence, and the web layer owns recovery.
            authTabOpen = false;
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(sanitized(intent));
    }

    /** Opens only the fixed local Meta entry. Auth Tab keeps the browser's regular cookie jar. */
    void openMetaAuthTab(String rawUrl) {
        if (!ReturnLink.acceptsMetaEntry(rawUrl)) throw new IllegalArgumentException("The Meta handoff URL is invalid.");
        if (authTabOpen) return;
        AuthTabIntent tab = new AuthTabIntent.Builder().build();
        // AndroidX automatically falls back to a standard Custom Tab where Auth Tab is unavailable.
        authTabOpen = true;
        try {
            tab.launch(authTabLauncher, Uri.parse(rawUrl), AUTH_REDIRECT_HOST, AUTH_REDIRECT_PATH);
        } catch (RuntimeException error) {
            authTabOpen = false;
            throw error;
        }
    }

    private void handleAuthResult(AuthTabIntent.AuthResult result) {
        authTabOpen = false;
        if (result == null) {
            RocotoAuthPlugin.signalMetaReturn("failed");
            return;
        }
        if (result.resultCode == AuthTabIntent.RESULT_CANCELED) {
            RocotoAuthPlugin.signalMetaReturn("closed");
            return;
        }
        if (result.resultCode != AuthTabIntent.RESULT_OK || result.resultUri == null) {
            RocotoAuthPlugin.signalMetaReturn("failed");
            return;
        }
        String rawUrl = result.resultUri.toString();
        if (!ReturnLink.accepts(rawUrl)) {
            RocotoAuthPlugin.signalMetaReturn("failed");
            return;
        }
        // This reuses Capacitor's AppPlugin handling, which delivers appUrlOpen to the web layer.
        Intent callback = new Intent(Intent.ACTION_VIEW, result.resultUri).setPackage(getPackageName());
        setIntent(callback);
        onNewIntent(callback);
        RocotoAuthPlugin.signalMetaReturn("callback");
    }

    private static Intent sanitized(Intent intent) {
        if (intent == null || intent.getData() == null) return intent;
        if (ReturnLink.accepts(intent.getDataString())) return intent;
        Intent clean = new Intent(intent);
        clean.setData(null);
        return clean;
    }
}
