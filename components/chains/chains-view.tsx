"use client";

import { useState } from "react";
import { CreateChainDialog } from "@/components/chains/create-chain-dialog";
import { type QuestChainData } from "@/lib/actions/chain";
import { QuestItem, type QuestData } from "@/components/quests/quest-item";
import { type QuestCompletionResponse } from "@/lib/actions/quest";

export function ChainsView({
  chains: initialChains,
  onQuestCompleted,
}: {
  chains: QuestChainData[];
  onQuestCompleted?: (res: QuestCompletionResponse) => void;
}) {
  const [chains, setChains] = useState<QuestChainData[]>(initialChains);
  const [expandedChainId, setExpandedChainId] = useState<string | null>(
    chains[0]?.id ?? null
  );

  const handleChainCreated = (newChain: QuestChainData) => {
    setChains((prev) => [newChain, ...prev]);
    setExpandedChainId(newChain.id);
  };

  const handleChildQuestCompleted = (
    chainId: string,
    res: QuestCompletionResponse
  ) => {
    setChains((prev) =>
      prev.map((c) => {
        if (c.id !== chainId) return c;
        const updatedChapters = c.chapters.map((ch) =>
          ch.id === res.questId ? { ...ch, isCompleted: true } : ch
        );
        const completedCount = updatedChapters.filter((ch) => ch.isCompleted).length;
        const total = updatedChapters.length;
        return {
          ...c,
          completedSteps: completedCount,
          progressPct: Math.round((completedCount / total) * 100),
          isCompleted: completedCount >= total,
          chapters: updatedChapters,
        };
      })
    );
    onQuestCompleted?.(res);
  };

  if (chains.length === 0) {
    return (
      <div className="qd-glass rounded-[2rem] p-5 border border-purple-200/40 bg-gradient-to-br from-white/80 to-purple-50/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ece7ff] text-2xl shadow-sm">
              🔗
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-qd-muted">
                Quest Chains
              </p>
              <h3 className="text-base font-extrabold text-qd-ink">No Active Chains</h3>
              <p className="text-xs text-qd-muted">Embark on a multi-step storyline journey!</p>
            </div>
          </div>
          <CreateChainDialog onChainCreated={handleChainCreated} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-qd-ink">Quest Chains</h3>
          <p className="text-xs text-qd-muted">Multi-chapter progressive storylines</p>
        </div>
        <CreateChainDialog onChainCreated={handleChainCreated} />
      </div>

      <div className="space-y-3">
        {chains.map((chain) => {
          const isExpanded = expandedChainId === chain.id;

          return (
            <div
              key={chain.id}
              className={`qd-glass overflow-hidden rounded-[2rem] border transition-all duration-300 ${
                chain.isCompleted
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-purple-200/60 bg-white/90"
              }`}
            >
              {/* Chain Header */}
              <button
                type="button"
                onClick={() => setExpandedChainId(isExpanded ? null : chain.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm ${
                      chain.isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-[#ece7ff]"
                    }`}
                  >
                    {chain.isCompleted ? "🏆" : "🔗"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wide text-qd-lavender">
                        {chain.completedSteps}/{chain.totalSteps} Chapters
                      </span>
                      {chain.isCompleted && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-black text-emerald-800">
                          Complete!
                        </span>
                      )}
                    </div>
                    <h4 className="truncate text-sm font-extrabold text-qd-ink">
                      {chain.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-black text-qd-ink">{chain.progressPct}%</span>
                  <span className="text-xs text-qd-muted">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Progress bar */}
              <div className="px-4 pb-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      chain.isCompleted ? "bg-emerald-500" : "bg-qd-lavender"
                    }`}
                    style={{ width: `${chain.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Expanded Narrative & Chapter Steps */}
              {isExpanded && (
                <div className="border-t border-purple-100/60 bg-white/40 p-4 space-y-3">
                  {chain.narrative && (
                    <p className="text-xs italic text-qd-muted bg-white/60 p-2.5 rounded-xl border border-white/80">
                      &quot;{chain.narrative}&quot;
                    </p>
                  )}

                  <div className="space-y-2">
                    {chain.chapters.map((ch, idx) => {
                      const isUnlocked = idx === 0 || chain.chapters[idx - 1]?.isCompleted;
                      const formattedQuest: QuestData = {
                        id: ch.id,
                        title: ch.title,
                        description: ch.description,
                        category: ch.category || "Story",
                        difficulty: ch.difficulty,
                        frequency: "ONCE",
                        isCompletedToday: ch.isCompleted,
                      };

                      if (!isUnlocked) {
                        return (
                          <div
                            key={ch.id}
                            className="flex items-center gap-3 rounded-2xl border border-dashed border-qd-muted/30 bg-white/20 p-3 opacity-60"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-qd-muted/20 text-xs text-qd-muted">
                              🔒
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-qd-muted">
                                Chapter {ch.chapterIndex} (Locked)
                              </p>
                              <p className="truncate text-xs font-bold text-qd-muted/80">
                                {ch.title}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={ch.id} className="relative">
                          <div className="absolute -left-1 top-2 text-[10px] font-black text-qd-lavender">
                            {/* Chapter indicator */}
                          </div>
                          <QuestItem
                            quest={formattedQuest}
                            onCompleted={(res) =>
                              handleChildQuestCompleted(chain.id, res)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
