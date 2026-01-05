# expo-alarm-kit

An Expo module for iOS AlarmKit integration. Schedule native iOS alarms with optional app launch on dismissal.

> **Note:** This module requires iOS 26.0+ and uses Apple's AlarmKit framework.

## Installation

```bash
npm install expo-alarm-kit
# or
yarn add expo-alarm-kit
```

Then run:

```bash
npx expo prebuild
```

## Setup

### 1. iOS Configuration
**Note:** In Xcode, set your project's iOS Deployment Target to **26.0** or higher. This is required for AlarmKit support. Failing to do so will result in a **Module not found, ExpoAlarmKit** error.

#### a. AlarmKit Usage Description

Add the **Privacy - Alarm Kit Usage Description** key to your app's iOS target `Info.plist` in Xcode (select your custom iOS target, open the **Info** tab, add a new row named `Privacy - Alarm Kit Usage Description`, and provide a short description of why your app needs Alarm Kit access).

#### b. App Groups (Required)

This module requires an App Group to share data between your app and the alarm dismiss intent. App Groups enable your app and alarm extension to communicate through shared UserDefaults storage, allowing alarm state to persist across process boundaries.

In Xcode:
1. Select your app target
2. Go to **Signing & Capabilities**
3. Click **+ Capability** and add **App Groups**
4. Add a new App Group (e.g., `group.com.yourcompany.yourapp`)

**Important:** The App Group identifier must match exactly in the module configuration - mismatches will prevent alarms from functioning properly.

### 2. Configure the Module

Call `configure()` early in your app initialization (before scheduling any alarms):

```typescript
import { configure } from 'expo-alarm-kit';

// Call this in your App component or entry point
const success = configure('group.com.yourcompany.yourapp');
if (!success) {
  console.error('Failed to configure ExpoAlarmKit - check your App Group identifier');
}
```

## How It Works

### App Groups & Shared Storage

This module uses iOS App Groups to maintain alarm state in shared UserDefaults that both your app and the alarm extension can access. When you call methods like `scheduleAlarm()`, `cancelAlarm()`, or `getAllAlarms()`, they interact with this shared storage. This approach ensures:

- **Persistence**: Alarms remain scheduled even if the app is terminated
- **Extension Communication**: The alarm extension and your app can coordinate without direct inter-process communication
- **State Synchronization**: Both processes see the same list of scheduled alarms

The App Group identifier you configure must match the App Group added in Xcode, or the module won't be able to access the shared storage.

### Launch Payload

When you set `launchAppOnDismiss: true` on an alarm, and the user dismisses the alarm from the lock screen, the app will launch. Your app can detect this by calling `getLaunchPayload()`:

```typescript
const payload = getLaunchPayload();
if (payload) {
  console.log(`Alarm dismissed: ${payload.alarmId}`);
  console.log(`Dismissed at: ${new Date(payload.dismissTime * 1000)}`);
  // Navigate to a relevant screen, show a notification, etc.
}
```

The payload is stored in shared UserDefaults and cleared after retrieval, so subsequent calls return `null`. Call this early in your app initialization (e.g., in your root component's `useEffect`) to ensure you capture the payload if the app was launched from an alarm.

## Usage

### Import styles

You can import functions individually:

```typescript
import {
  configure,
  requestAuthorization,
  scheduleAlarm,
  scheduleRepeatingAlarm,
  cancelAlarm,
  getAllAlarms,
  getLaunchPayload,
  generateUUID,
} from 'expo-alarm-kit';
```

Or import the entire module as a namespace:

```typescript
import ExpoAlarmKit from 'expo-alarm-kit';

// Use methods on the object
ExpoAlarmKit.configure('group.com.yourcompany.yourapp');
ExpoAlarmKit.scheduleAlarm({ ... });
```

### Configuration and basic usage

```typescript
// Configure first (do this once at app startup)
configure('group.com.yourcompany.yourapp');

// Request permission to schedule alarms
const status = await requestAuthorization();
// Returns: 'authorized' | 'denied' | 'notDetermined'

// Schedule a one-time alarm
const alarmId = generateUUID();
const success = await scheduleAlarm({
  id: alarmId,
  epochSeconds: Date.now() / 1000 + 3600, // 1 hour from now
  title: 'Wake Up!',
  soundName: 'alarm.wav', // optional, must be in app bundle
  launchAppOnDismiss: true, // optional, launches app when alarm is dismissed
  stopButtonLabel: 'Dismiss', // optional, custom stop button text
  snoozeButtonLabel: '5 More Minutes', // optional, enables snooze button
  stopButtonColor: '#FF0000', // optional, hex color for stop button
  snoozeButtonColor: '#00FF00', // optional, hex color for snooze button
  tintColor: '#FF6B00', // optional, overall alarm tint color
  snoozeDuration: 540, // optional, snooze duration in seconds (default: 540 = 9 minutes)
});

// Schedule a weekly repeating alarm
const repeatingAlarmId = generateUUID();
await scheduleRepeatingAlarm({
  id: repeatingAlarmId,
  hour: 7,
  minute: 30,
  weekdays: [2, 3, 4, 5, 6], // Monday through Friday (1=Sun, 2=Mon, ..., 7=Sat)
  title: 'Weekday Alarm',
  launchAppOnDismiss: true,
  stopButtonLabel: 'Stop',
  snoozeButtonLabel: 'Snooze',
  tintColor: '#4A90E2',
  snoozeDuration: 600, // 10 minutes
});

// Cancel an alarm
await cancelAlarm(repeatingAlarmId);

// Get all scheduled alarm IDs
const alarms = getAllAlarms();
console.log(alarms); // [UUID strings]

// Check if app was launched from an alarm dismissal
const payload = getLaunchPayload();
if (payload) {
  console.log(`App launched from alarm: ${payload.alarmId}`);
  console.log(`Dismissed at: ${new Date(payload.dismissTime * 1000)}`);
}
```

## API Reference

### `configure(appGroupIdentifier: string): boolean`

Configure the module with your App Group identifier. **This must be called before any other methods.**

**Parameters:**
- `appGroupIdentifier` - Your App Group identifier (e.g., `'group.com.yourcompany.yourapp'`)

**Returns:** `true` if configuration succeeded

---

### `requestAuthorization(): Promise<AuthorizationStatus>`

Request authorization to schedule alarms. On first call, this will prompt the user for permission.

**Returns:** `'authorized'` | `'denied'` | `'notDetermined'`

---

### `scheduleAlarm(options): Promise<boolean>`

Schedule a one-time alarm.

**Options:**
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the alarm |
| `epochSeconds` | `number` | Yes | Unix timestamp (seconds) for when the alarm should fire |
| `title` | `string` | Yes | Title displayed for the alarm |
| `soundName` | `string` | No | Custom sound name (must exist in app bundle) |
| `launchAppOnDismiss` | `boolean` | No | Launch the app when the alarm stop button is pressed (default: `false`) |
| `stopButtonLabel` | `string` | No | Custom label for the stop button (default: `'Stop'`) |
| `snoozeButtonLabel` | `string` | No | Custom label for the snooze button (default: `'Snooze'`) |
| `stopButtonColor` | `string` | No | Hex color for stop button text (default: `'#FFFFFF'`) |
| `snoozeButtonColor` | `string` | No | Hex color for snooze button text (default: `'#FFFFFF'`) |
| `tintColor` | `string` | No | Hex color for overall alarm appearance (default: `'#0000FF'`) |
| `snoozeDuration` | `number` | No | Snooze duration in seconds (default: `540` = 9 minutes) |

**Returns:** `true` if scheduled successfully

---

### `scheduleRepeatingAlarm(options): Promise<boolean>`

Schedule a weekly repeating alarm.

**Options:**
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the alarm |
| `hour` | `number` | Yes | Hour (0-23) for the alarm |
| `minute` | `number` | Yes | Minute (0-59) for the alarm |
| `weekdays` | `number[]` | Yes | Weekday numbers: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat |
| `title` | `string` | Yes | Title displayed for the alarm |
| `soundName` | `string` | No | Custom sound name (must exist in app bundle) |
| `launchAppOnDismiss` | `boolean` | No | Launch the app when the alarm stop button is pressed (default: `false`) |
| `stopButtonLabel` | `string` | No | Custom label for the stop button (default: `'Stop'`) |
| `snoozeButtonLabel` | `string` | No | Custom label for the snooze button (default: `'Snooze'`) |
| `stopButtonColor` | `string` | No | Hex color for stop button text (default: `'#FFFFFF'`) |
| `snoozeButtonColor` | `string` | No | Hex color for snooze button text (default: `'#FFFFFF'`) |
| `tintColor` | `string` | No | Hex color for overall alarm appearance (default: `'#0000FF'`) |
| `snoozeDuration` | `number` | No | Snooze duration in seconds (default: `540` = 9 minutes) |

**Returns:** `true` if scheduled successfully

---

### `cancelAlarm(id: string): Promise<boolean>`

Cancel a scheduled alarm. Removes the alarm from both AlarmKit and local storage.

**Returns:** `true` if cancelled successfully

---

### `generateUUID(): string`

Generate a unique alarm ID. **Use this to create IDs for new alarms.**

**Returns:** A unique UUID string suitable for use as an alarm ID

---

### `getAllAlarms(): string[]`

Get all currently scheduled alarm IDs.

**Returns:** Array of alarm ID strings

---

### `removeAlarm(id: string): void`

Remove an alarm from local storage. **Note:** This does NOT cancel the native alarm. Use `cancelAlarm()` to fully cancel an alarm.

---

### `getLaunchPayload(): LaunchPayload | null`

Get the launch payload if the app was opened from an alarm dismissal. The payload is cleared after retrieval.

**Returns:**
```typescript
interface LaunchPayload {
  alarmId: string;
  dismissTime: number; // Unix timestamp in seconds
}
```
Returns `null` if the app was not launched from an alarm.

 
## Requirements

- iOS 26.0+
- Expo SDK 50+

## Known Issues

- Stop label & stop color cannot be changed at the moment
