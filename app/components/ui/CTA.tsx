import React from "react";
import { FadeIn } from "./FadeIn";

/**
 * CTA Section
 */
export const CTA: React.FC = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/20 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <FadeIn>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            Ready for your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-600">
              next adventure?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of travelers exploring the world smarter. Your
            personalized journey is just one click away.
          </p>
          <button className="px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:bg-emerald-400 transition-colors transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_-10px_rgba(52,211,153,0.5)]">
            Start Planning for Free
          </button>
        </FadeIn>
      </div>
    </section>
  );
};
