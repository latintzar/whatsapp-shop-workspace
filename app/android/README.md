# Rocoto Android onboarding

This development package bundles the focused bodega onboarding UI from `../dist-android`.
It uses `com.soyrocoto.app`, version code `7`, version name `0.5.1`. Check the highest version code
in Play Console before a store upload. The app signs in through the verified Meta Business
connection, completes the graphical onboarding, and reopens at the account's real waitlist.
The provider flow and physical Android behavior have separate device acceptance evidence.

## Build

Use Node 22+, JDK 21, Android SDK platform 36 and build tools 35.0.0 / 36.0.0. The committed Gradle
wrapper pins Gradle 8.14.3 with its distribution checksum; Capacitor 8.5.2 selects AGP 8.13.0.
Dependencies are pinned by `../package-lock.json`. The SDK on rocoto-dev lives outside Git at
`/home/peter/.local/share/rocoto-android-sdk`; `local.properties` is ignored.

From `app/`:

```sh
npm ci
export ANDROID_HOME=/home/peter/.local/share/rocoto-android-sdk
export ROCOTO_ANDROID_SIGNING_PROPERTIES=/home/peter/.rocoto-keys/keystore.properties
npm run android:release
npm run android:test
```

`android:release` builds the focused UI, derives native launch colors from the shared theme, derives the launcher vector from the canonical brand mark and copies compiled assets, syncs plugin registration through Capacitor, and runs
both `assembleRelease` and `bundleRelease`. Release signing requires the
existing private upload-key properties (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`).
The build stops when that configuration is unavailable. Keys and passwords stay outside source.

Outputs:

- `app/build/outputs/apk/release/app-release.apk` for the authorized tester.
- `app/build/outputs/bundle/release/app-release.aab` for later Play submission.

Check the APK with the SDK's `apksigner verify --print-certs` and `aapt dump badging`. Verify its
certificate against the commissioned upload certificate before handing it off. A Play installation
uses the Play app-signing certificate; that certificate has its own App Links association.

## Native behavior

- `RocotoNative.haptic({kind: 'selection' | 'confirm' | 'reject'})` uses Android's device-calibrated
  feedback and honors the phone's feedback setting. `performed` reports the platform result.
- Official Capacitor Local Notifications 8.3.1 provides permission, channel, action, scheduling and
  receiver integration. Android notifications use the existing Rocoto mark as a white transparent
  status icon. Scheduling remains inexact and the merged manifest removes exact-alarm permission.
- `RocotoNative.getNotificationAvailability()` returns Android's current `{ enabled,
  channelsSupported }` state; channels start at Android 8/API 26. `openNotificationSettings()`
  opens this app's notification settings page.
- Official Capacitor App, Browser and Preferences APIs provide lifecycle/link events, browser
  handoff and device-local draft storage. App backup is disabled for this tester's local state.
- Meta handoff uses AndroidX Auth Tab 1.9.0 with the browser's ordinary cookies and automatic
  Custom Tab fallback. The exact HTTPS callback closes a supported Auth Tab and reaches the app's
  validated redemption path. The regular browser session and Meta's internal page lifecycle remain
  owned by the browser and provider.
- HTTPS API requests remain explicit. App UI comes from bundled assets; `server.url` is absent.
- `rocoto://return` is a development return signal. The verified App Link
  `https://demo.soyrocoto.com/bodega-app/auth` carries a bounded attempt and callback code; the
  app redeems it with its stored verifier before it creates a session.
- `rocoto://waitlist/ABC234` and
  `https://demo.soyrocoto.com/bodega-app/waitlist/ABC234` or
  `https://demo.soyrocoto.com/bodega-app/?lista=ABC234` navigate to the public status for the
  supplied six-character code. `ABC234` is a format example, not a configured account.
- The manifest requests verification only for the dedicated `/bodega-app/` path. Link verification
  depends on publishing the domain's Digital Asset Links document and a device verification check;
  the manifest alone establishes neither. Existing Meta browser routes retain their own behavior.
- Native entry validation rejects unrelated paths, credentials, fragments and provider-code
  parameters before Capacitor's link events. Returned links remain untrusted navigation input.

`ReturnLinkTest` covers permitted return/status links, the bounded auth callback and malformed
or secret-bearing variants.
Physical feedback, Android back behavior, keyboard/insets and the live App Links association still
require a device smoke test. The launcher uses `public/brand/rocoto-mark.svg` on the theme’s paper background; the notification mask
comes from the existing `public/brand/rocoto-mark.svg`, with white pixels on transparency.
