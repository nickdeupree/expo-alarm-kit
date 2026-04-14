# Fixing expo-alarm-kit iOS Native Module

This document describes what's required to fix the iOS native module linking issue.

## Current Problem

The package is missing the native iOS implementation, causing the runtime error:
```
Error: Cannot find module 'ExpoAlarmKit'
```

Even after running `npx expo prebuild`, the module is not linked in the iOS project because:
1. No `.podspec` file exists for CocoaPods autolinking
2. No Swift native module implementation exists in `ios/expoalarmkit/`

## Required Files

### 1. Create a Podspec

Create `ios/ExpoAlarmKit.podspec`:

```ruby
Pod::Spec.new do |s|
  s.name             = "ExpoAlarmKit"
  s.version          = "0.1.8"
  s.summary          = "Expo module for iOS AlarmKit integration"
  s.description      = "Schedule native iOS alarms with optional app launch on dismissal or snooze intents"
  s.homepage        = "https://github.com/nickdeupree/expo-alarm-kit"
  s.license         = "MIT"
  s.author          = { "Nick Deupree" => "nicholasdeupree@gmail.com" }
  s.platform        = :ios, "26.0"
  s.source          = { :path => "." }
  s.source_files    = "LocalPods/ExpoAlarmKit/**/*.{h,m,mm,swift}"
  s.frameworks      = "Foundation", "UIKit", "UserNotifications", "AlarmKit"
  s.dependency      "React-Core"
  s.dependency      "ExpoModulesCore"
  s.swift_version  = "5.0"
end
```

### 2. Create Native Module Implementation

Create the directory structure:
```
ios/LocalPods/ExpoAlarmKit/
```

Create `ios/LocalPods/ExpoAlarmKit/ExpoAlarmKitModule.swift`:

```swift
import Foundation
import ExpoModulesCore
import AlarmKit

@objc(ExpoAlarmKit)
class ExpoAlarmKitModule: NSObject {

  private var appGroupIdentifier: String?

  @objc
  func configure(_ appGroupIdentifier: String) -> Bool {
    self.appGroupIdentifier = appGroupIdentifier
    // Validate App Group exists
    return UserDefaults(suiteName: appGroupIdentifier) != nil
  }

  @objc
  func requestAuthorization(_ resolve: @escaping PromiseResolve, reject: @escaping PromiseReject) {
    AlarmKit.requestAuthorization { status in
      switch status {
      case .authorized:
        resolve("authorized")
      case .denied:
        resolve("denied")
      case .notDetermined:
        resolve("notDetermined")
      @unknown default:
        resolve("notDetermined")
      }
    }
  }

  @objc
  func generateUUID() -> String {
    return UUID().uuidString
  }

  @objc
  func scheduleAlarm(_ options: [String: Any], resolve: @escaping PromiseResolve, reject: @escaping PromiseReject) {
    // Implementation using AlarmKit APIs
    // Parse options, create alarm, return success
  }

  @objc
  func scheduleRepeatingAlarm(_ options: [String: Any], resolve: @escaping PromiseResolve, reject: @escaping PromiseReject) {
    // Implementation for repeating alarms
  }

  @objc
  func cancelAlarm(_ alarmId: String, resolve: @escaping PromiseResolve, reject: @escaping PromiseReject) {
    // Cancel the alarm
  }

  @objc
  func getAllAlarms() -> [String] {
    // Read from App Group UserDefaults
    return []
  }

  @objc
  func getLaunchPayload() -> [String: Any]? {
    // Read from App Group UserDefaults
    return nil
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  static func moduleName() -> String! {
    return "ExpoAlarmKit"
  }
}
```

Create the Objective-C bridging header `ios/LocalPods/ExpoAlarmKit/ExpoAlarmKitModule.m`:

```objc
#import <ExpoModulesCore/EXModule.h>

@interface EX_MODULE_CLASS(ExpoAlarmKit) : EXModule
@end
```

And update the module to use EX_MODULE_CLASS macro in Swift.

### 3. Update expo-module.config.json

Ensure it declares the module:

```json
{
  "platforms": ["apple"],
  "apple": {
    "modules": ["ExpoAlarmKitModule"]
  }
}
```

## Alternative: Simpler Approach

### Use expo-module-scripts to Generate

Run in the expo-alarm-kit project directory:

```bash
npx expo-module init LocalPods/ExpoAlarmKit
```

This will generate the proper structure with:
- Podspec
- Native module Swift implementation
- Objective-C bridging

## After Fixing

In the main app, run:

```bash
npx expo prebuild --platform ios --clean
pod install
npx expo run:ios
```

## Requirements Summary

| Item | Status | Required |
|------|--------|----------|
| iOS Deployment Target | 26.0 | ✅ Set in Xcode |
| Privacy - Alarm Kit Usage Description | Add in Info.plist | Required |
| App Groups capability | Configure in Xcode | Required |
| Podspec | Must create | Required |
| Native module Swift | Must create | Required |