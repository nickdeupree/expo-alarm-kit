# expo-alarm-kit

An Expo module for iOS AlarmKit integration. Schedule native iOS alarms with optional app launch on dismissal.

> **⚠️ Requirements:**
> * **iOS Deployment Target:** 26.0+
> * **Expo SDK:** 50+
> * **Framework:** Apple AlarmKit

## Features

* 📅 **Schedule Native Alarms:** Create alarms that persist even if the app is killed.
* 🔄 **Repeating Alarms:** Support for weekly repeating schedules.
* 🚀 **App Launch Triggers:** Optionally launch your app when the user dismisses the alarm.
* 🎨 **Customization:** Configure titles, snooze settings, and tint colors.
* 💾 **Shared State:** Uses App Groups to synchronize alarm state between the system and your app.

---

## Installation

```bash
npm install expo-alarm-kit
# or
yarn add expo-alarm-kit

```

Since this module utilizes native iOS frameworks, you must prebuild your project:

```bash
npx expo prebuild

```

---

## Configuration (Required)

This module requires native iOS configuration to function. **If these steps are skipped, the module will throw errors.**

### 1. Set Deployment Target

In Xcode, navigate to your project's **Build Settings** and ensure the **iOS Deployment Target** is set to **26.0** or higher.

> ❌ **Error:** Failing to do this will result in a "Module not found: ExpoAlarmKit" error.

### 2. Add Usage Description

Apple requires you to justify why you need access to alarms.

1. Open your project in Xcode.
2. Select your app target and go to the **Info** tab.
3. Add a new key: `Privacy - Alarm Kit Usage Description`.
4. Value: Enter a short description (e.g., *"We use alarms to wake you up at your scheduled times."*)

### 3. Configure App Groups

App Groups allow the Alarm extension to communicate with your main application.

1. In Xcode, select your app target.
2. Go to **Signing & Capabilities**.
3. Click **+ Capability** and select **App Groups**.
4. Add a new group identifier (e.g., `group.com.yourcompany.yourapp`).

> **Important:** This identifier must match exactly what you pass to the `configure()` method in your JavaScript code.

---

## Usage

### 1. Initialization

You must configure the module with your App Group ID as early as possible in your app's lifecycle (e.g., inside `App.tsx` or `_layout.tsx`).

```typescript
import { useEffect } from 'react';
import { configure, getLaunchPayload } from 'expo-alarm-kit';

export default function App() {
  useEffect(() => {
    // 1. Initialize the module
    const isConfigured = configure('group.com.yourcompany.yourapp');
    
    if (!isConfigured) {
      console.error('Failed to configure ExpoAlarmKit. Check App Group ID.');
    }

    // 2. Check if app was launched via alarm dismissal
    const payload = getLaunchPayload();
    if (payload) {
      console.log('App launched by alarm:', payload.alarmId);
      // Navigate to specific screen or perform action
    }
  }, []);

  return <YourAppContent />;
}

```

### 2. Scheduling Alarms

```typescript
import { 
  scheduleAlarm, 
  scheduleRepeatingAlarm, 
  generateUUID, 
  requestAuthorization 
} from 'expo-alarm-kit';

const handleSchedule = async () => {
  // Always request permission first
  const authStatus = await requestAuthorization();
  if (authStatus !== 'authorized') return;

  // Example: Schedule a one-time alarm for 1 hour from now
  const alarmId = generateUUID();
  
  await scheduleAlarm({
    id: alarmId,
    epochSeconds: Date.now() / 1000 + 3600, 
    title: 'Power Nap Over',
    soundName: 'alarm.wav', // Must be in Xcode bundle resources
    launchAppOnDismiss: true,
    snoozeDuration: 300, // 5 minutes
  });
};

const handleRepeatingSchedule = async () => {
  // Example: Schedule for Mon-Fri at 7:30 AM
  const id = generateUUID();
  
  await scheduleRepeatingAlarm({
    id,
    hour: 7,
    minute: 30,
    weekdays: [2, 3, 4, 5, 6], // 1=Sun, 2=Mon...
    title: 'Work Alarm',
    launchAppOnDismiss: true,
  });
};

```

### 3. Managing Alarms

```typescript
import { cancelAlarm, getAllAlarms } from 'expo-alarm-kit';

// Get list of active alarm IDs
const activeAlarms = getAllAlarms();

// Cancel a specific alarm
await cancelAlarm('your-alarm-uuid');

```

---

## How It Works

### App Groups & Shared Storage

This module relies on **iOS App Groups** to share `UserDefaults` between the main app process and the system alarm extension.

* **Persistence:** When you schedule an alarm, the metadata is written to this shared storage.
* **Sync:** Both the Native Module and the App Extension read from this same source of truth.

### App Launch on Dismiss

When `launchAppOnDismiss: true` is set:

1. The user swipes to dismiss the alarm on the lock screen.
2. The system launches your app in the background/foreground.
3. The module writes a `LaunchPayload` to the shared storage.
4. When your React Native JS bundle loads, calling `getLaunchPayload()` retrieves and clears this data, allowing you to react to the event.

---

## API Reference

### Configuration & Auth

#### `configure(appGroupIdentifier: string): boolean`

Initializes the module. **Must be called before other methods.**

* **Returns:** `true` if the App Group was accessible.

#### `requestAuthorization(): Promise<AuthorizationStatus>`

Prompts the user for permission to schedule alarms.

* **Returns:** `'authorized' | 'denied' | 'notDetermined'`

---

### Scheduling

#### `scheduleAlarm(options): Promise<boolean>`

Schedules a non-repeating alarm.

**Options Object:**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | **Yes** | Unique UUID. |
| `epochSeconds` | `number` | No* | Unix timestamp (seconds) for the alarm. |
| `date` | `Date` | No* | *Alternative:* JS Date object. |
| `title` | `string` | **Yes** | Main text displayed on lock screen. |
| `soundName` | `string` | No | Filename of sound in app bundle. |
| `launchAppOnDismiss` | `boolean` | No | If `true`, opens app when stopped. |
| `stopButtonLabel` | `string` | No | Text for stop button (default: 'Stop'). |
| `snoozeButtonLabel` | `string` | No | Text for snooze button. |
| `stopButtonColor` | `string` | No | Hex color string. |
| `snoozeButtonColor` | `string` | No | Hex color string. |
| `tintColor` | `string` | No | Overall UI tint color. |
| `snoozeDuration` | `number` | No | Duration in seconds (default: 540). |

**Note: Provide either `epochSeconds` OR `date`, not both.*

#### `scheduleRepeatingAlarm(options): Promise<boolean>`

Schedules a weekly repeating alarm.

**Options Object:**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | **Yes** | Unique UUID. |
| `hour` | `number` | **Yes** | 0-23 |
| `minute` | `number` | **Yes** | 0-59 |
| `weekdays` | `number[]` | **Yes** | Array of integers: 1 (Sun) to 7 (Sat). |
| `title` | `string` | **Yes** | Main text displayed. |
| `launchAppOnDismiss` | `boolean` | No | If `true`, opens app when stopped. |
| ... | ... | ... | *Supports all visual options from `scheduleAlarm*` |

---

### Utilities

#### `cancelAlarm(id: string): Promise<boolean>`

Cancels the alarm in AlarmKit and removes it from shared storage.

#### `generateUUID(): string`

Helper to generate a unique ID string for new alarms.

#### `getAllAlarms(): string[]`

Returns an array of IDs for all currently scheduled alarms.

#### `getLaunchPayload(): LaunchPayload | null`

Returns data if the app was launched via an alarm.

```typescript
interface LaunchPayload {
  alarmId: string;
  dismissTime: number; // Unix timestamp
}

```

#### `removeAlarm(id: string): void`

*Advanced:* Removes an alarm from local storage records without cancelling the native AlarmKit instance. Use `cancelAlarm` for standard usage.

---

## Known Issues

* **Custom Labels/Colors:** The `stopButtonLabel`, `stopButtonColor` properties are not correctly modifying the stop button/slider.