import React from "react";
import { FadeIn } from "./FadeIn";

/**
 * Showcase/Itinerary Section
 */
interface TrendingTripsProps {
  onGenerate: (prompt: string) => void;
}

export const TrendingTrips: React.FC<TrendingTripsProps> = ({ onGenerate }) => {
  return (
    <section className="py-32 bg-black relative" id="destinations">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn className="mb-20 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Trending <span className="text-gray-600">Itineraries</span>
          </h2>
        </FadeIn>

        <div className="space-y-32">
          {[1, 2].map((item, index) => (
            <FadeIn key={item} delay={index * 200}>
              <div
                className={`flex flex-col md:flex-row gap-12 md:gap-20 items-center ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Image Side */}
                <div
                  className="w-full md:w-3/5 group cursor-pointer"
                  onClick={() => onGenerate(index === 0 ? "Tokyo" : "Iceland")}
                >
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/3] border border-white/10">
                    <div className="absolute inset-0 bg-gray-800 transition-transform duration-700 group-hover:scale-105">
                      {/* Placeholder abstract visuals representing destinations */}
                      {index === 0 ? (
                        <div className="w-full h-full bg-gradient-to-br from-red-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                          <div className="w-64 h-64 bg-red-600/20 rounded-full blur-[60px] absolute top-0 right-0" />
                          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=2787&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                          <div className="relative z-10 text-center">
                            <div className="text-9xl font-bold text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12">
                              TOKYO
                            </div>
                            <h3 className="text-5xl font-bold text-white mb-2">
                              Neon & Tradition
                            </h3>
                            <p className="text-red-200 uppercase tracking-widest">
                              7 Day Itinerary
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                          <div className="w-64 h-64 bg-cyan-600/20 rounded-full blur-[60px] absolute bottom-0 left-0" />
                          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?q=80&w=2787&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                          <div className="relative z-10 text-center">
                            <div className="text-9xl font-bold text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12">
                              ICELAND
                            </div>
                            <h3 className="text-5xl font-bold text-white mb-2">
                              Fire & Ice
                            </h3>
                            <p className="text-cyan-200 uppercase tracking-widest">
                              5 Day Roadtrip
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                  </div>
                </div>

                {/* Text Side */}
                <div className="w-full md:w-2/5">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="w-12 h-[1px] bg-emerald-400" />
                    <span className="text-emerald-400 font-bold tracking-widest text-sm uppercase">
                      Curated by AI
                    </span>
                  </div>
                  <h3 className="text-4xl font-bold text-white mb-6">
                    {index === 0 ? "The Soul of Japan" : "Nordic Adventure"}
                  </h3>
                  <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    {index === 0
                      ? "From the bustling crossing of Shibuya to the quiet temples of Kyoto. This itinerary balances high-energy city life with spiritual retreats, optimizing travel times via Shinkansen."
                      : "Chase waterfalls, walk on glaciers, and hunt for the Northern Lights. A perfectly timed route through the Golden Circle and South Coast to maximize daylight hours."}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-8">
                    {(index === 0
                      ? ["Culture", "Food", "History"]
                      : ["Nature", "Hiking", "Photography"]
                    ).map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      onGenerate(index === 0 ? "Tokyo" : "Iceland")
                    }
                    className="text-white border-b border-white hover:border-emerald-400 hover:text-emerald-400 pb-1 transition-all"
                  >
                    View Full Itinerary
                  </button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
