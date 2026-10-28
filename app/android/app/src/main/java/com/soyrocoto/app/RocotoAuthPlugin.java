package com.soyrocoto.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.security.GeneralSecurityException;

/** Encrypted native state and the installed-client check for the Meta handoff. */
@CapacitorPlugin(name = "RocotoAuth")
public final class RocotoAuthPlugin extends Plugin {
    private static final String SESSION = "session.access-token";
    private static final String PENDING = "pending.attempt";
    private static final int SESSION_LIMIT = 16 * 1024;
    private static final int PENDING_LIMIT = 8 * 1024;
    private static volatile RocotoAuthPlugin active;

    @Override
    public void load() {
        active = this;
    }
    @PluginMethod
    public void getSession(PluginCall call) { read(call, SESSION, "token"); }

    @PluginMethod
    public void setSession(PluginCall call) { write(call, SESSION, call.getString("token"), SESSION_LIMIT); }

    @PluginMethod
    public void clearSession(PluginCall call) {
        clear(call, SESSION);
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        read(call, PENDING, "value");
    }

    @PluginMethod
    public void setPending(PluginCall call) {
        write(call, PENDING, call.getString("value"), PENDING_LIMIT);
    }

    @PluginMethod
    public void clearPending(PluginCall call) {
        clear(call, PENDING);
    }

    /** An explicit sign-in recovery action; failed reads never trigger this reset. */
    @PluginMethod
    public void resetSession(PluginCall call) {
        try {
            RocotoSecureStore.reset(getContext(), SESSION, PENDING, RocotoOtpState.HANDSHAKE, RocotoOtpState.CODE);
            call.resolve();
        } catch (GeneralSecurityException error) {
            call.reject("Protected authentication state could not be reset.", error);
        }
    }

    /** Starts a fresh WhatsApp OTP handshake; prior received code/handshake state is discarded. */
    @PluginMethod
    public void prepareOtp(PluginCall call) {
        active = this;
        try {
            call.resolve(new JSObject().put("available", RocotoOtpState.prepare(getContext())));
        } catch (GeneralSecurityException | RuntimeException error) {
            call.reject("WhatsApp verification could not start.", error);
        }
    }

    /** Returns a validated provider-delivered code without exposing it through listener payloads. */
    @PluginMethod
    public void consumeWhatsAppOtp(PluginCall call) {
        active = this;
        try {
            JSObject result = new JSObject();
            String code = RocotoOtpState.consume(getContext());
            if (code != null) result.put("code", code);
            call.resolve(result);
        } catch (GeneralSecurityException error) {
            call.reject("WhatsApp verification state is unavailable.", error);
        }
    }

    @PluginMethod
    public void clearWhatsAppOtp(PluginCall call) {
        try {
            RocotoOtpState.clear(getContext());
            call.resolve();
        } catch (GeneralSecurityException error) {
            call.reject("WhatsApp verification state could not be cleared.", error);
        }
    }

    /** Called by exported provider entry points; the web layer then consumes encrypted state. */
    static void signalWhatsAppOtp() {
        RocotoAuthPlugin plugin = active;
        if (plugin == null) return;
        try {
            plugin.notifyListeners("whatsAppOtp", new JSObject());
        } catch (RuntimeException ignored) {
            // Process-death delivery stays in encrypted state for the next app refresh.
        }
    }

    /** Reports only the Auth Tab lifecycle result; account approval remains server-authoritative. */
    static void signalMetaReturn(String outcome) {
        RocotoAuthPlugin plugin = active;
        if (plugin == null) return;
        try {
            plugin.notifyListeners("metaReturn", new JSObject().put("outcome", outcome));
        } catch (RuntimeException ignored) {
            // Durable attempt recovery is owned by the authenticated server handoff.
        }
    }

    /** Launches the approved Meta handoff; its verified result returns through App.appUrlOpen. */
    @PluginMethod
    public void openMeta(PluginCall call) {
        String url = call.getString("url");
        if (!ReturnLink.acceptsMetaEntry(url)) {
            call.reject("The Meta handoff URL is invalid.");
            return;
        }
        Activity activity = getActivity();
        if (!(activity instanceof MainActivity)) {
            call.reject("The Meta handoff is unavailable.");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                ((MainActivity) activity).openMetaAuthTab(url);
                call.resolve();
            } catch (ActivityNotFoundException | IllegalStateException error) {
                call.reject("The Meta handoff is unavailable.");
            } catch (IllegalArgumentException error) {
                call.reject("The Meta handoff URL is invalid.");
            }
        });
    }

    /** Returns which installed WhatsApp app can carry the next Meta instruction. */
    @PluginMethod
    public void getWhatsAppApps(PluginCall call) {
        call.resolve(new JSObject()
            .put("business", installed("com.whatsapp.w4b"))
            .put("personal", installed("com.whatsapp")));
    }

    private void read(PluginCall call, String name, String property) {
        try {
            JSObject result = new JSObject();
            String value = RocotoSecureStore.read(getContext(), name);
            if (value != null) result.put(property, value);
            call.resolve(result);
        } catch (GeneralSecurityException error) {
            call.reject("Protected authentication state is unavailable.", error);
        }
    }

    private void write(PluginCall call, String name, String value, int limit) {
        if (value == null || value.isEmpty() || value.length() > limit) {
            call.reject("Authentication value is invalid.");
            return;
        }
        try {
            RocotoSecureStore.write(getContext(), name, value);
            call.resolve();
        } catch (GeneralSecurityException error) {
            call.reject("Protected authentication state could not be saved.", error);
        }
    }

    private void clear(PluginCall call, String name) {
        try {
            RocotoSecureStore.remove(getContext(), name);
            call.resolve();
        } catch (GeneralSecurityException error) {
            call.reject("Protected authentication state could not be cleared.", error);
        }
    }

    private boolean installed(String packageName) {
        try {
            getContext().getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException ignored) {
            return false;
        }
    }
}
