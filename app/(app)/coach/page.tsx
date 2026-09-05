import { getWeeklyCoachInsightsAction } from "@/lib/actions/coach";
import { CoachView } from "@/components/coach/coach-view";
import { BottomNav } from "@/components/layout/bottom-nav";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const res = await getWeeklyCoachInsightsAction();

  if (!res.success || !res.data) {
    return (
      <>
        <h1 className="text-2xl font-extrabold text-qd-ink">AI Coach</h1>
        <div className="qd-glass mt-6 rounded-[2rem] p-8 text-center">
          <span className="text-3xl">🧙‍♂️</span>
          <p className="mt-3 text-sm font-bold text-rose-500">
            {res.error ?? "Unable to load your weekly insights."}
          </p>
        </div>
        <BottomNav active="/coach" />
      </>
    );
  }

  return <CoachView insights={res.data} />;
}