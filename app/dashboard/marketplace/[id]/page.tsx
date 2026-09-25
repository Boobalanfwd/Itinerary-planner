"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Calendar, MapPin, Copy, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { SocialStats } from "@/app/components/ui/SocialStats";
import { ShareButton } from "@/app/components/ui/ShareButton";
import { ReviewSection } from "@/app/components/ui/ReviewSection";

import { Button } from "@/components/ui/button";
import { getCountryCode } from "@/lib/country-code";
import * as Flags from "country-flag-icons/react/3x2";

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetchItinerary();
  }, [params.id]);

  const fetchItinerary = async () => {
    try {
      const response = await fetch(`/api/marketplace/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setItinerary(data.itinerary);
      } else {
        setError(data.error || "Failed to load itinerary");
      }
    } catch (err) {
      setError("Failed to load itinerary");
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async () => {
    setCloning(true);
    try {
      const response = await fetch(`/api/itineraries/${params.id}/clone`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        router.push(`/itinerary/${result.clonedId}`);
      }
    } catch (error) {
      console.error("Clone error:", error);
    } finally {
      setCloning(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/itineraries/${params.id}/like`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        setItinerary((prev: any) => ({
          ...prev,
          isLiked: result.liked,
          likeCount: prev.likeCount + (result.liked ? 1 : -1),
        }));
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-mono text-muted-foreground">Loading itinerary details...</span>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            {error || "Itinerary not found"}
          </h2>
          <Button
            variant="outline"
            onClick={() => router.push("/marketplace")}
            className="rounded-full text-xs font-semibold"
          >
            ← Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const countryCode = getCountryCode(itinerary.destination);
  const FlagIcon =
    countryCode &&
    (Flags as Record<string, React.ComponentType<{ className?: string }>>)[
      countryCode
    ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Hero Cover Header */}
      <div className="relative h-[45vh] sm:h-[50vh] w-full overflow-hidden bg-muted">
        <img
          src={
            itinerary.coverImage ||
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800"
          }
          alt={itinerary.destination}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />

        <div className="absolute top-24 left-4 sm:left-8 z-30">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/marketplace")}
            className="rounded-full bg-card/80 backdrop-blur-md border-border/80 shadow-md gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Marketplace
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
              {FlagIcon && (
                <FlagIcon className="w-4 h-3 rounded-[2px] shadow-sm flex-shrink-0" />
              )}
              <span>{itinerary.destination}</span>
            </span>

            {itinerary.tags?.map((tag: string) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary-foreground text-xs font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-md mb-3">
            {itinerary.title || `${itinerary.destination} Adventure`}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/profile/${itinerary.user?.username || itinerary.user?.id}`
                )
              }
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <img
                src={itinerary.user?.image || "/default-avatar.png"}
                alt={itinerary.user?.name || "Author"}
                className="w-9 h-9 rounded-full border-2 border-white object-cover"
              />
              <div className="text-left">
                <p className="text-white font-bold text-sm leading-tight">
                  {itinerary.user?.name || "Traveler"}
                </p>
                <p className="text-white/80 text-xs font-mono">
                  @{itinerary.user?.username || "traveler"}
                </p>
              </div>
            </button>

            <SocialStats
              views={itinerary.viewCount}
              likes={itinerary.likeCount}
              clones={itinerary.cloneCount}
              rating={itinerary.averageRating}
              reviewCount={itinerary.reviewCount}
              isLiked={itinerary.isLiked}
              onLike={handleLike}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {itinerary.description && (
          <div className="p-6 sm:p-7 rounded-3xl bg-card/85 backdrop-blur-sm border border-border/80 shadow-soft space-y-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-foreground">
              About This Itinerary
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {itinerary.description}
            </p>
          </div>
        )}

        {/* Days & Schedule */}
        <div className="space-y-8">
          <h2 className="text-xl font-bold text-foreground">Daily Schedule</h2>
          {itinerary.days?.map((day: any) => (
            <div key={day.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-center font-bold shadow-sm">
                  <span className="text-[9px] uppercase tracking-wider leading-none">Day</span>
                  <span className="text-sm leading-tight">{day.dayNumber}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{day.title}</h3>
                  {day.date && (
                    <p className="text-xs text-muted-foreground font-mono">{day.date}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pl-5 border-l-2 border-primary/30">
                {day.activities?.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="bg-card/85 border border-border/80 rounded-2xl p-4 shadow-soft space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-primary font-mono font-semibold">
                      <span>{activity.time || "Flexible time"}</span>
                      {activity.cost != null && (
                        <span className="text-emerald-500 font-bold">
                          ${activity.cost}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {activity.title}
                    </h4>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activity.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Reviews Section */}
        <div className="pt-4 border-t border-border/60">
          <ReviewSection
            itineraryId={itinerary.id}
            averageRating={itinerary.averageRating}
            reviewCount={itinerary.reviewCount}
          />
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 p-2 rounded-full bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl">
        <ShareButton
          title={`${itinerary.title || itinerary.destination}`}
          destination={itinerary.destination}
          duration={`${itinerary.duration} days`}
        />
        <Button
          onClick={handleClone}
          disabled={cloning}
          className="rounded-full px-6 py-2.5 font-semibold text-xs gap-2 shadow-md"
        >
          {cloning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Cloning...
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Clone This Trip
            </>
          )}
        </Button>
      </div>

    </div>
  );
}
