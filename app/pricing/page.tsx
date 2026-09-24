"use client";

import React, { useState } from "react";
import { Navbar } from "../components/ui/Navbar";
import { Footer } from "../components/ui/Footer";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Globe,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../components/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSubscription } from "../hooks/useSubscription";
import { Button } from "@/components/ui/button";

interface PricingTier {
  name: string;
  price: number;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { upgradePlan, tier: currentTier } = useSubscription();
  const [upgrading, setUpgrading] = useState(false);

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handleUpgrade = async (tierName: string) => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (tierName === "Free") {
      router.push("/dashboard");
      return;
    }

    setUpgrading(true);
    try {
      const success = await upgradePlan(
        tierName.toUpperCase() as "PRO" | "PREMIUM"
      );
      if (success) {
        alert(`Successfully upgraded to ${tierName}!`);
      } else {
        alert("Failed to upgrade. Please try again.");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  const tiers: PricingTier[] = [
    {
      name: "Free",
      price: 0,
      period: "forever",
      description: "Perfect for exploring and creating your first trips.",
      icon: <Globe className="w-5 h-5" />,
      features: [
        "3 itineraries per month",
        "Standard AI recommendations",
        "Community travel hub access",
        "Budget tracking essentials",
        "Mobile-optimized dashboard",
        "Standard email support",
      ],
      cta: "Get Started Free",
    },
    {
      name: "Pro",
      price: billingCycle === "monthly" ? 9.99 : 7.99,
      period:
        billingCycle === "monthly" ? "per month" : "per month (billed yearly)",
      description: "For passionate travelers seeking complete freedom.",
      icon: <Zap className="w-5 h-5" />,
      highlighted: true,
      features: [
        "Unlimited AI itineraries",
        "Instant AI trip refinement & chat",
        "Interactive route maps & stops",
        "Multi-currency budget tracking",
        "Hotel & flight recommendations",
        "PDF export & public sharing links",
        "Priority 24/7 travel assistance",
      ],
      cta: "Start Pro Experience",
    },
    {
      name: "Premium",
      price: billingCycle === "monthly" ? 19.99 : 15.99,
      period:
        billingCycle === "monthly" ? "per month" : "per month (billed yearly)",
      description: "For agencies, travel creators, and group organizers.",
      icon: <Crown className="w-5 h-5" />,
      features: [
        "Everything in Pro tier",
        "Custom AI traveler preference models",
        "Group planning (up to 20 travelers)",
        "White-label PDF itinerary exports",
        "Exclusive hotel discount partner rates",
        "Dedicated account manager",
        "Early access to beta features",
      ],
      cta: "Upgrade to Premium",
    },
  ];

  const yearlySavings = billingCycle === "yearly" ? "Save 20%" : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onViewChange={() => {}} />

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-10 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent & Flexible</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Simple Plans for Every Journey
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Start planning for free. Upgrade anytime to unlock unlimited AI-powered travel itineraries and collaboration.
            </p>

            {/* Billing Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span
                className={cn(
                  "text-xs sm:text-sm font-semibold transition-colors",
                  billingCycle === "monthly"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Monthly Billing
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={billingCycle === "yearly"}
                aria-label="Toggle annual billing"
                onClick={() =>
                  setBillingCycle(
                    billingCycle === "monthly" ? "yearly" : "monthly"
                  )
                }
                className="relative w-14 h-7 rounded-full bg-muted border border-border transition-colors p-0.5"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full bg-primary shadow-sm transition-transform",
                    billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"
                  )}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xs sm:text-sm font-semibold transition-colors",
                    billingCycle === "yearly"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  Yearly Billing
                </span>
                {yearlySavings && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                    {yearlySavings}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "rounded-3xl p-6 sm:p-8 backdrop-blur-sm transition-all flex flex-col justify-between text-left",
                  tier.highlighted
                    ? "bg-card/95 border-2 border-primary shadow-xl md:-translate-y-2 relative"
                    : "bg-card/85 border border-border/80 shadow-soft hover:shadow-md"
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      {tier.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {tier.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="my-6 pb-6 border-b border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-extrabold text-foreground font-mono">
                        ${tier.price}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        /{tier.period.split(" ")[0]}
                      </span>
                    </div>
                    {tier.price > 0 && tier.period.includes("billed") && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Billed annually (${(tier.price * 12).toFixed(2)}/yr)
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Included Features
                    </p>
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5 text-xs text-foreground/90">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleUpgrade(tier.name)}
                  disabled={
                    upgrading || currentTier === tier.name.toUpperCase()
                  }
                  variant={tier.highlighted ? "default" : "outline"}
                  className="w-full rounded-full py-2.5 font-semibold text-xs shadow-sm"
                >
                  {upgrading
                    ? "Processing..."
                    : currentTier === tier.name.toUpperCase()
                    ? "Current Active Plan"
                    : tier.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to know about our plans, billing, and cancellations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                q: "Can I cancel or change my plan anytime?",
                a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time right from your settings. Upgrades take effect immediately.",
              },
              {
                q: "Is there a free trial for Pro features?",
                a: "Yes! Every new account gets 3 free AI itineraries with full access to day plans and map generation without entering credit card details.",
              },
              {
                q: "What payment methods are supported?",
                a: "We support major credit cards, Apple Pay, Google Pay, and PayPal through our secure PCI-compliant billing processor.",
              },
              {
                q: "What happens if I downgrade?",
                a: "You will retain access to your previously generated itineraries. Only the generation limit will reset to the Free tier quota.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="p-5 sm:p-6 rounded-3xl bg-card/85 border border-border/80 shadow-soft space-y-1.5"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="pb-16 pt-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-card/90 border border-border/80 shadow-soft text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Ready to Craft Your Next Adventure?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Join thousands of global explorers who plan smart, travel stress-free, and discover unforgettable journeys.
            </p>
            <div className="pt-2">
              <Button
                asChild
                className="rounded-full px-7 py-3 font-semibold text-xs shadow-md gap-2"
              >
                <a href="/dashboard/create">
                  Plan Your Trip Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
