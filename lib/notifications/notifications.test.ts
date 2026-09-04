import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  shouldTriggerDailyReminder,
  shouldTriggerStreakWarning,
  formatTimeString,
  getStoredNotificationPrefs,
  saveNotificationPrefs,
} from "./browser";
import { DEFAULT_NOTIFICATION_PREFERENCES, NOTIFICATION_STORAGE_KEY } from "./types";

describe("Notification Utilities & Triggers", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    vi.stubGlobal("window", {
      localStorage: storageMock,
    });
    vi.stubGlobal("localStorage", storageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Time Formatting", () => {
    it("formats morning hours correctly", () => {
      expect(formatTimeString("09:00")).toBe("9:00 AM");
      expect(formatTimeString("00:15")).toBe("12:15 AM");
      expect(formatTimeString("11:45")).toBe("11:45 AM");
    });

    it("formats afternoon and evening hours correctly", () => {
      expect(formatTimeString("12:00")).toBe("12:00 PM");
      expect(formatTimeString("18:30")).toBe("6:30 PM");
      expect(formatTimeString("20:00")).toBe("8:00 PM");
      expect(formatTimeString("23:59")).toBe("11:59 PM");
    });

    it("returns raw string if invalid format", () => {
      expect(formatTimeString("invalid")).toBe("invalid");
    });
  });

  describe("Daily Reminder Trigger Evaluation", () => {
    it("triggers when current time is past reminder time on an untriggered day", () => {
      const now = new Date("2026-09-04T10:30:00");
      const shouldTrigger = shouldTriggerDailyReminder(null, now, "09:00");
      expect(shouldTrigger).toBe(true);
    });

    it("triggers when current time is exact minute of reminder time", () => {
      const now = new Date("2026-09-04T09:00:00");
      const shouldTrigger = shouldTriggerDailyReminder(null, now, "09:00");
      expect(shouldTrigger).toBe(true);
    });

    it("does not trigger before designated reminder time", () => {
      const now = new Date("2026-09-04T08:45:00");
      const shouldTrigger = shouldTriggerDailyReminder(null, now, "09:00");
      expect(shouldTrigger).toBe(false);
    });

    it("does not trigger again if already triggered today", () => {
      const now = new Date("2026-09-04T14:00:00");
      const lastTriggerDate = "2026-09-04";
      const shouldTrigger = shouldTriggerDailyReminder(lastTriggerDate, now, "09:00");
      expect(shouldTrigger).toBe(false);
    });

    it("triggers again on a new day even if triggered yesterday", () => {
      const now = new Date("2026-09-05T09:15:00");
      const lastTriggerDate = "2026-09-04";
      const shouldTrigger = shouldTriggerDailyReminder(lastTriggerDate, now, "09:00");
      expect(shouldTrigger).toBe(true);
    });
  });

  describe("Streak Danger Alert Trigger Evaluation", () => {
    it("triggers after 8 PM (20:00) when streak > 0 and 0 quests completed today", () => {
      const now = new Date("2026-09-04T20:15:00");
      const shouldWarn = shouldTriggerStreakWarning(5, 0, null, now);
      expect(shouldWarn).toBe(true);
    });

    it("does not trigger before 8 PM even if no quests completed", () => {
      const now = new Date("2026-09-04T17:30:00");
      const shouldWarn = shouldTriggerStreakWarning(5, 0, null, now);
      expect(shouldWarn).toBe(false);
    });

    it("does not trigger if user already completed at least 1 quest today", () => {
      const now = new Date("2026-09-04T21:00:00");
      const shouldWarn = shouldTriggerStreakWarning(5, 1, null, now);
      expect(shouldWarn).toBe(false);
    });

    it("does not trigger if user has 0 streak (no streak to lose)", () => {
      const now = new Date("2026-09-04T21:00:00");
      const shouldWarn = shouldTriggerStreakWarning(0, 0, null, now);
      expect(shouldWarn).toBe(false);
    });

    it("does not trigger repeatedly on the same day", () => {
      const now = new Date("2026-09-04T21:30:00");
      const lastWarnDate = "2026-09-04";
      const shouldWarn = shouldTriggerStreakWarning(5, 0, lastWarnDate, now);
      expect(shouldWarn).toBe(false);
    });
  });

  describe("Storage Preferences Handling", () => {
    it("returns default preferences when storage is empty", () => {
      const prefs = getStoredNotificationPrefs();
      expect(prefs).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it("merges stored preferences and validates values", () => {
      mockStorage[NOTIFICATION_STORAGE_KEY] = JSON.stringify({
        enabled: true,
        dailyReminderTime: "18:00",
        streakWarning: false,
        soundEnabled: true,
      });

      const prefs = getStoredNotificationPrefs();
      expect(prefs.enabled).toBe(true);
      expect(prefs.dailyReminderTime).toBe("18:00");
      expect(prefs.streakWarning).toBe(false);
      expect(prefs.soundEnabled).toBe(true);
    });

    it("saves preferences to localStorage properly", () => {
      const customPrefs = {
        enabled: true,
        dailyReminderTime: "20:00",
        streakWarning: true,
        soundEnabled: false,
      };
      saveNotificationPrefs(customPrefs);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(customPrefs)
      );
      expect(mockStorage[NOTIFICATION_STORAGE_KEY]).toBe(JSON.stringify(customPrefs));
    });
  });
});
