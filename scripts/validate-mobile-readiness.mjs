import { readFile } from 'node:fs/promises'

const files = {
  capacitor: await readFile('capacitor.config.ts', 'utf8'),
  android: await readFile('android/app/build.gradle', 'utf8'),
  androidManifest: await readFile('android/app/src/main/AndroidManifest.xml', 'utf8'),
  androidActivity: await readFile('android/app/src/main/java/com/rewardsplatform/app/MainActivity.java', 'utf8'),
  ios: await readFile('ios/App/App/Info.plist', 'utf8'),
  iosProject: await readFile('ios/App/App.xcodeproj/project.pbxproj', 'utf8'),
  icons: await readFile('ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json', 'utf8'),
}
const checks = [
  ['neutral app id', files.capacitor.includes("appId: 'com.rewardsplatform.app'")],
  ['Pinas app name', files.capacitor.includes("appName: 'Pinas Rewards'")],
  ['web directory', files.capacitor.includes("webDir: 'dist'")],
  ['android namespace', files.android.includes('com.rewardsplatform.app')],
  ['android activity package', files.androidActivity.includes('package com.rewardsplatform.app;')],
  ['android internet permission', files.androidManifest.includes('android.permission.INTERNET')],
  ['android deep-link scheme', files.androidManifest.includes('android:scheme="rewardsplatform"')],
  ['ios display name', files.ios.includes('CFBundleDisplayName')],
  ['ios bundle identifier', files.iosProject.includes('PRODUCT_BUNDLE_IDENTIFIER = com.rewardsplatform.app;')],
  ['ios deep-link scheme', files.ios.includes('<string>rewardsplatform</string>')],
  ['ios icon catalog', JSON.parse(files.icons).images.length > 0],
]
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name)
console.log(JSON.stringify({ passed: failures.length === 0, checks: checks.map(([name, passed]) => ({ name, passed })), failures }, null, 2))
process.exit(failures.length ? 1 : 0)
