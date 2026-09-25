"use client";

import React, { useState } from "react";
import {
  Vote,
  Trophy,
  Bell,
  CheckCircle2,
  Lock,
  ThumbsUp,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PollCardProps {
  poll: any;
  currentUserId?: string;
  isOwner?: boolean;
  onVoteCast?: (pollId: string, updatedPoll: any) => void;
  onNudgeSent?: (pollTitle: string, nonVoterIds: string[]) => void;
  onApplyWinnerToSlot?: (activityId: string, optionId: string) => void;
}

export function PollCard({
  poll,
  currentUserId,
  isOwner,
  onVoteCast,
  onNudgeSent,
  onApplyWinnerToSlot,
}: PollCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isNudging, setIsNudging] = useState(false);

  const isClosed = poll.status === "closed";
  const winnerOption = poll.options.find((o: any) => o.id === poll.winnerOptionId);

  // Cast vote
  const handleVote = async (optionId: string, val = 1) => {
    if (isClosed) return;
    try {
      setIsVoting(true);
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, value: val }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Vote recorded!");
        onVoteCast?.(poll.id, data.poll);
      }
    } catch {
      toast.error("Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  // Nudge non-voters
  const handleNudge = async () => {
    try {
      setIsNudging(true);
      const res = await fetch(`/api/polls/${poll.id}/nudge`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Reminders sent to collaborators!");
        onNudgeSent?.(poll.title, data.nonVoterIds || []);
      }
    } catch {
      toast.error("Failed to send reminders");
    } finally {
      setIsNudging(false);
    }
  };

  // Close poll
  const handleClosePoll = async () => {
    try {
      const res = await fetch(`/api/polls/${poll.id}/close`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Poll closed! Winning choice locked.");
        onVoteCast?.(poll.id, data.poll);
      }
    } catch {
      toast.error("Failed to close poll");
    }
  };

  // Apply winning choice to itinerary slot
  const handleApplySlot = async () => {
    if (!poll.linkedActivityId || !poll.winnerOptionId) return;
    try {
      const res = await fetch(`/api/polls/${poll.id}/apply-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: poll.linkedActivityId,
          optionId: poll.winnerOptionId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        onApplyWinnerToSlot?.(poll.linkedActivityId, poll.winnerOptionId);
      }
    } catch {
      toast.error("Failed to apply winning choice");
    }
  };

  // Total votes count across options
  const totalVotesCount = poll.options.reduce(
    (acc: number, opt: any) => acc + (opt.votes?.length || 0),
    0
  );

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border transition-all text-xs",
        isClosed
          ? "bg-muted/40 border-muted-foreground/20"
          : "bg-card border-amber-500/20 shadow-sm hover:border-amber-500/40"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
              {poll.category || "Decision"} Poll
            </span>
            {isClosed && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Closed
              </span>
            )}
            {poll.linkedActivity && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                Linked to {poll.linkedActivity.title}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-foreground">{poll.title}</h4>
          {poll.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{poll.description}</p>
          )}
        </div>

        {/* Nudge & Close Actions */}
        <div className="flex items-center gap-1.5">
          {!isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNudge}
              disabled={isNudging}
              className="h-7 text-[11px] px-2 rounded-lg text-amber-700 dark:text-amber-400 border-amber-500/30"
              title="Nudge collaborators who haven't voted"
            >
              <Bell className="w-3 h-3 mr-1" />
              Nudge
            </Button>
          )}
          {isOwner && !isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClosePoll}
              className="h-7 text-[11px] px-2 rounded-lg text-muted-foreground"
            >
              <Lock className="w-3 h-3 mr-1" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Winner Spotlight Banner if decided */}
      {winnerOption && (
        <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                Leading / Winning Option
              </span>
              <span className="text-xs font-bold text-foreground">{winnerOption.title}</span>
            </div>
          </div>

          {poll.linkedActivityId && (
            <Button
              size="sm"
              onClick={handleApplySlot}
              className="h-7 text-[11px] rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Auto-Populate Slot
            </Button>
          )}
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2">
        {poll.options.map((option: any) => {
          const votesCount = option.votes?.length || 0;
          const percentage =
            totalVotesCount > 0 ? Math.round((votesCount / totalVotesCount) * 100) : 0;
          const userVoted = option.votes?.some((v: any) => v.userId === currentUserId);
          const isWinner = option.id === poll.winnerOptionId;

          return (
            <div
              key={option.id}
              className={cn(
                "relative overflow-hidden p-2.5 rounded-xl border transition-all",
                isWinner
                  ? "bg-amber-500/10 border-amber-500/50"
                  : userVoted
                  ? "bg-amber-500/5 border-amber-500/30"
                  : "bg-background border-border/70"
              )}
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-y-0 left-0 bg-amber-500/10 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => handleVote(option.id, 1)}
                    disabled={isClosed || isVoting}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0",
                      userVoted
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "border-border hover:border-amber-500 text-muted-foreground"
                    )}
                  >
                    {poll.voteType === "star" ? (
                      <Star className="w-3 h-3 fill-current" />
                    ) : (
                      <ThumbsUp className="w-3 h-3" />
                    )}
                  </button>
                  <span className="font-semibold text-foreground truncate">
                    {option.title}
                  </span>
                </div>

                {/* Vote stats and user avatars */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Avatars of who voted for this option */}
                  <div className="flex items-center -space-x-1.5 overflow-hidden">
                    {option.votes?.slice(0, 4).map((v: any) => (
                      <img
                        key={v.id}
                        src={
                          v.user?.image ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.userId}`
                        }
                        alt={v.user?.name || "User"}
                        title={v.user?.name}
                        className="w-4 h-4 rounded-full border border-background"
                      />
                    ))}
                  </div>

                  <span className="text-[11px] font-bold text-muted-foreground w-12 text-right">
                    {votesCount} ({percentage}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Total votes: {totalVotesCount}</span>
        {poll.deadline && (
          <span>
            Deadline: {new Date(poll.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}
