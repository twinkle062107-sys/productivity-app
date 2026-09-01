import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh justify-center overflow-hidden bg-qd-canvas">
      <span className="qd-blob -left-16 top-10 h-56 w-56 bg-[#d8d4ff] opacity-80" />
      <span className="qd-blob right-[-3rem] top-40 h-48 w-48 bg-[#ffd1e3] opacity-70" />
      <span className="qd-blob bottom-10 left-10 h-40 w-40 bg-[#c8fff4] opacity-60" />
      <div className="relative z-10 flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-10 sm:px-6">
        {children}
      </div>
    </div>
  );
}

export default PhoneFrame;
