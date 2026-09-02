import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import Link from "next/link";

export default async function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const quest = await prisma.quest.findFirst({
    where: {
      id,
      userId: session.user.id,
      archivedAt: null,
    },
  });

  if (!quest) {
    notFound();
  }

  return (
    <>
      <Link href="/quests" className="text-sm font-bold text-qd-lavender">
        ← Quests
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">{quest.title}</h1>
      {quest.description && (
        <p className="mt-2 text-qd-muted">{quest.description}</p>
      )}
      <p className="mt-2 text-xs font-bold text-qd-muted">
        {quest.difficulty} · {quest.frequency}
      </p>
      <BottomNav active="/quests" />
    </>
  );
}
