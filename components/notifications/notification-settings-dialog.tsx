"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  type NotificationPreferences,
  type NotificationPermissionStatus,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/lib/notifications/types";
import {
  getStoredNotificationPrefs,
  saveNotificationPrefs,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  sendNativeNotification,
} from "@/lib/notifications/browser";

interface NotificationSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChanged?: (prefs: NotificationPreferences) => void;
}

const PRESET_TIMES = [
  { time: "09:00", label: "9:00 AM", sub: "Morning Focus" },
  { time: "12:00", label: "12:00 PM", sub: "Midday Boost" },
  { time: "18:00", label: "6:00 PM", sub: "Evening Wrap" },
  { time: "20:00", label: "8:00 PM", sub: "Streak Saver" },
];

export function NotificationSettingsDialog({
  isOpen,
  onClose,
  onPreferencesChanged,
}: NotificationSettingsDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionStatus>("default");
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPrefs(getStoredNotificationPrefs());
    setPermission(getBrowserNotificationPermission());
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleToggleEnabled = async () => {
    let nextEnabled = !prefs.enabled;

    // If enabling and permission not granted yet, ask for permission
    if (nextEnabled && permission !== "granted") {
      const newPerm = await requestBrowserNotificationPermission();
      setPermission(newPerm);
      if (newPerm !== "granted") {
        nextEnabled = false;
      }
    }

    const updated = { ...prefs, enabled: nextEnabled };
    setPrefs(updated);
    saveNotificationPrefs(updated);
    onPreferencesChanged?.(updated);
  };

  const handleRequestPermission = async () => {
    const newPerm = await requestBrowserNotificationPermission();
    setPermission(newPerm);
    if (newPerm === "granted") {
      const updated = { ...prefs, enabled: true };
      setPrefs(updated);
      saveNotificationPrefs(updated);
      onPreferencesChanged?.(updated);
    }
  };

  const handleUpdate = (partial: Partial<NotificationPreferences>) => {
    const updated = { ...prefs, ...partial };
    setPrefs(updated);
    saveNotificationPrefs(updated);
    onPreferencesChanged?.(updated);
  };

  const handleTestNotification = () => {
    setTestSent(true);
    sendNativeNotification("QuestDaily: Ready for Battle! ⚔️", {
      body: "Your notifications and sound effects are configured and working perfectly!",
      playSound: prefs.soundEnabled,
      soundType: "victory",
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border-2 border-purple-200/70 bg-white p-6 shadow-2xl">
        {/* Subtle glow accents */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-purple-300/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-xl shadow-sm">
                🔔
              </span>
              <div>
                <h2 id="notification-settings-title" className="text-lg font-black text-qd-ink">
                  Reminders & Alerts
                </h2>
                <p className="text-[11px] font-bold text-qd-muted">
                  Stay consistent and keep streaks alive
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Browser Permission Banner */}
          <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-qd-ink">Browser Permission</p>
                <p className="text-[10px] text-qd-muted mt-0.5">
                  {permission === "granted"
                    ? "Notifications allowed in this browser ✓"
                    : permission === "denied"
                    ? "Blocked in browser permissions"
                    : permission === "unsupported"
                    ? "Not supported on this device"
                    : "Permission needed for push alerts"}
                </p>
              </div>
              {permission === "granted" ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800">
                  Allowed ✓
                </span>
              ) : permission === "denied" ? (
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-800">
                  Blocked 🔒
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="rounded-full bg-qd-lavender px-3 py-1 text-[10px] font-black text-white shadow-sm transition hover:opacity-90 active:scale-95"
                >
                  Enable 🔔
                </button>
              )}
            </div>
          </div>

          {/* Settings List */}
          <div className="mt-4 space-y-3.5">
            {/* Master Toggle */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
              <div>
                <p className="text-xs font-black text-qd-ink">Daily Reminders</p>
                <p className="text-[10px] text-qd-muted">Alert for uncompleted quests</p>
              </div>
              <button
                type="button"
                onClick={handleToggleEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs.enabled ? "bg-qd-lavender" : "bg-slate-300"
                }`}
                role="switch"
                aria-checked={prefs.enabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Reminder Time Selector */}
            {prefs.enabled && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 animate-in fade-in duration-200">
                <p className="text-xs font-black text-qd-ink">Daily Reminder Time</p>
                <p className="text-[10px] text-qd-muted mb-2">When should we nudge you?</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_TIMES.map((preset) => {
                    const isSelected = prefs.dailyReminderTime === preset.time;
                    return (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => handleUpdate({ dailyReminderTime: preset.time })}
                        className={`rounded-xl p-2 text-left transition ${
                          isSelected
                            ? "bg-qd-lavender text-white shadow-sm ring-2 ring-qd-lavender/30"
                            : "bg-white text-qd-ink hover:bg-slate-100"
                        }`}
                      >
                        <p className="text-xs font-black">{preset.label}</p>
                        <p
                          className={`text-[9px] ${
                            isSelected ? "text-purple-100" : "text-qd-muted"
                          }`}
                        >
                          {preset.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Streak Warning */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
              <div>
                <p className="text-xs font-black text-qd-ink">Streak Danger Warning 🔥</p>
                <p className="text-[10px] text-qd-muted">Alert at 8 PM if streak is at risk</p>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ streakWarning: !prefs.streakWarning })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs.streakWarning ? "bg-amber-500" : "bg-slate-300"
                }`}
                role="switch"
                aria-checked={prefs.streakWarning}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.streakWarning ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Sound FX */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
              <div>
                <p className="text-xs font-black text-qd-ink">Gamified Sound Effects 🎵</p>
                <p className="text-[10px] text-qd-muted">Audio chimes for quests & alerts</p>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ soundEnabled: !prefs.soundEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs.soundEnabled ? "bg-teal-600" : "bg-slate-300"
                }`}
                role="switch"
                aria-checked={prefs.soundEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.soundEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Test Notification & Actions */}
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full rounded-2xl border border-purple-200 bg-purple-50 py-2.5 text-xs font-black text-purple-900 transition hover:bg-purple-100 active:scale-95"
            >
              {testSent ? "Test Alert Sent! 🚀" : "Send Test Notification & Sound 🚀"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-qd-ink py-2.5 text-xs font-black text-white shadow-md transition active:scale-95"
            >
              Done ✓
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
