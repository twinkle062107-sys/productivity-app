import { PhoneFrame } from "@/components/layout/phone-frame";
import { RemindersProvider } from "@/components/notifications/reminders-provider";
import type { ReactNode } from "react";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <RemindersProvider>
      <PhoneFrame>{children}</PhoneFrame>
    </RemindersProvider>
  );
}

