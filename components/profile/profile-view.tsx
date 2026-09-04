"use client";

import { useState } from "react";
import { BlobMascot } from "@/components/brand/mascots";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationSettingsDialog } from "@/components/notifications/notification-settings-dialog";
import { type LevelInfo } from "@/lib/gamification";

interface ProfileViewProps {
  user: {
    name: string | null;
    email: string | null;
    currentXp: number;
    diamonds: number;
    streakCount: number;
    streakFreezes: number;
  };
  levelInfo: LevelInfo;
}

export function ProfileView({ user, levelInfo }: ProfileViewProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <NotificationSettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-qd-ink">Hero Profile</h1>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-white/80 border border-purple-200 px-3.5 py-1.5 text-xs font-black text-purple-900 shadow-sm transition hover:bg-white active:scale-95"
          title="Configure notifications and reminder alerts"
        >
          <span>🔔</span> Reminders & Audio
        </button>
      </div>

      <div className="qd-glass mt-5 flex flex-col items-center rounded-[2rem] p-7 text-center">
        <BlobMascot className="h-28 w-28" />
        <p className="mt-4 text-xl font-extrabold text-qd-ink">
          {user.name || "Hero"} · Level {levelInfo.level}
        </p>
        <p className="mt-1 text-sm font-bold text-qd-lavender">
          {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP to Level {levelInfo.level + 1}
        </p>
        {user.email && (
          <p className="mt-1 text-xs font-bold text-qd-muted">{user.email}</p>
        )}

        {/* Stats Grid */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
            <p className="text-xs font-bold text-qd-muted">Total XP</p>
            <p className="mt-1 text-lg font-black text-qd-ink">{user.currentXp}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
            <p className="text-xs font-bold text-qd-muted">Diamonds</p>
            <p className="mt-1 text-lg font-black text-amber-600">{user.diamonds} 💎</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
            <p className="text-xs font-bold text-qd-muted">Streak</p>
            <p className="mt-1 text-lg font-black text-rose-500">{user.streakCount} 🔥</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
            <p className="text-xs font-bold text-qd-muted">Freezes</p>
            <p className="mt-1 text-lg font-black text-cyan-600">{user.streakFreezes ?? 0} / 3 ❄️</p>
          </div>
        </div>

        {/* Quick Settings Action Card */}
        <div className="mt-5 w-full">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/70 p-3.5 text-left transition hover:bg-purple-100/80 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-200 text-lg">
                🔔
              </span>
              <div>
                <p className="text-xs font-black text-qd-ink">Notification & Sound Preferences</p>
                <p className="text-[10px] text-qd-muted">Daily reminders, streak alerts & audio FX</p>
              </div>
            </div>
            <span className="text-xs font-black text-purple-700">Configure →</span>
          </button>
        </div>

        <SignOutButton className="mt-6" />
      </div>
    </>
  );
}
