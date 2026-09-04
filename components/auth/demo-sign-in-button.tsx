import { demoSignInAction } from "@/lib/actions/auth";

export function DemoSignInButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await demoSignInAction(callbackUrl);
      }}
    >
      <button
        type="submit"
        className="qd-cta flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:opacity-95 active:scale-[0.98]"
      >
        <span>⚡</span>
        <span>Instant Play (Demo Hero)</span>
      </button>
    </form>
  );
}


