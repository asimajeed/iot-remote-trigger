# PC Power Android App

Minimal Android app for remote PC power control via AWS IoT.

## Build

```bash
./gradlew assembleDebug
```

## Configuration

Edit `app/src/main/java/com/example/pcpower/AwsIotConfig.kt` with your AWS credentials.

See [Android Setup Guide](../docs/ANDROID_SETUP.md) for details.

## Requirements

- Android 7.0+ (API 24)
- Internet connection
- AWS IoT credentials
