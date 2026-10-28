package com.soyrocoto.app;

import android.content.Context;
import android.content.Intent;
import com.whatsapp.otp.android.sdk.WhatsAppOtpHandler;
import com.whatsapp.otp.android.sdk.WhatsAppOtpIncomingIntentHandler;
import java.security.GeneralSecurityException;
import java.util.UUID;

/** The provider handshake and received code stay outside the web bundle and ordinary preferences. */
final class RocotoOtpState {
    static final String HANDSHAKE = "otp.handshake-id";
    static final String CODE = "otp.received-code";
    static boolean prepare(Context context) throws GeneralSecurityException {
        clear(context);
        try {
            WhatsAppOtpHandler handler = new WhatsAppOtpHandler();
            if (!handler.isWhatsAppOtpHandshakeSupported(context)) return false;
            UUID handshakeId = UUID.randomUUID();
            // WhatsApp can answer as soon as this SDK call broadcasts. Store the exact UUID first
            // so the exported receiver has an expected handshake even on that fast path.
            RocotoSecureStore.write(context, HANDSHAKE, handshakeId.toString());
            UUID sent = handler.sendOtpIntentToWhatsApp(handshakeId, context);
            if (sent == null || !handshakeId.equals(sent)) {
                RocotoSecureStore.remove(context, HANDSHAKE);
                return false;
            }
            return true;
        } catch (RuntimeException unavailable) {
            // WhatsApp may be absent, stale, or unable to accept a handshake. The server can
            // still send the approved template and the person can use its Copy Code fallback.
            clear(context);
            return false;
        }
    }

    static String consume(Context context) throws GeneralSecurityException {
        return RocotoSecureStore.read(context, CODE);
    }

    static void clear(Context context) throws GeneralSecurityException {
        RocotoSecureStore.remove(context, HANDSHAKE);
        RocotoSecureStore.remove(context, CODE);
    }

    static boolean receive(Context context, Intent intent) {
        try {
            String expected = RocotoSecureStore.read(context, HANDSHAKE);
            if (expected == null || expected.isEmpty()) return false;
            WhatsAppOtpIncomingIntentHandler handler = new WhatsAppOtpIncomingIntentHandler();
            final String[] received = new String[1];
            handler.processOtpCode(intent, expected, code -> received[0] = code, (error, exception) -> { });
            String code = received[0];
            if (code == null || !code.matches("\\d{6}")) return false;
            RocotoSecureStore.write(context, CODE, code);
            return true;
        } catch (GeneralSecurityException | RuntimeException ignored) {
            // An untrusted exported broadcast must never become a crash or reveal OTP state.
            return false;
        }
    }

    private RocotoOtpState() {}
}
