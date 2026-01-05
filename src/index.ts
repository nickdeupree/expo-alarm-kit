import ExpoAlarmKitModule, {
  AuthorizationStatus,
  LaunchPayload,
} from './ExpoAlarmKitModule';

export { AuthorizationStatus, LaunchPayload };

/**
 * Configure the module with an App Group identifier.
 * This MUST be called before any other methods to enable shared storage
 * between your app and the alarm dismiss intent.
 * 
 * @param appGroupIdentifier - The App Group identifier (e.g., "group.com.yourapp.alarms")
 * @returns True if configuration succeeded.
 * 
 * @example
 * ```typescript
 * import { configure } from 'expo-alarm-kit';
 * 
 * // Call this early in your app initialization
 * const success = configure('group.com.yourcompany.yourapp');
 * if (!success) {
 *   console.error('Failed to configure ExpoAlarmKit');
 * }
 * ```
 */
export function configure(appGroupIdentifier: string): boolean {
  return ExpoAlarmKitModule.configure(appGroupIdentifier);
}

/**
 * Request authorization to schedule alarms.
 * On first call, this will prompt the user for permission.
 * @returns The current authorization status.
 */
export async function requestAuthorization(): Promise<AuthorizationStatus> {
  return ExpoAlarmKitModule.requestAuthorization();
}

/**
 * Generate a valid UUID string for use as an alarm ID.
 * Call this before scheduling an alarm to get a unique identifier.
 * @returns A new UUID string.
 */
export function generateUUID(): string {
  return ExpoAlarmKitModule.generateUUID();
}

export interface ScheduleAlarmOptions {
  /** Unique identifier for the alarm */
  id: string;
  /** Unix timestamp in seconds for when the alarm should fire. Provide either this or date. */
  epochSeconds?: number;
  /** JavaScript Date object for when the alarm should fire. Provide either this or epochSeconds. */
  date?: Date;
  /** Title displayed for the alarm */
  title: string;
  /** Optional custom sound name (must exist in app bundle) */
  soundName?: string;
  /** Whether to launch the app when the alarm stop button is pressed. Defaults to false. */
  launchAppOnDismiss?: boolean;
  /** Custom label for the stop button (default: 'Stop') */
  stopButtonLabel?: string;
  /** Custom label for the snooze button (default: 'Snooze') */
  snoozeButtonLabel?: string;
  /** Hex color for the stop button text (default: '#FFFFFF') */
  stopButtonColor?: string;
  /** Hex color for the snooze button text (default: '#FFFFFF') */
  snoozeButtonColor?: string;
  /** Hex color for the overall alarm tint (default: '#0000FF') */
  tintColor?: string;
  /** Snooze duration in seconds (default: 540 = 9 minutes) */
  snoozeDuration?: number;
}

/**
 * Schedule a one-time alarm.
 * @param options - Alarm configuration options. Provide either epochSeconds or date.
 * @returns True if the alarm was scheduled successfully.
 */
export async function scheduleAlarm(options: ScheduleAlarmOptions): Promise<boolean> {
  // Convert Date to epochSeconds if provided
  let epochSeconds: number;
  
  if (options.date !== undefined && options.epochSeconds !== undefined) {
    throw new Error('Provide either epochSeconds or date, not both');
  }
  
  if (options.date !== undefined) {
    epochSeconds = Math.floor(options.date.getTime() / 1000);
  } else if (options.epochSeconds !== undefined) {
    epochSeconds = options.epochSeconds;
  } else {
    throw new Error('Must provide either epochSeconds or date');
  }
  
  // Pass to native module with epochSeconds
  return ExpoAlarmKitModule.scheduleAlarm({
    ...options,
    epochSeconds,
  });
}

export interface ScheduleRepeatingAlarmOptions {
  /** Unique identifier for the alarm */
  id: string;
  /** Hour (0-23) for the alarm */
  hour: number;
  /** Minute (0-59) for the alarm */
  minute: number;
  /** Array of weekday numbers: 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday, 7=Saturday */
  weekdays: number[];
  /** Title displayed for the alarm */
  title: string;
  /** Optional custom sound name (must exist in app bundle) */
  soundName?: string;
  /** Whether to launch the app when the alarm stop button is pressed. Defaults to false. */
  launchAppOnDismiss?: boolean;
  /** Custom label for the stop button (default: 'Stop') */
  stopButtonLabel?: string;
  /** Custom label for the snooze button (default: 'Snooze') */
  snoozeButtonLabel?: string;
  /** Hex color for the stop button text (default: '#FFFFFF') */
  stopButtonColor?: string;
  /** Hex color for the snooze button text (default: '#FFFFFF') */
  snoozeButtonColor?: string;
  /** Hex color for the overall alarm tint (default: '#0000FF') */
  tintColor?: string;
  /** Snooze duration in seconds (default: 540 = 9 minutes) */
  snoozeDuration?: number;
}

/**
 * Schedule a weekly repeating alarm.
 * @param options - Alarm configuration options.
 * @returns True if the alarm was scheduled successfully.
 */
export async function scheduleRepeatingAlarm(options: ScheduleRepeatingAlarmOptions): Promise<boolean> {
  return ExpoAlarmKitModule.scheduleRepeatingAlarm(options);
}

/**
 * Cancel a scheduled alarm.
 * This removes the alarm from both AlarmKit and App Group storage.
 * @param id - The alarm ID to cancel.
 * @returns True if the alarm was cancelled successfully.
 */
export async function cancelAlarm(id: string): Promise<boolean> {
  return ExpoAlarmKitModule.cancelAlarm(id);
}

/**
 * Get all currently scheduled alarm IDs.
 * @returns Array of alarm IDs.
 */
export function getAllAlarms(): string[] {
  return ExpoAlarmKitModule.getAllAlarms();
}

export function clearAllAlarms(): void {
  ExpoAlarmKitModule.clearAllAlarms();
}

/**
 * Remove an alarm from App Group storage.
 * Note: This does NOT cancel the native alarm. Use cancelAlarm() to fully cancel an alarm.
 * @param id - The alarm ID to remove from storage.
 */
export function removeAlarm(id: string): void {
  ExpoAlarmKitModule.removeAlarm(id);
}

/**
 * Get the launch payload if the app was opened from an alarm dismissal.
 * The payload contains the alarmId and dismissTime.
 * Note: The payload is cleared after retrieval, so subsequent calls will return null.
 * @returns The launch payload or null if not launched from an alarm.
 */
export function getLaunchPayload(): LaunchPayload | null {
  return ExpoAlarmKitModule.getLaunchPayload();
}

// Default export object for namespace-style usage
const ExpoAlarmKit = {
  configure,
  requestAuthorization,
  generateUUID,
  scheduleAlarm,
  scheduleRepeatingAlarm,
  cancelAlarm,
  getAllAlarms,
  clearAllAlarms,
  removeAlarm,
  getLaunchPayload,
};

export default ExpoAlarmKit;
