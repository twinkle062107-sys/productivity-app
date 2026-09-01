import { BottomNav } from "@/components/layout/bottom-nav";
import Link from "next/link";

export default async function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Link href="/quests" className="text-sm font-bold text-qd-lavender">
        ← Quests
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">Quest {id}</h1>
      <p className="mt-2 text-qd-muted">Detail + completion flow comes after CRUD and the gamification engine.</p>
      <BottomNav active="/quests" />
    </>
  );
}
