import React from "react";
import { FadeIn } from "./FadeIn";

/**
 * Animated Stats Section
 */
export const Stats: React.FC = () => {
  return (
    <section className="py-20 border-y border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden">
      {/* Background shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-shine" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
        {[
          { label: "Itineraries Created", value: "50k+" },
          { label: "Cities Covered", value: "1.2k" },
          { label: "Traveler Rating", value: "4.9/5" },
          { label: "Money Saved", value: "$2M+" },
        ].map((stat, i) => (
          <FadeIn key={i} delay={i * 100} className="text-center">
            <div className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-tight">
              {stat.value}
            </div>
            <div className="text-sm uppercase tracking-widest text-gray-500 font-semibold">
              {stat.label}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
};
