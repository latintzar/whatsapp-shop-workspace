package com.soyrocoto.app;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

/** One-tap fallback delivery. It closes immediately after retaining the SDK-validated code. */
public final class WhatsAppOtpActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Intent intent = getIntent();
        if (intent != null && RocotoOtpState.receive(getApplicationContext(), intent)) {
            RocotoAuthPlugin.signalWhatsAppOtp();
            Intent rocoto = new Intent(this, MainActivity.class);
            rocoto.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(rocoto);
        }
        finish();
    }
}
