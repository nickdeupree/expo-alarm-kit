# Fix: expo-alarm-kit iOS Build Duplicate Symbols Error

## Problem

When building the iOS app, you get a linker error with **10 duplicate symbols**:

```
ld: 10 duplicate symbols
duplicate symbol '_OBJC_CLASS_$_RCTAppDependencyProvider'
duplicate symbol '_OBJC_CLASS_$_RCTModuleProviders'
... (and more)
```

## Root Cause

The `ios/ExpoAlarmKit.podspec` uses a glob pattern that includes files from the Xcode project:

```ruby
# WRONG - includes duplicate symbol files
s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
```

This brings in files from `expoalarmkit.xcodeproj/` that conflict with React Native's codegen.

## Solution

Update `ios/ExpoAlarmKit.podspec` to only include the module implementation files:

```ruby
# CORRECT - only include actual module files
s.source_files = "ExpoAlarmKitModule.swift", "ExpoAlarmKitView.swift"
```

## Full Fixed podspec

```ruby
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoAlarmKit'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '26.0',
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/nickdeupree/expo-alarm-kit' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  # Only include the module implementation files
  s.source_files = "ExpoAlarmKitModule.swift", "ExpoAlarmKitView.swift"
end
```

## Additional Fix: Header Search Paths

If you encounter `'ExpoModulesCore/EXModule.h' file not found`, add header search paths:

```ruby
s.pod_target_xcconfig = {
  'DEFINES_MODULE' => 'YES',
  'SWIFT_INCLUDE_PATHS' => '$(inherited) $(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore',
  'HEADER_SEARCH_PATHS' => '$(inherited) "$(PODS_ROOT)/Headers/Public/ExpoModulesCore"',
}
```

## After Fixing

1. Re-tarball the package: `npm pack`
2. Reinstall in your app:
   ```
   npm install ./expo-alarm-kit-0.1.8.tgz
   # or
   npm install /path/to/expo-alarm-kit-0.1.8.tgz
   ```
3. Run pod install in ios folder
4. Rebuild: `npx expo run:ios`