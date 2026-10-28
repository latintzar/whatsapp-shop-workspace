package com.soyrocoto.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

/**
 * Keeps launcher taps from clearing an in-progress Auth Tab above MainActivity.
 *
 * The launcher normally reselects the existing Rocoto task. If Android creates this routing
 * activity on that task, finishing it reveals the task's current top activity, including the
 * original browser document. A cold launch starts the bridge activity once.
 */
public final class LauncherActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (isTaskRoot()) {
            startActivity(new Intent(this, MainActivity.class)
                .setAction(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_LAUNCHER));
        }
        finish();
    }
}
