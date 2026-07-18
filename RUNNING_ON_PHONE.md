# Running Cashier-App-Mobile on Your Android Phone

This project is a **bare React Native app** (no Expo), so you preview it via
a debug build installed directly on your phone over USB — not Expo Go.

## One-time setup

1. **Install Android Studio** (includes the Android SDK):
   https://developer.android.com/studio

2. **Set environment variables** (Windows), so `adb` and the SDK tools are
   on your PATH. Add these to your System Environment Variables:
   - `ANDROID_HOME` = `C:\Users\<you>\AppData\Local\Android\Sdk`
   - Add to `PATH`:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\emulator`

   Restart your terminal after setting these.

3. **Install Java (JDK 17)** if not already installed — required by Gradle.
   Android Studio usually bundles one, but double check `java -version`
   works in your terminal.

4. **Enable Developer Options on your phone**:
   - Settings → About phone → tap "Build number" 7 times.
   - Go back to Settings → System → Developer options.
   - Turn on **USB debugging**.

## Every time you want to run the app

1. Plug your phone into your PC via USB.
2. On the phone, allow the "Allow USB debugging?" popup (check "always
   allow from this computer").
3. Verify the device is detected:
   ```
   adb devices
   ```
   You should see your device listed as `device` (not `unauthorized`).
   If it says `unauthorized`, check your phone screen for the permission
   popup.

4. From the project root (`Cashier-App-Mobile`), install dependencies if
   you haven't yet:
   ```
   npm install
   ```

5. Run the app:
   ```
   npx react-native run-android
   ```
   This builds a debug APK and installs + launches it on your phone
   automatically. First build can take a few minutes.

6. For live-reloading during development, keep the Metro bundler running
   (it usually starts automatically with the command above; if not, run
   `npx react-native start` in a separate terminal).

## Troubleshooting

- `adb devices` shows nothing → check USB cable (must support data, not
  just charging), try a different port, or reinstall phone USB drivers.
- Build fails with SDK/license errors → open Android Studio → SDK Manager,
  install the SDK Platform matching this project, and accept licenses:
  ```
  sdkmanager --licenses
  ```
- `ANDROID_HOME not found` → re-check step 2, restart terminal/PC after
  setting env vars.
- App installs but crashes immediately → run `adb logcat` while relaunching
  to see the native error.

## Alternative: WiFi instead of USB

Once your phone and PC are on the same WiFi network, you can skip the
cable using `adb`'s wireless debugging (Android 11+):
1. Phone → Developer options → Wireless debugging → turn on.
2. Tap "Pair device with pairing code" and follow the on-screen `adb pair`
   instructions on your PC.
3. Then `adb connect <phone-ip>:<port>` and run `npx react-native run-android`
   as usual.

## How to stop

- **Stop Metro bundler**: click into that terminal window and press
  `Ctrl+C` (confirm if prompted). This stops live-reload/bundling.
- **Stop/close the app on the phone**: just close it normally (recent
  apps → swipe away), same as any other app. Stopping Metro does not
  uninstall or close the app itself.
- **Fully uninstall the debug app from your phone**:
  ```
  adb uninstall com.cashierappmobile
  ```
  (check the actual package name in `android/app/build.gradle` under
  `applicationId` if this doesn't match).
- **Disconnect the device session** (optional, e.g. after WiFi debugging):
  ```
  adb disconnect
  ```
  or unplug the USB cable — no adb command required for wired sessions.
