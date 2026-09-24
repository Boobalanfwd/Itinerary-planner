"use client";

import React from "react";
import {
  MapPin,
  Calendar,
  DollarSign,
  Heart,
  Eye,
  Copy,
  Star,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getCountryCode } from "@/lib/country-code";
import * as Flags from "country-flag-icons/react/3x2";
import { Button } from "@/components/ui/button";

interface ItineraryCardProps {
  itinerary: {
    id: string;
    title: string;
    destination: string;
    description?: string;
    duration: number;
    budgetAmount?: number;
    currency: string;
    tags: string[];
    coverImage?: string;
    viewCount: number;
    likeCount: number;
    cloneCount: number;
    reviewCount?: number;
    averageRating?: number;
    author: {
      id?: string;
      name: string;
      username?: string;
      image?: string;
    };
    dayCount: number;
  };
  index: number;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({
  itinerary,
  index,
}) => {
  const router = useRouter();
  const [cloning, setCloning] = React.useState(false);

  const handleClick = () => {
    router.push(`/marketplace/${itinerary.id}`);
  };

  const handleClone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCloning(true);
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}/clone`, {
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

  const countryCode = getCountryCode(itinerary.destination);
  const FlagIcon =
    countryCode &&
    (Flags as Record<string, React.ComponentType<{ className?: string }>>)[
      countryCode
    ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className="group bg-card border border-border/80 rounded-3xl overflow-hidden hover:border-primary/50 shadow-soft hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Cover Image & Overlay */}
      <div>
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={
              itinerary.coverImage ||
              `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800`
            }
            alt={itinerary.destination}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
              {FlagIcon && (
                <FlagIcon className="w-4 h-3 rounded-[2px] shadow-sm flex-shrink-0" />
              )}
              <span>{itinerary.destination}</span>
            </span>

            {itinerary.averageRating ? (
              <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-bold flex items-center gap-1 border border-white/10 shadow-md">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {itinerary.averageRating.toFixed(1)}
              </div>
            ) : null}
          </div>

          {/* Destination & Title */}
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <h3 className="text-lg font-bold text-white drop-shadow-md leading-tight line-clamp-1">
              {itinerary.title || `${itinerary.duration} Days Trip`}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Description */}
          {itinerary.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {itinerary.description}
            </p>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 py-1 text-center">
            <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                Duration
              </span>
              <span className="text-xs font-bold font-mono text-foreground flex items-center justify-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-primary" />
                {itinerary.duration}d
              </span>
            </div>

            <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                Stops
              </span>
              <span className="text-xs font-bold font-mono text-foreground flex items-center justify-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-primary" />
                {itinerary.dayCount}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                Budget
              </span>
              <span className="text-xs font-bold font-mono text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
                <DollarSign className="w-3 h-3" />
                {itinerary.budgetAmount != null && itinerary.budgetAmount > 0
                  ? Number(itinerary.budgetAmount).toLocaleString()
                  : "Free"}
              </span>
            </div>
          </div>

          {/* Tags */}
          {itinerary.tags && itinerary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {itinerary.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/40"
                >
                  #{tag}
                </span>
              ))}
              {itinerary.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{itinerary.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="p-4 pt-0 space-y-3">
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {/* Author */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/profile/${itinerary.author.username || itinerary.author.id}`
              );
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src={itinerary.author.image || "/default-avatar.png"}
              alt={itinerary.author.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[100px]">
              {itinerary.author.name}
            </span>
          </button>

          {/* Social Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-1" title="Views">
              <Eye className="w-3 h-3" />
              {formatNumber(itinerary.viewCount)}
            </div>
            <div className="flex items-center gap-1" title="Likes">
              <Heart className="w-3 h-3" />
              {formatNumber(itinerary.likeCount)}
            </div>
            <div className="flex items-center gap-1" title="Clones">
              <Copy className="w-3 h-3" />
              {formatNumber(itinerary.cloneCount)}
            </div>
          </div>
        </div>

        {/* Clone Button */}
        <Button
          onClick={handleClone}
          disabled={cloning}
          size="sm"
          className="w-full rounded-full font-semibold text-xs py-2 gap-2 shadow-sm"
        >
          {cloning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Cloning...
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Clone Itinerary
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

function formatNumber(num: number): string {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}
