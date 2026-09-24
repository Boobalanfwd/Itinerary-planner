import React from "react";
import { Compass, Calendar, Map as MapIcon } from "lucide-react";
import { FadeIn } from "./FadeIn";
import { FeatureCard } from "./FeatureCard";

/**
 * Features Section
 */
export const Features: React.FC = () => {
  const features = [
    {
      icon: Compass,
      title: "Smart Routing",
      desc: "Our AI optimizes your route to minimize travel time and maximize exploration. No more backtracking.",
      delay: 0,
    },
    {
      icon: Calendar,
      title: "Dynamic Scheduling",
      desc: "Rain predicted? Museum closed? Your itinerary automatically adapts to real-time conditions.",
      delay: 200,
    },
    {
      icon: MapIcon,
      title: "Local Hidden Gems",
      desc: "Go beyond the tourist traps. We analyze millions of data points to find authentic local experiences.",
      delay: 400,
    },
  ];

  return (
    <section className="py-32 bg-black relative" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Travel{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-600">
                  Intelligently
                </span>
              </h2>
              <p className="text-gray-400 max-w-md text-lg">
                The world's most advanced travel engine, designed to create
                memories, not spreadsheets.
              </p>
            </div>
            <button className="pb-2 border-b border-white/30 text-white hover:text-emerald-400 hover:border-emerald-400 transition-all">
              See How It Works
            </button>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
};
