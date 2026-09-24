import React from "react";
import { LucideIcon } from "lucide-react";
import { FadeIn } from "./FadeIn";

/**
 * Feature/Service Card Component
 */
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  delay: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  desc,
  delay,
}) => (
  <FadeIn delay={delay}>
    <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-500 overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
          <Icon className="w-7 h-7 text-white group-hover:text-emerald-400 transition-colors" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4 group-hover:translate-x-2 transition-transform duration-300">
          {title}
        </h3>
        <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
          {desc}
        </p>
      </div>
    </div>
  </FadeIn>
);
