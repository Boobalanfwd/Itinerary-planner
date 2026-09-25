"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Luggage,
  Sparkles,
  CheckCircle2,
  Circle,
  Copy,
  RefreshCw,
  Lightbulb,
  Check,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { PackingList, PackingCategory, PackingItem } from "@/schemas/packingList";

interface PackingListPanelProps {
  itineraryId: string;
  destination: string;
  initialPackingList?: PackingList | null;
  readOnly?: boolean;
}

export function PackingListPanel({
  itineraryId,
  destination,
  initialPackingList = null,
  readOnly = false,
}: PackingListPanelProps) {
  const [packingList, setPackingList] = useState<PackingList | null>(initialPackingList);
  const [isLoading, setIsLoading] = useState(!initialPackingList);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "essential" | "unpacked">("all");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const storageKey = `wander_packing_checked_${itineraryId}`;

  // Fetch cached packing list on mount if not provided in props
  useEffect(() => {
    if (!initialPackingList) {
      let isMounted = true;
      setIsLoading(true);
      fetch(`/api/itineraries/${itineraryId}/packing-list`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            if (data.success && data.packingList) {
              setPackingList(data.packingList);
            }
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load packing list:", err);
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setPackingList(initialPackingList);
      setIsLoading(false);
    }
  }, [itineraryId, initialPackingList]);

  // Load checked items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCheckedIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.warn("Could not read packing state from localStorage", e);
    }
  }, [storageKey]);

  // Set all categories open by default when packingList arrives
  useEffect(() => {
    if (packingList?.categories) {
      setExpandedCategories(packingList.categories.map((c, i) => `category-${i}`));
    }
  }, [packingList]);

  // Persist checked items to localStorage
  const toggleItem = (itemId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn("Could not save packing state", e);
      }
      return next;
    });
  };

  const handleGenerate = async (force: boolean = false) => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}/packing-list?force=${force}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate packing list");
      }
      setPackingList(data.packingList);
      toast.success(
        force ? "Packing list refreshed!" : "AI Packing list created!"
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create packing list");
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate statistics
  const { totalItems, packedCount, essentialCount, essentialPackedCount } = useMemo(() => {
    if (!packingList?.categories) {
      return { totalItems: 0, packedCount: 0, essentialCount: 0, essentialPackedCount: 0 };
    }
    let total = 0;
    let packed = 0;
    let essential = 0;
    let essentialPacked = 0;

    for (const cat of packingList.categories) {
      for (const item of cat.items) {
        total++;
        const isChecked = checkedIds.has(item.id || item.item);
        if (isChecked) packed++;
        if (item.essential) {
          essential++;
          if (isChecked) essentialPacked++;
        }
      }
    }

    return {
      totalItems: total,
      packedCount: packed,
      essentialCount: essential,
      essentialPackedCount: essentialPacked,
    };
  }, [packingList, checkedIds]);

  const progressPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;

  // Check / Uncheck all
  const handleToggleAll = (check: boolean) => {
    if (!packingList) return;
    const next = new Set<string>();
    if (check) {
      for (const cat of packingList.categories) {
        for (const item of cat.items) {
          next.add(item.id || item.item);
        }
      }
    }
    setCheckedIds(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
    } catch (e) {
      console.warn("Could not save packing state", e);
    }
    toast.info(check ? "All items checked" : "All items cleared");
  };

  // Copy to clipboard formatted
  const handleCopyMarkdown = () => {
    if (!packingList) return;
    let md = `# Packing Checklist for ${destination}\n\n`;
    for (const cat of packingList.categories) {
      md += `### ${cat.emoji} ${cat.name}\n`;
      for (const item of cat.items) {
        const isChecked = checkedIds.has(item.id || item.item);
        const checkMark = isChecked ? "[x]" : "[ ]";
        const star = item.essential ? " ⭐ (Essential)" : "";
        const note = item.notes ? ` — _${item.notes}_` : "";
        md += `- ${checkMark} ${item.item}${star}${note}\n`;
      }
      md += "\n";
    }
    if (packingList.tips && packingList.tips.length > 0) {
      md += `### 💡 Pro Packing Tips\n`;
      for (const tip of packingList.tips) {
        md += `- ${tip}\n`;
      }
    }
    navigator.clipboard.writeText(md);
    toast.success("Packing checklist copied to clipboard!");
  };

  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-soft p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
            <Luggage className="w-5 h-5 animate-bounce" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Loading packing checklist...
          </p>
        </div>
      </Card>
    );
  }

  // Empty state: No packing list generated yet
  if (!packingList) {
    return (
      <Card className="rounded-3xl border border-dashed border-border/80 bg-card/60 backdrop-blur-sm shadow-soft overflow-hidden">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Luggage className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl font-bold font-serif text-foreground">
              Smart Packing Checklist
            </h3>
            <p className="text-sm text-muted-foreground">
              Never forget essentials again. Generate an AI-curated checklist specifically tailored to {destination}&apos;s weather, trip duration, and planned activities.
            </p>
          </div>
          {!readOnly && (
            <Button
              onClick={() => handleGenerate(false)}
              disabled={isGenerating}
              className="rounded-full px-6 h-11 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing weather &amp; activities...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Smart Packing List
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Main Header Card ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-soft overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0">
                <Luggage className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold font-serif flex items-center gap-2">
                  Packing Checklist
                  <Badge variant="outline" className="text-xs font-sans font-medium rounded-full bg-muted/40">
                    {totalItems} items
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Tailored for {destination} • Stored automatically
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
                className="h-8 text-xs rounded-full gap-1.5 border-border/70 hover:bg-accent cursor-pointer"
                title="Copy markdown checklist"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                Copy
              </Button>
              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  className="h-8 text-xs rounded-full gap-1.5 border-border/70 hover:bg-accent cursor-pointer"
                  title="Regenerate packing list"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-muted-foreground ${
                      isGenerating ? "animate-spin text-primary" : ""
                    }`}
                  />
                  Regenerate
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                {packedCount} of {totalItems} items packed ({progressPercent}%)
              </span>
              <span className="text-muted-foreground">
                {essentialPackedCount} of {essentialCount} essentials packed
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 rounded-full bg-muted" />
          </div>

          {/* Filter Pills & Quick Actions */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-border/60 flex-wrap">
            <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/40 text-xs">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filter === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({totalItems})
              </button>
              <button
                type="button"
                onClick={() => setFilter("essential")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filter === "essential"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Essentials ({essentialCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unpacked")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filter === "unpacked"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Unpacked ({totalItems - packedCount})
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleToggleAll(true)}
                className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Check All
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                onClick={() => handleToggleAll(false)}
                className="text-muted-foreground hover:text-destructive transition-colors font-medium flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Category Accordions ─────────────────────────────────────────── */}
      <Accordion
        type="multiple"
        value={expandedCategories}
        onValueChange={setExpandedCategories}
        className="space-y-3"
      >
        {packingList.categories.map((category, catIndex) => {
          const value = `category-${catIndex}`;

          // Filter items based on active filter
          const displayedItems = category.items.filter((item) => {
            const isChecked = checkedIds.has(item.id || item.item);
            if (filter === "essential") return item.essential;
            if (filter === "unpacked") return !isChecked;
            return true;
          });

          const catPacked = category.items.filter((item) =>
            checkedIds.has(item.id || item.item)
          ).length;

          const isComplete =
            category.items.length > 0 && catPacked === category.items.length;

          if (displayedItems.length === 0 && filter !== "all") {
            return null;
          }

          return (
            <AccordionItem
              key={value}
              value={value}
              className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-5 overflow-hidden transition-all shadow-xs"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full pr-3 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{category.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {category.name}
                        {isComplete && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-2 rounded-full">
                            Complete
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {catPacked} of {category.items.length} packed
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-1 pb-4">
                <div className="space-y-1.5 divide-y divide-border/40">
                  {displayedItems.map((item, itemIndex) => {
                    const itemId = item.id || item.item;
                    const isChecked = checkedIds.has(itemId);

                    return (
                      <div
                        key={itemId}
                        onClick={() => toggleItem(itemId)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer select-none group ${
                          isChecked
                            ? "bg-muted/30 opacity-70"
                            : "hover:bg-accent/40"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 text-primary">
                          {isChecked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-medium ${
                                isChecked
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {item.item}
                            </span>
                            {item.essential && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 rounded-md border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium"
                              >
                                Essential
                              </Badge>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* ── Destination Pro Tips Box ───────────────────────────────────── */}
      {packingList.tips && packingList.tips.length > 0 && (
        <Card className="rounded-2xl border border-teal-500/30 bg-teal-500/5 backdrop-blur-md shadow-xs overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              Pro Tips for {destination}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {packingList.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
