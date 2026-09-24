"use client";

import React, { useState } from "react";
import { Sparkles, Send, Loader2, ChevronUp, ChevronDown, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface RefinementBarProps {
  itineraryId?: string;
  onRefined: (updatedItinerary: any) => void;
}

const QUICK_PROMPTS = [
  "Add cozy coffee shops near each morning stop",
  "Make Day 2 more relaxing and spaced out",
  "Add authentic local street food for lunches",
  "Include a sunset viewpoint for every evening",
];

export function RefinementBar({ itineraryId, onRefined }: RefinementBarProps) {
  const [prompt, setPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSend = async (instructionToSend?: string) => {
    const text = (instructionToSend || prompt).trim();
    if (!text) {
      toast.error("Please enter instructions for the AI");
      return;
    }

    if (!itineraryId) {
      toast.error("Cannot refine unsaved itinerary");
      return;
    }

    setIsRefining(true);
    try {
      const res = await fetch(`/api/trips/${itineraryId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: text }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to refine itinerary");
      }

      onRefined(data.data);
      setPrompt("");
      setIsExpanded(false);
      toast.success("Itinerary refined by Wander.AI!");
    } catch (err: any) {
      console.error("Refine error:", err);
      toast.error(err?.message || "Failed to refine itinerary");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl">
      <div className={`bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl transition-all ${
        isExpanded ? "rounded-3xl p-3 sm:p-4" : "rounded-full p-2 sm:p-2.5"
      }`}>
        {/* Expandable suggestions */}
        {isExpanded && (
          <div className="mb-2.5 pb-3 border-b border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-primary" /> AI Refinement Presets
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  disabled={isRefining}
                  onClick={() => {
                    setPrompt(qp);
                    handleSend(qp);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted/60 hover:bg-primary/15 hover:text-primary border border-border/60 hover:border-primary/30 transition-all text-left cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-10 px-3.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center gap-1.5 transition-colors text-xs font-bold flex-shrink-0 cursor-pointer"
            title="Toggle Quick Suggestions"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Refine</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 opacity-70" />
            )}
          </button>

          <div className="relative flex-1">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI to refine this trip... (e.g. 'Add a scenic river cruise')"
              className="h-10 rounded-full bg-background/80 border-border/70 text-xs sm:text-sm pl-4 pr-3 focus-visible:ring-primary shadow-xs"
              disabled={isRefining}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isRefining || !prompt.trim()}
            className="h-10 px-5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold shadow-md shadow-primary/25 flex-shrink-0 cursor-pointer"
          >
            {isRefining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin sm:mr-1.5" />
                <span className="hidden sm:inline">Refining...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Apply</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
