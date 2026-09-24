import React from "react";
import { Sparkles } from "lucide-react";

/**
 * Itinerary Loading View
 */
export const LoadingView: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
    <div className="relative z-10 flex flex-col items-center">
      <div className="w-24 h-24 mb-8 relative">
        <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-spin animation-delay-200" />
        <div className="absolute inset-4 rounded-full border-b-2 border-purple-500 animate-spin animation-delay-400" />
        <Sparkles className="absolute inset-0 m-auto text-white w-8 h-8 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Consulting the AI...
      </h2>
      <div className="text-gray-400 flex flex-col items-center gap-1 h-6 overflow-hidden">
        <div className="animate-slide-up">
          <span>Generating unique experiences...</span>
          <span>Crafting cinematic visuals...</span>
          <span>Optimizing travel routes...</span>
          <span>Finding hidden gems...</span>
        </div>
      </div>
    </div>
  </div>
);
