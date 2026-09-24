"use client";

import React, { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { User, LogOut, Crown, Zap, Settings, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface UserProfileDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  subscriptionTier: "FREE" | "PRO" | "PREMIUM";
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  user,
  subscriptionTier,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTierBadge = () => {
    switch (subscriptionTier) {
      case "PREMIUM":
        return {
          icon: <Crown className="w-3 h-3" />,
          label: "Premium",
          gradient: "from-purple-500 to-pink-600",
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
        };
      case "PRO":
        return {
          icon: <Zap className="w-3 h-3" />,
          label: "Pro",
          gradient: "from-emerald-500 to-cyan-600",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
        };
      default:
        return {
          icon: <User className="w-3 h-3" />,
          label: "Free",
          gradient: "from-gray-500 to-gray-600",
          bg: "bg-gray-500/10",
          border: "border-gray-500/30",
        };
    }
  };

  const tierBadge = getTierBadge();
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 pr-3 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 hover:border-white/20"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {/* Tier indicator dot */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-r ${tierBadge.gradient} border-2 border-black`}
          />
        </div>

        {/* Name (hidden on mobile) */}
        <span className="hidden md:block text-sm font-medium text-white">
          {user.name || "User"}
        </span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            {/* User Info Section */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-start gap-3 mb-3">
                {/* Large Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {user.name || "User"}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Subscription Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierBadge.bg} border ${tierBadge.border}`}
              >
                <div
                  className={`bg-gradient-to-r ${tierBadge.gradient} bg-clip-text text-transparent`}
                >
                  {tierBadge.icon}
                </div>
                <span
                  className={`text-xs font-semibold bg-gradient-to-r ${tierBadge.gradient} bg-clip-text text-transparent`}
                >
                  {tierBadge.label} Plan
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Subscription
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>

            {/* Logout Button */}
            <div className="p-2 border-t border-white/10">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
