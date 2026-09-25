"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Vote, Plus, Trash2, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface GroupPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  activities?: any[];
  onPollCreated?: (poll: any) => void;
}

export function GroupPollModal({
  isOpen,
  onClose,
  tripId,
  activities = [],
  onPollCreated,
}: GroupPollModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("activity");
  const [voteType, setVoteType] = useState<"thumbs" | "star" | "ranked">("thumbs");
  const [deadline, setDeadline] = useState("");
  const [linkedActivityId, setLinkedActivityId] = useState("");
  const [options, setOptions] = useState<string[]>([
    "Option 1",
    "Option 2",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length >= 8) {
      toast.error("Maximum 8 options per poll");
      return;
    }
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("A poll must have at least 2 options");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a poll question or title");
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      toast.error("Please enter at least 2 options");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          voteType,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          linkedActivityId: linkedActivityId || undefined,
          options: cleanOptions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Poll created! Collaborators notified.");
        onPollCreated?.(data.poll);
        onClose();
        // Reset form
        setTitle("");
        setDescription("");
        setOptions(["Option 1", "Option 2"]);
      } else {
        toast.error(data.error || "Failed to create poll");
      }
    } catch {
      toast.error("Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 rounded-2xl bg-card border shadow-2xl">
        <div className="p-6 bg-gradient-to-r from-amber-500/10 to-transparent border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create Group Poll
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Let your friends vote on dinners, sights, transport, or hotels.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Poll Question / Decision Title
            </label>
            <Input
              placeholder="e.g. Which sunset cruise should we book on Day 2?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl bg-background text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-xl bg-background border px-3 text-xs text-foreground outline-none"
              >
                <option value="activity">Activity / Sights</option>
                <option value="restaurant">Dinner & Food</option>
                <option value="accommodation">Accommodation</option>
                <option value="transport">Transportation</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Voting Style
              </label>
              <select
                value={voteType}
                onChange={(e) => setVoteType(e.target.value as any)}
                className="w-full h-9 rounded-xl bg-background border px-3 text-xs text-foreground outline-none"
              >
                <option value="thumbs">👍 Thumbs Up / Down</option>
                <option value="star">⭐ 1-5 Star Rating</option>
                <option value="ranked">🥇 Ranked Choice</option>
              </select>
            </div>
          </div>

          {/* Optional Attach to Itinerary Slot */}
          {activities.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Attach to Itinerary Slot (Optional)
              </label>
              <select
                value={linkedActivityId}
                onChange={(e) => setLinkedActivityId(e.target.value)}
                className="w-full h-9 rounded-xl bg-background border px-3 text-xs text-foreground outline-none"
              >
                <option value="">None (General decision)</option>
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.time} — {act.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                When resolved, the winning choice can auto-populate this slot!
              </p>
            </div>
          )}

          {/* Voting Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Choices / Options ({options.length})
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddOption}
                className="h-6 text-xs text-amber-600 hover:text-amber-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Choice
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {idx + 1}.
                  </span>
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="h-9 rounded-xl text-xs bg-background flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(idx)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
            >
              {isSubmitting ? "Creating..." : "Launch Group Poll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
