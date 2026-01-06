import ExpoModulesCore
import AlarmKit
import AppIntents
import SwiftUI

// MARK: - Storage Keys
private let alarmKeyPrefix = "ExpoAlarmKit.alarm:"
private let launchAppKeyPrefix = "ExpoAlarmKit.launchApp:"

// MARK: - App Group Storage Manager
@available(iOS 26.0, *)
public class ExpoAlarmKitStorage {
    public static var appGroupIdentifier: String? = nil
    
    public static var sharedDefaults: UserDefaults? {
        guard let groupId = appGroupIdentifier else {
            print("[ExpoAlarmKit] Warning: App Group not configured. Call configure() first.")
            return nil
        }
        return UserDefaults(suiteName: groupId)
    }
    
    public static func setAlarm(id: String, value: Double) {
        sharedDefaults?.set(value, forKey: alarmKeyPrefix + id)
    }
    
    public static func removeAlarm(id: String) {
        sharedDefaults?.removeObject(forKey: alarmKeyPrefix + id)
    }
    
    public static func getAllAlarmIds() -> [String] {
        guard let defaults = sharedDefaults?.dictionaryRepresentation() else { return [] }
        var alarmIds: [String] = []
        for key in defaults.keys {
            if key.hasPrefix(alarmKeyPrefix) {
                let alarmId = String(key.dropFirst(alarmKeyPrefix.count))
                alarmIds.append(alarmId)
            }
        }
        return alarmIds
    }
    
    public static func clearAllAlarms() {
        guard let defaults = sharedDefaults?.dictionaryRepresentation() else { return }
        for key in defaults.keys {
            if key.hasPrefix(alarmKeyPrefix) {
                sharedDefaults?.removeObject(forKey: key)
            }
        }
    }
    
    public static func setLaunchAppOnDismiss(alarmId: String, value: Bool) {
        sharedDefaults?.set(value, forKey: launchAppKeyPrefix + alarmId)
    }
    
    public static func getLaunchAppOnDismiss(alarmId: String) -> Bool {
        return sharedDefaults?.bool(forKey: launchAppKeyPrefix + alarmId) ?? false
    }
    
    public static func removeLaunchAppOnDismiss(alarmId: String) {
        sharedDefaults?.removeObject(forKey: launchAppKeyPrefix + alarmId)
    }
}

// MARK: - Record Structs for Expo Module
struct ScheduleAlarmOptions: Record {
    @Field var id: String
    @Field var epochSeconds: Double
    @Field var title: String
    @Field var soundName: String?
    @Field var launchAppOnDismiss: Bool?
    @Field var stopButtonLabel: String?
    @Field var snoozeButtonLabel: String?
    @Field var stopButtonColor: String?
    @Field var snoozeButtonColor: String?
    @Field var tintColor: String?
    @Field var snoozeDuration: Int?
}

struct ScheduleRepeatingAlarmOptions: Record {
    @Field var id: String
    @Field var hour: Int
    @Field var minute: Int
    @Field var weekdays: [Int]
    @Field var title: String
    @Field var soundName: String?
    @Field var launchAppOnDismiss: Bool?
    @Field var stopButtonLabel: String?
    @Field var snoozeButtonLabel: String?
    @Field var stopButtonColor: String?
    @Field var snoozeButtonColor: String?
    @Field var tintColor: String?
    @Field var snoozeDuration: Int?
}

// MARK: - Helper Functions
private func colorFromHex(_ hex: String) -> Color {
    var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
    
    var rgb: UInt64 = 0
    Scanner(string: hexSanitized).scanHexInt64(&rgb)
    
    let r = Double((rgb & 0xFF0000) >> 16) / 255.0
    let g = Double((rgb & 0x00FF00) >> 8) / 255.0
    let b = Double(rgb & 0x0000FF) / 255.0
    
    return Color(red: r, green: g, blue: b)
}

// MARK: - App Intent for Alarm Dismissal (No App Launch)
@available(iOS 26.0, *)
public struct AlarmDismissIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "Dismiss Alarm"
    public static var description = IntentDescription("Handles alarm dismissal")
    public static var openAppWhenRun: Bool = false
    
    @Parameter(title: "alarmId")
    public var alarmId: String
    
    public init() {}
    
    public init(alarmId: String) {
        self.alarmId = alarmId
    }
    
    public func perform() async throws -> some IntentResult {
        // Store payload for JS to retrieve
        ExpoAlarmKitModule.launchPayload = [
            "alarmId": self.alarmId,
        ]
        
        // Clean up App Group storage
        ExpoAlarmKitStorage.removeAlarm(id: self.alarmId)
        ExpoAlarmKitStorage.removeLaunchAppOnDismiss(alarmId: self.alarmId)
        
        return .result()
    }
}

// MARK: - App Intent for Alarm Dismissal (With App Launch)
@available(iOS 26.0, *)
public struct AlarmDismissIntentWithLaunch: LiveActivityIntent {
    public static var title: LocalizedStringResource = "Dismiss Alarm"
    public static var description = IntentDescription("Handles alarm dismissal and opens app")
    public static var openAppWhenRun: Bool = true
    
    @Parameter(title: "alarmId")
    public var alarmId: String
    
    public init() {}
    
    public init(alarmId: String) {
        self.alarmId = alarmId
    }
    
    public func perform() async throws -> some IntentResult {
        // Store payload for JS to retrieve
        ExpoAlarmKitModule.launchPayload = [
            "alarmId": self.alarmId,
        ]
        
        // Clean up App Group storage
        ExpoAlarmKitStorage.removeAlarm(id: self.alarmId)
        ExpoAlarmKitStorage.removeLaunchAppOnDismiss(alarmId: self.alarmId)
        
        return .result()
    }
}

// MARK: - Expo Module
public class ExpoAlarmKitModule: Module {
    // Static payload for app launch detection
    public static var launchPayload: [String: Any]? = nil
    
    public func definition() -> ModuleDefinition {
        Name("ExpoAlarmKit")
        
        // MARK: - Configure App Group
        Function("configure") { (appGroupIdentifier: String) throws -> Bool in
            if #available(iOS 26.0, *) {
                ExpoAlarmKitStorage.appGroupIdentifier = appGroupIdentifier
                // Verify the app group is accessible
                if ExpoAlarmKitStorage.sharedDefaults != nil {
                    print("[ExpoAlarmKit] Configured with App Group: \(appGroupIdentifier)")
                    return true
                } else {
                    print("[ExpoAlarmKit] Failed to configure App Group: \(appGroupIdentifier)")
                    return false
                }
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
        
        // MARK: - Request Authorization
        AsyncFunction("requestAuthorization") { () throws -> String in
            if #available(iOS 26.0, *) {
                let status = AlarmManager.shared.authorizationState
            switch status {
            case .authorized:
                return "authorized"
            case .denied:
                do {
                    let newStatus = try await AlarmManager.shared.requestAuthorization()
                    switch newStatus {
                    case .authorized:
                        return "authorized"
                    case .denied:
                        return "denied"
                    case .notDetermined:
                        return "notDetermined"
                    @unknown default:
                        return "notDetermined"
                    }
                } catch {
                    return "denied"
                }
            case .notDetermined:
                do {
                    let newStatus = try await AlarmManager.shared.requestAuthorization()
                    switch newStatus {
                    case .authorized:
                        return "authorized"
                    case .denied:
                        return "denied"
                    case .notDetermined:
                        return "notDetermined"
                    @unknown default:
                        return "notDetermined"
                    }
                } catch {
                    return "denied"
                }
                @unknown default:
                    return "notDetermined"
                }
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
        
        // MARK: - Generate UUID
        Function("generateUUID") { () throws -> String in
            if #available(iOS 26.0, *) {
                return UUID().uuidString
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
        
        // MARK: - Schedule One-Time Alarm
        AsyncFunction("scheduleAlarm") { (options: ScheduleAlarmOptions) async throws -> Bool in
            if #available(iOS 26.0, *) {
                struct Meta: AlarmMetadata {}
            
            let date = Date(timeIntervalSince1970: options.epochSeconds)
            guard let uuid = UUID(uuidString: options.id) else {
                print("[ExpoAlarmKit] Invalid UUID string: \(options.id)")
                return false
            }
            let launchAppOnDismiss = options.launchAppOnDismiss ?? false
            
            // Create stop button
            let stopLabel = options.stopButtonLabel ?? "Stop"
            let stopColor = options.stopButtonColor != nil ? colorFromHex(options.stopButtonColor!) : Color.white
            let stopButton = AlarmButton(
                text: LocalizedStringResource(stringLiteral: stopLabel),
                textColor: stopColor,
                systemImageName: "stop.circle"
            )
            
            // Create snooze button
            let snoozeLabel = options.snoozeButtonLabel ?? "Snooze"
            let snoozeColor = options.snoozeButtonColor != nil ? colorFromHex(options.snoozeButtonColor!) : Color.white
            let snoozeButton = AlarmButton(
                text: LocalizedStringResource(stringLiteral: snoozeLabel),
                textColor: snoozeColor,
                systemImageName: "clock.badge.checkmark"
            )
            
            // Create alert presentation with intent if needed
            let alertPresentation = AlarmPresentation.Alert(
                title: LocalizedStringResource(stringLiteral: options.title),
                stopButton: stopButton,
                secondaryButton: snoozeButton,
                secondaryButtonBehavior: .countdown
            )
            
            let presentation = AlarmPresentation(alert: alertPresentation)
            
            // Create countdown duration for snooze
            let countdownDuration = Alarm.CountdownDuration(
                preAlert: nil,
                postAlert: TimeInterval(options.snoozeDuration ?? (9 * 60))
            )
            
            // Create attributes
            let alarmTintColor = options.tintColor != nil ? colorFromHex(options.tintColor!) : Color.blue
            let attributes = AlarmAttributes<Meta>(
                presentation: presentation,
                metadata: Meta(),
                tintColor: alarmTintColor
            )
            
            // Determine sound
            let alarmSound: AlertConfiguration.AlertSound
            if let soundName = options.soundName, !soundName.isEmpty {
                alarmSound = .named(soundName)
            } else {
                alarmSound = .default
            }
            
            // Choose the appropriate intent based on launchAppOnDismiss
            // AlarmDismissIntentWithLaunch sets openAppWhenRun=true, AlarmDismissIntent sets it to false
            let stopIntent: any LiveActivityIntent = launchAppOnDismiss
                ? AlarmDismissIntentWithLaunch(alarmId: options.id)
                : AlarmDismissIntent(alarmId: options.id)
            
            // Create configuration
            let config = AlarmManager.AlarmConfiguration<Meta>(
                countdownDuration: countdownDuration,
                schedule: .fixed(date),
                attributes: attributes,
                stopIntent: stopIntent,
                secondaryIntent: nil,
                sound: alarmSound
            )
            
            do {
                try await AlarmManager.shared.schedule(id: uuid, configuration: config)
                // Store alarm metadata in App Group
                ExpoAlarmKitStorage.setAlarm(id: options.id, value: options.epochSeconds)
                return true
                } catch {
                    print("[ExpoAlarmKit] Failed to schedule alarm: \(error)")
                    return false
                }
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
        
        // MARK: - Schedule Repeating Alarm
        AsyncFunction("scheduleRepeatingAlarm") { ( options: ScheduleRepeatingAlarmOptions) async throws -> Bool in
            if #available(iOS 26.0, *) {
                struct Meta: AlarmMetadata {}
            
            guard let uuid = UUID(uuidString: options.id) else {
                print("[ExpoAlarmKit] Invalid UUID string: \(options.id)")
                return false
            }
            let launchAppOnDismiss = options.launchAppOnDismiss ?? false
            
            // Convert weekday ints to Locale.Weekday
            // JS passes 1=Sunday, 2=Monday, etc. (matching iOS Calendar weekday)
            let weekdayArray: [Locale.Weekday] = Array(Set(options.weekdays.compactMap { day -> Locale.Weekday? in
                switch day {
                case 1: return .sunday
                case 2: return .monday
                case 3: return .tuesday
                case 4: return .wednesday
                case 5: return .thursday
                case 6: return .friday
                case 7: return .saturday
                default: return nil
                }
            }))
            
            // Create relative schedule with time and recurrence
            let time = Alarm.Schedule.Relative.Time(hour: options.hour, minute: options.minute)
            let recurrence = Alarm.Schedule.Relative.Recurrence.weekly(weekdayArray)
            let schedule = Alarm.Schedule.relative(Alarm.Schedule.Relative(time: time, repeats: recurrence))
            
            // Create stop button
            let stopLabel = options.stopButtonLabel ?? "Stop"
            let stopColor = options.stopButtonColor != nil ? colorFromHex(options.stopButtonColor!) : Color.white
            let stopButton = AlarmButton(
                text: LocalizedStringResource(stringLiteral: stopLabel),
                textColor: stopColor,
                systemImageName: "stop.circle"
            )
            
            // Create snooze button
            let snoozeLabel = options.snoozeButtonLabel ?? "Snooze"
            let snoozeColor = options.snoozeButtonColor != nil ? colorFromHex(options.snoozeButtonColor!) : Color.white
            let snoozeButton = AlarmButton(
                text: LocalizedStringResource(stringLiteral: snoozeLabel),
                textColor: snoozeColor,
                systemImageName: "clock.badge.checkmark"
            )
            
            // Create alert presentation
            let alertPresentation = AlarmPresentation.Alert(
                title: LocalizedStringResource(stringLiteral: options.title),
                stopButton: stopButton,
                secondaryButton: snoozeButton,
                secondaryButtonBehavior: .countdown
            )
            
            let presentation = AlarmPresentation(alert: alertPresentation)
            
            // Create countdown duration for snooze
            let countdownDuration = Alarm.CountdownDuration(
                preAlert: nil,
                postAlert: TimeInterval(options.snoozeDuration ?? (9 * 60))
            )
            
            // Create attributes
            let alarmTintColor = options.tintColor != nil ? colorFromHex(options.tintColor!) : Color.blue
            let attributes = AlarmAttributes<Meta>(
                presentation: presentation,
                metadata: Meta(),
                tintColor: alarmTintColor
            )
            
            // Determine sound
            let alarmSound: AlertConfiguration.AlertSound
            if let soundName = options.soundName, !soundName.isEmpty {
                alarmSound = .named(soundName)
            } else {
                alarmSound = .default
            }
            
            // Choose the appropriate intent based on launchAppOnDismiss
            // AlarmDismissIntentWithLaunch sets openAppWhenRun=true, AlarmDismissIntent sets it to false
            let stopIntent: any LiveActivityIntent = launchAppOnDismiss
                ? AlarmDismissIntentWithLaunch(alarmId: options.id)
                : AlarmDismissIntent(alarmId: options.id)
            
            // Create configuration with relative schedule
            let config = AlarmManager.AlarmConfiguration<Meta>(
                countdownDuration: countdownDuration,
                schedule: schedule,
                attributes: attributes,
                stopIntent: stopIntent,
                secondaryIntent: nil,
                sound: alarmSound
            )
            
            do {
                try await AlarmManager.shared.schedule(id: uuid, configuration: config)
                // Store alarm metadata in App Group (store -1 for repeating to indicate repeating type)
                ExpoAlarmKitStorage.setAlarm(id: options.id, value: -1)
                return true
                } catch {
                    print("[ExpoAlarmKit] Failed to schedule repeating alarm: \(error)")
                    return false
                }
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
        
        // MARK: - Cancel Alarm
        AsyncFunction("cancelAlarm") { (id: String) throws -> Bool in
            if #available(iOS 26.0, *) {
                guard let uuid = UUID(uuidString: id) else {
                    print("[ExpoAlarmKit] Invalid UUID string: \(id)")
                    return false
                }
                
                do {
                    try AlarmManager.shared.cancel(id: uuid)
                    // Clean up App Group storage
                    ExpoAlarmKitStorage.removeAlarm(id: id)
                    ExpoAlarmKitStorage.removeLaunchAppOnDismiss(alarmId: id)
                    return true
                } catch {
                    print("[ExpoAlarmKit] Failed to cancel alarm: \(error)")
                    return false
                }
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
        
        // MARK: - Get All Alarms
        Function("getAllAlarms") { () throws -> [String] in
            if #available(iOS 26.0, *) {
                return ExpoAlarmKitStorage.getAllAlarmIds()
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }

        
        // MARK: - Remove Alarm (from App Group storage only)
        Function("removeAlarm") { (id: String) in
            if #available(iOS 26.0, *) {
                ExpoAlarmKitStorage.removeAlarm(id: id)
                ExpoAlarmKitStorage.removeLaunchAppOnDismiss(alarmId: id)
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
        
        // MARK: - Clear All Alarms (from App Group storage only)
        Function("clearAllAlarms") { () in
            if #available(iOS 26.0, *) {
                ExpoAlarmKitStorage.clearAllAlarms()
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
        
        // MARK: - Get Launch Payload
        Function("getLaunchPayload") { () throws -> [String: Any]? in
            if #available(iOS 26.0, *) {
                let payload = ExpoAlarmKitModule.launchPayload
                // Clear after retrieval
                ExpoAlarmKitModule.launchPayload = nil
                return payload
            } else {
                throw Exception(
                    name: "UNSUPPORTED_IOS_VERSION",
                    description: "ExpoAlarmKit requires iOS 26.0 or later. Current iOS version is not supported."
                )
            }
        }
    }
}