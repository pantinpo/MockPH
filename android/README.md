# MockCall AI Android

This folder is created by Capacitor. Run:

```sh
npm install
npm run android:add
npm run android:sync
npm run android:open
```

Android requires:

- `android.permission.RECORD_AUDIO`
- Google Play Billing integration for AI minutes
- A microphone permission explanation
- The AI API base URL
- No Gemini, OAuth, OTP, or payment secrets in the Android bundle

The existing `/ai` web routes should remain accessible inside the WebView. Authentication and all minutes accounting remain server-side.
