export type NotificationPermissionStatus =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export interface NotificationPreferences {
  enabled: boolean;
  dailyReminderTime: string; // "HH:mm" (e.g. "09:00", "18:00", "20:00")
  streakWarning: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  dailyReminderTime: "09:00",
  streakWarning: true,
  soundEnabled: true,
};

export const NOTIFICATION_STORAGE_KEY = "questdaily_notification_preferences";
export const LAST_REMINDER_DATE_KEY = "questdaily_last_reminder_date";
export const LAST_STREAK_WARN_DATE_KEY = "questdaily_last_streak_warn_date";
