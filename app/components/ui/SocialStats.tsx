"use client";

import React from "react";
import { Eye, Heart, Copy, Star } from "lucide-react";
import { motion } from "framer-motion";

interface SocialStatsProps {
  views: number;
  likes: number;
  clones: number;
  rating?: number;
  reviewCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
}

export const SocialStats: React.FC<SocialStatsProps> = ({
  views,
  likes,
  clones,
  rating,
  reviewCount,
  isLiked = false,
  onLike,
}) => {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* Views */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 text-gray-400"
      >
        <Eye className="w-5 h-5" />
        <span className="text-sm font-semibold">{formatNumber(views)}</span>
        <span className="text-xs hidden sm:inline">views</span>
      </motion.div>

      {/* Likes */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onLike}
        className={`flex items-center gap-2 transition-colors ${
          isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
        }`}
        disabled={!onLike}
      >
        <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
        <span className="text-sm font-semibold">{formatNumber(likes)}</span>
        <span className="text-xs hidden sm:inline">likes</span>
      </motion.button>

      {/* Clones */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 text-blue-400"
      >
        <Copy className="w-5 h-5" />
        <span className="text-sm font-semibold">{formatNumber(clones)}</span>
        <span className="text-xs hidden sm:inline">cloned</span>
      </motion.div>

      {/* Rating */}
      {rating !== undefined && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 text-yellow-400"
        >
          <Star className="w-5 h-5 fill-current" />
          <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
          {reviewCount !== undefined && (
            <span className="text-xs text-gray-400">({reviewCount})</span>
          )}
        </motion.div>
      )}
    </div>
  );
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}
