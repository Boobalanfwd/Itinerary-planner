"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, MapPin, Clock, DollarSign, Loader } from "lucide-react";
import { motion } from "framer-motion";

interface Recommendation {
  id: string;
  title: string;
  destination: string;
  duration: string;
  budget: string;
  image: string;
  tags: string[];
}

interface SmartRecommendationsProps {
  currentDestination: string;
  currentTags: string[];
  onSelectRecommendation?: (prompt: string) => void;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  currentDestination,
  currentTags,
  onSelectRecommendation,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: currentDestination,
            tags: currentTags,
          }),
        });

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error("Recommendations error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentDestination, currentTags]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <Loader className="w-6 h-6 text-emerald-400 animate-spin" />
          <h2 className="text-2xl font-bold text-white">
            Finding recommendations...
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-800/50 rounded-2xl h-64 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-emerald-400" />
        <h2 className="text-2xl font-bold text-white">You Might Also Like</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              if (onSelectRecommendation) {
                const prompt = `${rec.duration} in ${rec.destination}, ${rec.budget} budget`;
                onSelectRecommendation(prompt);
              }
            }}
            className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-emerald-500 transition-all hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={rec.image}
                alt={rec.destination}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  {rec.destination}
                </h3>
                <p className="text-sm text-gray-300">{rec.title}</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-4">
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{rec.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{rec.budget}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {rec.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded-lg text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
