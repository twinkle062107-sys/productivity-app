"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  LAST_REMINDER_DATE_KEY,
  LAST_STREAK_WARN_DATE_KEY,
} from "@/lib/notifications/types";
import {
  getStoredNotificationPrefs,
  shouldTriggerDailyReminder,
  shouldTriggerStreakWarning,
  sendNativeNotification,
} from "@/lib/notifications/browser";
import { NotificationSettingsDialog } from "./notification-settings-dialog";

interface RemindersContextType {
  openNotificationSettings: () => void;
  prefs: NotificationPreferences;
}

const RemindersContext = createContext<RemindersContextType>({
  openNotificationSettings: () => {},
  prefs: DEFAULT_NOTIFICATION_PREFERENCES,
});

export function useReminders() {
  return useContext(RemindersContext);
}

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    getStoredNotificationPrefs()
  );

  const openNotificationSettings = useCallback(() => {
    setDialogOpen(true);
  }, []);

  // Periodic check function
  const runReminderCheck = useCallback(() => {
    const currentPrefs = getStoredNotificationPrefs();

    if (!currentPrefs.enabled) return;

    const now = new Date();
    const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;

    // 1. Daily focus reminder check
    const lastReminderDate = localStorage.getItem(LAST_REMINDER_DATE_KEY);
    if (
      shouldTriggerDailyReminder(
        lastReminderDate,
        now,
        currentPrefs.dailyReminderTime
      )
    ) {
      const sent = sendNativeNotification("QuestDaily: Time to Conquer! ⚔️", {
        body: "Your daily quests are waiting. Complete one today to keep your streak going!",
        playSound: currentPrefs.soundEnabled,
        soundType: "reminder",
      });

      if (sent) {
        localStorage.setItem(LAST_REMINDER_DATE_KEY, todayDateKey);
      }
    }

    // 2. Streak warning check
    if (currentPrefs.streakWarning) {
      const lastStreakWarnDate = localStorage.getItem(LAST_STREAK_WARN_DATE_KEY);
      // We pass streakCount = 1 as default optimistic check if warning hasn't fired
      if (shouldTriggerStreakWarning(1, 0, lastStreakWarnDate, now)) {
        const sent = sendNativeNotification("QuestDaily: Streak at Risk! 🔥", {
          body: "Don't let your streak break! Complete a quest before midnight to save it.",
          playSound: currentPrefs.soundEnabled,
          soundType: "reminder",
        });

        if (sent) {
          localStorage.setItem(LAST_STREAK_WARN_DATE_KEY, todayDateKey);
        }
      }
    }
  }, []);

  useEffect(() => {
    runReminderCheck();

    // Check every 60 seconds
    const interval = setInterval(runReminderCheck, 60000);

    // Check when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runReminderCheck();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [runReminderCheck]);

  return (
    <RemindersContext.Provider value={{ openNotificationSettings, prefs }}>
      {children}
      <NotificationSettingsDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onPreferencesChanged={(newPrefs) => setPrefs(newPrefs)}
      />
    </RemindersContext.Provider>
  );
}
