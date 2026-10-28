package com.soyrocoto.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.HapticFeedbackConstants;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Device feedback and notification settings owned by this app's Android surface. */
@CapacitorPlugin(name = "RocotoNative")
public final class RocotoNativePlugin extends Plugin {
    private static final String CONNECTION_CHANNEL = "whatsapp-connection";
    private static final int CONNECTION_REMINDER_ID = 87320;
    private static final int CONNECTION_CONFIRMED_ID = 87321;
    /** The system sheet lets the owner choose a recipient and send the invitation. */
    @PluginMethod
    public void share(PluginCall call) {
        String text = call.getString("text");
        String title = call.getString("title", "Rocoto");
        if (text == null || text.isEmpty() || text.length() > 12000 || title.length() > 200) {
            call.reject("Share text is invalid.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain")
                    .putExtra(Intent.EXTRA_TEXT, text).putExtra(Intent.EXTRA_SUBJECT, title);
                getActivity().startActivity(Intent.createChooser(send, null));
                call.resolve();
            } catch (RuntimeException error) {
                call.reject("The share sheet could not open.", error);
            }
        });
    }

    @PluginMethod
    public void haptic(PluginCall call) {
        String kind = call.getString("kind");
        if (!"selection".equals(kind) && !"confirm".equals(kind) && !"reject".equals(kind)) {
            call.reject("Choose selection, confirm, or reject.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            int feedback = feedbackFor(kind);
            boolean performed = getBridge().getWebView().performHapticFeedback(feedback);
            call.resolve(new JSObject().put("performed", performed));
        });
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
        } else {
            intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                .setData(android.net.Uri.fromParts("package", getContext().getPackageName(), null));
        }
        getActivity().runOnUiThread(() -> {
            getActivity().startActivity(intent);
            call.resolve();
        });
    }

    /** Opens the fixed WhatsApp Business listing in Google Play, with its web listing as fallback. */
    @PluginMethod
    public void openBusinessAppStore(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                Intent play = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.whatsapp.w4b"))
                    .setPackage("com.android.vending");
                getActivity().startActivity(play);
                call.resolve();
            } catch (ActivityNotFoundException missingPlay) {
                try {
                    getActivity().startActivity(new Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse("https://play.google.com/store/apps/details?id=com.whatsapp.w4b")
                    ));
                    call.resolve();
                } catch (ActivityNotFoundException missingBrowser) {
                    call.reject("The WhatsApp Business listing could not open.", missingBrowser);
                }
            }
        });
    }

    @PluginMethod
    public void getNotificationAvailability(PluginCall call) {
        boolean postNotificationsGranted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
        boolean enabled = postNotificationsGranted
            && NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        call.resolve(new JSObject()
            .put("enabled", enabled)
            .put("channelsSupported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.O));
    }

    /** Shows a bounded reminder whose tap reselects the task without clearing its live Auth Tab. */
    @PluginMethod
    public void showConnectionReminder(PluginCall call) {
        Long expiresAt = call.getLong("expiresAt");
        long nowSeconds = System.currentTimeMillis() / 1000L;
        if (expiresAt == null || expiresAt <= nowSeconds || expiresAt > nowSeconds + 60L * 60L) {
            call.reject("The connection reminder expiry is invalid.");
            return;
        }
        long timeout = (expiresAt - nowSeconds) * 1000L;
        if (!notificationsEnabled()) { call.resolve(); return; }
        ensureConnectionChannel();
        NotificationCompat.Builder reminder = connectionNotification(
            "Continúa tu conexión en Rocoto",
            "Termina de conectar tu WhatsApp Business."
        ).setOngoing(true).setAutoCancel(false).setTimeoutAfter(timeout);
        NotificationManagerCompat.from(getContext()).notify(CONNECTION_REMINDER_ID, reminder.build());
        call.resolve();
    }

    /** Called only after the authenticated server has confirmed the connection. */
    @PluginMethod
    public void notifyConnectionConfirmed(PluginCall call) {
        NotificationManagerCompat manager = NotificationManagerCompat.from(getContext());
        manager.cancel(CONNECTION_REMINDER_ID);
        if (!notificationsEnabled()) { call.resolve(); return; }
        ensureConnectionChannel();
        NotificationCompat.Builder confirmed = connectionNotification(
            "WhatsApp está conectado",
            "Rocoto ya puede continuar con tu cuenta."
        ).setOngoing(false).setAutoCancel(true);
        manager.notify(CONNECTION_CONFIRMED_ID, confirmed.build());
        call.resolve();
    }

    @PluginMethod
    public void cancelConnectionNotifications(PluginCall call) {
        NotificationManagerCompat manager = NotificationManagerCompat.from(getContext());
        manager.cancel(CONNECTION_REMINDER_ID);
        manager.cancel(CONNECTION_CONFIRMED_ID);
        call.resolve();
    }

    private NotificationCompat.Builder connectionNotification(String title, String body) {
        Intent launch = new Intent(getContext(), LauncherActivity.class)
            .setAction(Intent.ACTION_MAIN)
            .addCategory(Intent.CATEGORY_LAUNCHER)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent returnToTask = PendingIntent.getActivity(
            getContext(), CONNECTION_REMINDER_ID, launch, pendingFlags
        );
        return new NotificationCompat.Builder(getContext(), CONNECTION_CHANNEL)
            .setSmallIcon(R.drawable.rocoto_notification_icon)
            .setContentTitle(title)
            .setContentText(body)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setOnlyAlertOnce(true)
            .setContentIntent(returnToTask)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT);
    }

    private boolean notificationsEnabled() {
        return (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED)
            && NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    }

    private void ensureConnectionChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getContext().getSystemService(NotificationManager.class);
        NotificationChannel channel = new NotificationChannel(
            CONNECTION_CHANNEL, "Conexión de WhatsApp", NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Avisos sobre la conexión de WhatsApp con Rocoto.");
        manager.createNotificationChannel(channel);
    }

    private static int feedbackFor(String kind) {
        if ("selection".equals(kind)) return HapticFeedbackConstants.CLOCK_TICK;
        if ("confirm".equals(kind)) {
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                ? HapticFeedbackConstants.CONFIRM : HapticFeedbackConstants.VIRTUAL_KEY;
        }
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
            ? HapticFeedbackConstants.REJECT : HapticFeedbackConstants.LONG_PRESS;
    }
}
