import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Star,
  Clock,
  Plane,
  Utensils,
  Bed,
  Music,
  Camera,
  MapPin,
  Sparkles,
  LucideIcon,
  Edit,
  Map,
  Save,
  Check,
  Loader,
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { ItineraryData, ActivityType, Activity } from "../types";
import { MapPopover } from "../ui/MapPopover";
import { WeatherWidget } from "../ui/WeatherWidget";
import { BudgetWidget } from "../ui/BudgetWidget";
import { BudgetModal } from "../ui/BudgetModal";
import { ExpenseInput } from "../ui/ExpenseInput";
import { ShareButton } from "../ui/ShareButton";
import { SocialStats } from "../ui/SocialStats";
import { CalendarExport } from "../ui/CalendarExport";
import { getDestinationImage } from "../../lib/unsplashService";
import { useEffect, useState } from "react";

/**
 * Itinerary Detail View
 */
interface ItineraryViewProps {
  data: ItineraryData;
  onBack: () => void;
  onEditActivity?: (
    dayIndex: number,
    activityIndex: number,
    activity: Activity
  ) => void;
  onViewMap?: (activity?: Activity) => void;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const imageVariants: Variants = {
  hidden: { scale: 1.1, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" as const },
  },
};

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  data,
  onBack,
  onEditActivity,
  onViewMap,
}) => {
  const [heroImage, setHeroImage] = useState(data.image);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Upgrade to high-res Unsplash image on mount
    const fetchImage = async () => {
      const newImage = await getDestinationImage(data.destination);
      if (newImage && newImage !== data.image) {
        setHeroImage(newImage);
      }
    };
    fetchImage();

    // Fetch like status if itinerary has an ID
    if (data.id) {
      fetch(`/api/itineraries/${data.id}/like`)
        .then((res) => res.json())
        .then((data) => setIsLiked(data.liked))
        .catch(console.error);
    }
  }, [data.id, data.destination, data.image]);

  const handleSave = async () => {
    if (saving || !data.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/itineraries/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLike = async () => {
    if (!data.id) return;

    try {
      const response = await fetch(`/api/itineraries/${data.id}/like`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        setIsLiked(result.liked);
        setLikeCount((prev) => (result.liked ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const getIcon = (type: ActivityType): LucideIcon => {
    switch (type) {
      case "travel":
        return Plane;
      case "food":
        return Utensils;
      case "hotel":
        return Bed;
      case "nightlife":
        return Music;
      case "sightseeing":
        return Camera;
      default:
        return MapPin;
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-black pt-24 pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="fixed top-24 left-6 z-40">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Itinerary Header */}
      <div className="relative h-[40vh] w-full overflow-hidden group bg-gradient-to-br from-emerald-900/40 via-black to-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        <motion.img
          key={heroImage} // Trigger animation on change
          src={heroImage}
          alt={data.destination}
          className="absolute inset-0 w-full h-full object-cover object-center"
          variants={imageVariants}
          onError={(e) => {
            // Fallback to default image if loading fails
            const target = e.target as HTMLImageElement;
            if (
              target.src !==
              "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2940&auto=format&fit=crop"
            ) {
              target.src =
                "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2940&auto=format&fit=crop";
            }
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-20 max-w-4xl mx-auto px-6 pb-12 flex items-end justify-between"
          variants={itemVariants}
        >
          <div>
            <div className="flex gap-2 mb-4">
              {data.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
              {data.destination}
            </h1>
            <div className="flex items-center gap-4 text-gray-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {data.duration}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" /> 4.9 Rating
              </span>
              <span className="flex items-center gap-1">
                {data.budget} Budget
              </span>
            </div>

            {/* Social Stats */}
            <div className="mt-4">
              <SocialStats
                views={data.viewCount || 0}
                likes={data.likeCount || likeCount}
                clones={data.cloneCount || 0}
                rating={data.averageRating}
                reviewCount={data.reviewCount}
                isLiked={isLiked}
                onLike={handleLike}
              />
            </div>
          </div>

          {/* Widgets Container (Hidden on mobile) */}
          <motion.div
            className="hidden md:flex flex-col gap-3 w-80 mb-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <WeatherWidget location={data.destination} />
            <BudgetWidget
              destination={data.destination}
              onSetBudget={() => setIsBudgetModalOpen(true)}
              onViewDetails={() => setIsBudgetModalOpen(true)}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto px-6 mt-12">
        {data.days?.map((day, dayIndex) => (
          <motion.div
            key={day.day || dayIndex}
            className="mb-16 relative"
            variants={itemVariants}
          >
            {/* Day Header */}
            <div className="flex items-center gap-4 mb-8 sticky top-24 z-30 bg-black/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-white/10 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex flex-col items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/50">
                <span className="text-xs uppercase">Day</span>
                <span className="text-xl leading-none">{day.day}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{day.title}</h3>
                <p className="text-gray-400 text-sm">
                  {day.date || `Day ${day.day}`}
                </p>
              </div>
            </div>

            {/* Activities */}
            <div className="pl-6 border-l-2 border-white/10 space-y-8">
              {day.activities?.map((activity, actIndex) => {
                const Icon = getIcon(activity.type);
                const activityCard = (
                  <motion.div
                    key={actIndex}
                    className="relative pl-8 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: actIndex * 0.1, duration: 0.5 }}
                  >
                    {/* Timeline Dot */}
                    <div className="absolute -left-[33px] top-0 w-4 h-4 rounded-full bg-black border-2 border-emerald-500 group-hover:scale-125 transition-transform duration-300" />

                    {/* Activity Card */}
                    <motion.div
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-emerald-500/30 transition-colors duration-300"
                      whileHover={{ x: 10 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
                          <Clock className="w-4 h-4" />
                          {activity.time}
                        </div>
                        <div className="flex items-center gap-2">
                          {onEditActivity && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditActivity(dayIndex, actIndex, activity);
                              }}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
                              title="Edit activity"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <div
                            className={`p-2 rounded-lg bg-white/5 ${
                              activity.type === "travel"
                                ? "text-blue-400"
                                : activity.type === "food"
                                ? "text-orange-400"
                                : activity.type === "hotel"
                                ? "text-purple-400"
                                : "text-emerald-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">
                        {activity.title}
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed mb-3">
                        {activity.desc}
                      </p>

                      {/* Expense Input */}
                      <ExpenseInput
                        destination={data.destination}
                        activityTitle={activity.title}
                        activityType={activity.type}
                        existingExpenseId={activity.expenseId}
                      />
                    </motion.div>
                  </motion.div>
                );

                // Wrap with MapPopover if location data exists
                return activity.location ? (
                  <MapPopover
                    key={actIndex}
                    location={activity.location}
                    onMapClick={() => {
                      onViewMap?.(activity);
                    }}
                  >
                    {activityCard}
                  </MapPopover>
                ) : (
                  activityCard
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Action Bar */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/20 shadow-2xl">
            {/* Left Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/itinerary/${data.id}/bookings`}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Bookings
              </Link>
              {data.id && <CalendarExport itineraryId={data.id} />}
              <ShareButton
                title={`${data.title || data.destination}`}
                destination={data.destination}
                duration={`${data.duration} days`}
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-white/20" />

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving || saved}
                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-emerald-500 hover:bg-emerald-400 text-white"
                } disabled:opacity-50`}
              >
                {saved ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved!
                  </>
                ) : saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Itinerary
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
                title="AI Suggestions"
              >
                <Sparkles className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-green-500 text-white rounded-xl shadow-2xl flex items-center gap-2 whitespace-nowrap z-[200]"
              >
                <Check className="w-5 h-5" />
                Itinerary saved successfully!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        destination={data.destination}
      />
    </motion.div>
  );
};
