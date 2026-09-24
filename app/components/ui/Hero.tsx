import React, { useState, FormEvent } from "react";
import { Search, Sparkles } from "lucide-react";
import { FadeIn } from "./FadeIn";
import { AuthPromptDialog } from "./AuthPromptDialog";

/**
 * Hero Section
 */
interface HeroProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  isAuthenticated: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onGenerate,
  isGenerating,
  isAuthenticated,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      if (!isAuthenticated) {
        setShowAuthDialog(true);
        return;
      }
      onGenerate(inputValue);
    }
  };

  const handleQuickGenerate = (destination: string) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    onGenerate(destination);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] animate-blob" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <FadeIn delay={0}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            AI Model v3.0 Live
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
            Your Perfect Trip, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-600">
              Generated
            </span>{" "}
            in Seconds.
          </h1>
        </FadeIn>

        <FadeIn delay={400}>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop planning, start experiencing. Our AI curates personalized
            itineraries based on your budget, interests, and travel style.
          </p>
        </FadeIn>

        {/* AI Input Simulation */}
        <FadeIn delay={500} className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-2 pr-2">
              <div className="pl-6 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Where do you want to go? (e.g., 5 days in Paris for a foodie...)"
                className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-4 py-3 outline-none"
              />
              <button
                type="submit"
                disabled={isGenerating}
                className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isGenerating ? "Thinking..." : "Generate"}</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </form>
        </FadeIn>

        <FadeIn
          delay={600}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Popular:</span>
            <span
              onClick={() => handleQuickGenerate("Tokyo, Japan")}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-colors"
            >
              🇯🇵 Tokyo
            </span>
            <span
              onClick={() => handleQuickGenerate("Amalfi Coast, Italy")}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-colors"
            >
              🇮🇹 Amalfi
            </span>
            <span
              onClick={() => handleQuickGenerate("Reykjavik, Iceland")}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-colors"
            >
              🇮🇸 Iceland
            </span>
          </div>
        </FadeIn>
      </div>

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
      />
    </section>
  );
};
