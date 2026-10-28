# Android setup

The source includes the advanced locally bundled Capacitor onboarding app, version `0.6.1` / code `9`. Internal Java classes retain the original `com.soyrocoto.app` namespace for source compatibility. The installable application ID defaults to `org.example.shopworkspace` and is configured for your own package.

Use Node 22+, JDK 21, Android SDK platform 36 and build tools 35/36. The Gradle wrapper pins Gradle 8.14.3 with its distribution checksum; Capacitor pins its platform/plugin versions in the frontend lockfile.

```sh
.venv/bin/python tools/configure.py --origin https://shop.example.com --package-id com.example.shop
cd app
npm run build:android
npm run android:sync
npm run android:test
```

The browser UI is bundled into `dist-android`, then copied by Capacitor. Set your `ANDROID_HOME` outside the repository. `local.properties` stays local. `npm run android:release` additionally requires your own mode-0600 signing properties file, selected by `ROCOTO_ANDROID_SIGNING_PROPERTIES`; it names your keystore, alias and passwords. Preserve that signing identity for upgrades. This export includes the wrapper and native source, while signing material and installed account associations stay private.

The configuration helper updates the manifest callback host, native Auth Tab validation, Java return-link validation, public native API origin and application ID together. Publish your own Digital Asset Links association for the installed signing certificate. Meta authentication templates and the official OTP SDK must use your own package/certificate configuration. A Play installation uses its commissioned Play signing certificate and track.

App Links, PKCE and same-phone binding prevent a browser callback from choosing account authority. Secure pending state survives process recovery. Profile drafts remain navigation/input state, separately from server identity. Auth Tab preserves normal browser login cookies with Custom Tab fallback; the native app redeems the bounded one-use code using its saved verifier.

The included native return-link tests cover exact accepted routes and malformed/secret-bearing variants. APK/AAB compilation, installed link verification, OTP zero/one-tap delivery, full Meta return, keyboard/back behavior and physical haptics require their individual checks. Historical signed artifact compilation remains historical proof rather than your app's release credential.
