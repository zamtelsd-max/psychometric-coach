#!/usr/bin/env bash
# PsychometricCoach Android APK Build Script
# Run this on a machine with Android Studio & JDK 17+ installed
# OR use GitHub Actions workflow

set -e

echo "1. Building Next.js static export..."
NEXT_PUBLIC_API_URL=https://depcxnwq.gensparkclaw.com/psy-api/api/v1 npm run build

echo "2. Syncing Capacitor..."
npx cap sync android

echo "3. Building APK (debug)..."
cd android
./gradlew assembleDebug

echo ""
echo "✅ APK location:"
find . -name "*.apk" -type f 2>/dev/null
