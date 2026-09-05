import {
  type NotificationPreferences,
  type NotificationPermissionStatus,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_STORAGE_KEY,
} from "./types";
import { soundEngine } from "./sound";

/**
 * Returns stored notification preferences from localStorage or defaults.
 */
export function getStoredNotificationPrefs(): NotificationPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_NOTIFICATION_PREFERENCES.enabled,
      dailyReminderTime:
        typeof parsed.dailyReminderTime === "string" && parsed.dailyReminderTime.includes(":")
          ? parsed.dailyReminderTime
          : DEFAULT_NOTIFICATION_PREFERENCES.dailyReminderTime,
      streakWarning:
        typeof parsed.streakWarning === "boolean"
          ? parsed.streakWarning
          : DEFAULT_NOTIFICATION_PREFERENCES.streakWarning,
      soundEnabled:
        typeof parsed.soundEnabled === "boolean"
          ? parsed.soundEnabled
          : DEFAULT_NOTIFICATION_PREFERENCES.soundEnabled,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Persists notification preferences to localStorage.
 */
export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage quota exceeded or disabled
  }
}

/**
 * Queries the current browser Notification API permission.
 */
export function getBrowserNotificationPermission(): NotificationPermissionStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Prompts user for browser notification permission.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch {
    return "denied";
  }
}

/**
 * Dispatches a native browser notification if enabled and permitted.
 */
export function sendNativeNotification(
  title: string,
  options?: {
    body?: string;
    tag?: string;
    playSound?: boolean;
    soundType?: "reminder" | "victory" | "freeze";
  }
): boolean {
  const prefs = getStoredNotificationPrefs();
  const playSound = options?.playSound ?? prefs.soundEnabled;

  if (playSound) {
    if (options?.soundType === "victory") {
      soundEngine.playVictoryChime();
    } else if (options?.soundType === "freeze") {
      soundEngine.playIceFreezeChime();
    } else {
      soundEngine.playReminderChime();
    }
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted" || !prefs.enabled) {
    return false;
  }

  try {
    new Notification(title, {
      body: options?.body,
      tag: options?.tag ?? "questdaily-notification",
      icon: "/favicon.ico",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure date comparison helper: returns true if the current time matches or is after
 * the designated daily reminder time on today's calendar date, and has not yet triggered today.
 */
export function shouldTriggerDailyReminder(
  lastTriggerDateStr: string | null,
  now: Date,
  reminderTimeStr: string
): boolean {
  const [targetHour, targetMinute] = reminderTimeStr.split(":").map(Number);
  if (isNaN(targetHour) || isNaN(targetMinute)) return false;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if current time is past the target reminder time
  const isTimeOrPast =
    currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

  if (!isTimeOrPast) return false;

  // Check if already triggered today (YYYY-MM-DD)
  const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  if (lastTriggerDateStr === todayDateKey) {
    return false;
  }

  return true;
}

/**
 * Pure check: returns true if current hour is 20:00 (8 PM) or later, the user has an active streak,
 * has not completed any quests today, and has not yet received a streak risk warning today.
 */
export function shouldTriggerStreakWarning(
  streakCount: number,
  completedCountToday: number,
  lastWarnDateStr: string | null,
  now: Date
): boolean {
  if (streakCount <= 0 || completedCountToday > 0) return false;

  // Streak warnings trigger starting from 8:00 PM (20:00)
  if (now.getHours() < 20) return false;

  const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  if (lastWarnDateStr === todayDateKey) {
    return false;
  }

  return true;
}

/**
 * Formats "09:00" to "9:00 AM" or "18:30" to "6:30 PM".
 */
export function formatTimeString(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const hour = parseInt(hStr, 10);
  const min = parseInt(mStr, 10);
  if (isNaN(hour) || isNaN(min)) return timeStr;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMin = String(min).padStart(2, "0");
  return `${displayHour}:${displayMin} ${period}`;
}
