"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  Receipt,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/app/hooks/useSubscription";

export default function BillingPage() {
  const { data: session } = useSession();
  const { subscription, tier } = useSubscription();

  const isPro = tier === "PRO" || tier === "PREMIUM";

  const invoices = [
    {
      id: "INV-2026-001",
      date: "September 15, 2026",
      amount: "$9.99",
      plan: "Wander.AI Pro (Monthly)",
      status: "Paid",
    },
    {
      id: "INV-2026-002",
      date: "August 15, 2026",
      amount: "$9.99",
      plan: "Wander.AI Pro (Monthly)",
      status: "Paid",
    },
  ];

  return (
    <div className="py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1.5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Receipt className="w-3.5 h-3.5" />
            <span>Billing & Subscription</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-serif">
            Manage Plan & Billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Review your active plan, manage payment methods, and download past invoices.
          </p>
        </motion.div>

        {/* Current Plan Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-soft relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current Membership
                </span>
                <Badge
                  variant={isPro ? "default" : "secondary"}
                  className="font-bold text-xs px-3 py-0.5 rounded-full"
                >
                  {isPro ? (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      {tier} MEMBER
                    </span>
                  ) : (
                    "FREE PLAN"
                  )}
                </Badge>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                {isPro ? "Wander.AI Pro Experience" : "Free Explorer Plan"}
              </h2>

              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                {isPro
                  ? "Enjoy unlimited AI trip generations, live multiplayer editing, offline PDF exports, and 24/7 travel assistant perks."
                  : "You are currently on the free tier. Upgrade to unlock unlimited AI itineraries, real-time collaboration, and priority features."}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-3 shrink-0">
              <Button
                asChild
                className="rounded-full px-6 py-2.5 font-bold shadow-soft bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white cursor-pointer"
              >
                <Link href="/dashboard/pricing">
                  {isPro ? "Change Plan" : "Upgrade to Pro"}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">
                Billed securely via Razorpay
              </span>
            </div>
          </div>

          {/* Perks Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-border/60">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Unlimited Trips & AI Refinements</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Real-Time Live Multiplayer</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Bank-Grade 256-bit Security</span>
            </div>
          </div>
        </motion.div>

        {/* Invoices History */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Invoice History</h3>
            <span className="text-xs text-muted-foreground">Last updated just now</span>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-soft-xs">
            <div className="divide-y divide-border/60">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {inv.plan}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{inv.id}</span>
                        <span>•</span>
                        <span>{inv.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{inv.amount}</div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        {inv.status}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => alert(`Receipt downloaded for ${inv.id}`)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Receipt</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
