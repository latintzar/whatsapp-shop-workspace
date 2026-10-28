/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from '@capacitor/cli';

/** The tester app ships its UI inside the Android package. */
const config: CapacitorConfig = {
  appId: 'org.example.shopworkspace',
  appName: 'Rocoto',
  webDir: 'dist-android',
  loggingBehavior: 'debug',
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    LocalNotifications: {
      // White source artwork on transparency is required for Android status icons.
      smallIcon: 'rocoto_notification_icon',
    },
  },
};

export default config;
