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
    :ios => '26.1',
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/nickdeupree/expo-alarm-kit' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_INCLUDE_PATHS' => '$(inherited) $(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore',
    'HEADER_SEARCH_PATHS' => '$(inherited) "$(PODS_ROOT)/Headers/Public/ExpoModulesCore"',
  }

  # Only include the module implementation files
  s.source_files = "ExpoAlarmKitModule.swift", "ExpoAlarmKitModule.m", "ExpoAlarmKitView.swift"
end
