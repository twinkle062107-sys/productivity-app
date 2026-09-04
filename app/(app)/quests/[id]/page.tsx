import { notFound } from "next/navigation";
import { getQuestDetailAction } from "@/lib/actions/quest";
import { QuestDetailView } from "@/components/quests/quest-detail-view";

export const dynamic = "force-dynamic";

export default async function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getQuestDetailAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <QuestDetailView initialQuest={res.data} />;
}
