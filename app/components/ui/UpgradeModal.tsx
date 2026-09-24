"use client";

import React from "react";
import { X, Crown, Zap, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  currentPlan: "FREE" | "PRO" | "PREMIUM";
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  feature = "this feature",
  currentPlan,
}) => {
  const recommendedPlan = currentPlan === "FREE" ? "PRO" : "PREMIUM";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-lg mx-4 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Content */}
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                {recommendedPlan === "PRO" ? (
                  <Zap className="w-8 h-8 text-white" />
                ) : (
                  <Crown className="w-8 h-8 text-white" />
                )}
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-white mb-2">
                Upgrade to {recommendedPlan}
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-6">
                Unlock{" "}
                <span className="text-emerald-400 font-semibold">
                  {feature}
                </span>{" "}
                and more premium features
              </p>

              {/* Current Plan Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 border border-gray-700 mb-6">
                <span className="text-sm text-gray-400">Current plan:</span>
                <span className="text-sm font-semibold text-white">
                  {currentPlan}
                </span>
              </div>

              {/* Features List */}
              <div className="bg-white/5 rounded-2xl p-6 mb-6 text-left">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  What you'll get:
                </h3>
                <ul className="space-y-3">
                  {recommendedPlan === "PRO" ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-sm text-gray-300">
                          Unlimited itineraries
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-sm text-gray-300">
                          Hotel & flight booking
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-sm text-gray-300">
                          Budget tracking & analytics
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-sm text-gray-300">
                          PDF & Calendar export
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-sm text-gray-300">
                          Priority support
                        </span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">✓</span>
                        <span className="text-sm text-gray-300">
                          Everything in Pro
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">✓</span>
                        <span className="text-sm text-gray-300">
                          API access
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">✓</span>
                        <span className="text-sm text-gray-300">
                          White-label itineraries
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">✓</span>
                        <span className="text-sm text-gray-300">
                          Dedicated account manager
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">✓</span>
                        <span className="text-sm text-gray-300">
                          Exclusive travel deals (up to 30% off)
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
                >
                  Maybe Later
                </button>
                <Link
                  href="/pricing"
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
