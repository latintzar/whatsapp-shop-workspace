package com.soyrocoto.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Zero-tap delivery. The SDK verifies the matching stored handshake before any code is retained. */
public final class WhatsAppOtpReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (RocotoOtpState.receive(context.getApplicationContext(), intent)) {
            RocotoAuthPlugin.signalWhatsAppOtp();
        }
    }
}
