# MockCall AI Android

This is the native Android project directory. The web companion is not the AI product; `ai-app/` is the Android app's packaged UI source.

```sh
npm install
npm run android:build
npm run android:open
```

Before a Google Play internal test:

- Install a supported JDK and Android SDK, then configure `ANDROID_HOME`.
- Set up a Play Console app and application signing.
- Add `android.permission.RECORD_AUDIO` with a clear permission explanation.
- Integrate Google Play Billing for minute packages.
- Configure real authentication and the AI API.
- Upload a signed Android App Bundle (`.aab`) to the internal testing track.

Authentication and minutes accounting must remain server-side. Do not put Gemini, OAuth, OTP, or payment secrets in the Android bundle.

On Windows, build the release bundle from the project root after installing the Android toolchain:

```powershell
.\android\gradlew.bat -p android bundleRelease
```

The resulting bundle is written under `android\app\build\outputs\bundle\release\`.
