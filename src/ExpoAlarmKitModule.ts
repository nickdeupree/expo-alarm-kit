import { requireNativeModule } from 'expo-modules-core';

export type AuthorizationStatus = 'authorized' | 'denied' | 'notDetermined';

export interface LaunchPayload {
  alarmId: string;
  payload: string | null;
}

export interface ScheduleAlarmOptions {
  id: string;
  epochSeconds: number;
  title: string;
  soundName?: string | null;
  launchAppOnDismiss?: boolean;
  doSnoozeIntent?: boolean;
  launchAppOnSnooze?: boolean;
  dismissPayload?: string | null;
  snoozePayload?: string | null;
  stopButtonLabel?: string | null;
  snoozeButtonLabel?: string | null;
  stopButtonColor?: string | null;
  snoozeButtonColor?: string | null;
  tintColor?: string | null;
  snoozeDuration?: number | null;
}

export interface ScheduleRepeatingAlarmOptions {
  id: string;
  hour: number;
  minute: number;
  weekdays: number[];
  title: string;
  soundName?: string | null;
  launchAppOnDismiss?: boolean;
  doSnoozeIntent?: boolean;
  launchAppOnSnooze?: boolean;
  dismissPayload?: string | null;
  snoozePayload?: string | null;
  stopButtonLabel?: string | null;
  snoozeButtonLabel?: string | null;
  stopButtonColor?: string | null;
  snoozeButtonColor?: string | null;
  tintColor?: string | null;
  snoozeDuration?: number | null;
}

export interface ScheduleTimerOptions {
  id: string;
  duration: number;
  title: string;
  soundName?: string | null;
  tintColor?: string | null;
  pauseButtonLabel?: string | null;
  pauseButtonColor?: string | null;
  resumeButtonLabel?: string | null;
  resumeButtonColor?: string | null;
  launchAppOnDismiss?: boolean;
  dismissPayload?: string | null;
}

interface ExpoAlarmKitModuleType {
  /**
   * Configure the module with an App Group identifier.
   * This MUST be called before any other methods.
   * @param appGroupIdentifier - The App Group identifier (e.g., "group.com.yourapp.alarms")
   * @returns True if configuration succeeded.
   */
  configure(appGroupIdentifier: string): boolean;

  /**
   * Request authorization to schedule alarms.
   * @returns The current authorization status after the request.
   */
  requestAuthorization(): Promise<AuthorizationStatus>;

  /**
   * Generate a valid UUID string for use as an alarm ID.
   * @returns A new UUID string.
   */
  generateUUID(): string;

  /**
   * Schedule a one-time alarm.
   * @param options - Alarm configuration options.
   * @returns True if scheduling succeeded.
   */
  scheduleAlarm(options: ScheduleAlarmOptions): Promise<boolean>;

  /**
   * Schedule a weekly repeating alarm.
   * @param options - Alarm configuration options.
   * @returns True if scheduling succeeded.
   */
  scheduleRepeatingAlarm(options: ScheduleRepeatingAlarmOptions): Promise<boolean>;

  /**
   * Schedule a timer-based alarm.
   * @param options - Timer alarm configuration options. Duration must be at least 60 seconds.
   * @returns True if scheduling succeeded.
   */
  scheduleTimerAlarm(options: ScheduleTimerOptions): Promise<boolean>;

  /**
   * Cancel a scheduled alarm.
   * @param id - The alarm ID to cancel.
   * @returns True if cancellation succeeded.
   */
  cancelAlarm(id: string): Promise<boolean>;

  /**
   * Get all currently scheduled alarm IDs.
   * @returns Array of alarm IDs stored in UserDefaults.
   */
  getAllAlarms(): string[];

  /**
   * Remove an alarm from UserDefaults (does not cancel the native alarm).
   * @param id - The alarm ID to remove.
   */
  removeAlarm(id: string): void;

  /**
   * Clear all alarms from UserDefaults (does not cancel the native alarms).
   * This resets the list of alarm IDs stored in UserDefaults.
   */
  clearAllAlarms(): void;

  /**
   * Get the launch payload if the app was opened from an alarm dismiss/snooze intent.
   * The payload is cleared after retrieval.
   * @returns The launch payload or null if not launched from an alarm.
   */
  getLaunchPayload(): LaunchPayload | null;
}

export default requireNativeModule<ExpoAlarmKitModuleType>('ExpoAlarmKit');
