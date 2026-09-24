"use client";

import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Facebook,
  Twitter,
  Mail,
  Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareButtonProps {
  itineraryId?: string;
  title: string;
  destination: string;
  duration: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  itineraryId,
  title,
  destination,
  duration,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [hasNativeShare, setHasNativeShare] = useState(false);

  React.useEffect(() => {
    setShareUrl(
      itineraryId
        ? `${window.location.origin}/itinerary/${itineraryId}`
        : window.location.href
    );
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setHasNativeShare(true);
    }
  }, [itineraryId]);

  const shareText = `Check out my ${duration} trip to ${destination}! 🌍✈️`;

  const copyToClipboard = async () => {
    const urlToCopy =
      shareUrl ||
      (typeof window !== "undefined"
        ? itineraryId
          ? `${window.location.origin}/itinerary/${itineraryId}`
          : window.location.href
        : "");
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      "_blank"
    );
    setShowMenu(false);
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
    setShowMenu(false);
  };

  const shareViaEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`;
    setShowMenu(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        setShowMenu(false);
      } catch (error) {
        console.error("Share failed:", error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
      >
        <Share2 className="w-5 h-5" />
        <span>Share</span>
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden z-[100]"
            >
              <div className="p-2 space-y-1">
                {/* Copy Link */}
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-600/20 rounded-lg transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-white">
                    {copied ? "Copied!" : "Copy Link"}
                  </span>
                </button>

                {/* Facebook */}
                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-600/20 rounded-lg transition-colors text-left"
                >
                  <Facebook className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Share on Facebook</span>
                </button>

                {/* Twitter */}
                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sky-600/20 rounded-lg transition-colors text-left"
                >
                  <Twitter className="w-5 h-5 text-sky-400" />
                  <span className="text-white">Share on Twitter</span>
                </button>

                {/* Email */}
                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600/20 rounded-lg transition-colors text-left"
                >
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Share via Email</span>
                </button>

                {/* Native Share (Mobile) */}
                {hasNativeShare && (
                  <button
                    onClick={shareNative}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-600/20 rounded-lg transition-colors text-left"
                  >
                    <Share2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-white">More Options</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
