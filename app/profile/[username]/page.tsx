"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Globe,
  Calendar,
  Heart,
  Loader2,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Edit,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import { Footer } from "@/app/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { getCountryCode } from "@/lib/country-code";
import * as Flags from "country-flag-icons/react/3x2";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [params.username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${params.username}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        setFollowing(data.profile.isFollowing);
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const response = await fetch(`/api/users/${params.username}/follow`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setFollowing(data.following);
        setProfile((prev: any) => ({
          ...prev,
          followerCount: prev.followerCount + (data.following ? 1 : -1),
        }));
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-mono text-muted-foreground">Loading explorer profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <h2 className="text-2xl font-bold text-foreground">Traveler Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The profile you are looking for does not exist or has been made private.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/marketplace")}
            className="rounded-full text-xs font-semibold"
          >
            ← Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onViewChange={() => {}} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 space-y-10">
        {/* Navigation & Header */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-full gap-1.5 text-xs font-semibold border-border/80 hover:bg-muted"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
        </div>

        {/* Cover & Avatar */}
        <div className="relative">
          <div className="h-44 sm:h-52 bg-gradient-to-r from-emerald-600 via-teal-600 to-primary rounded-3xl relative overflow-hidden shadow-soft">
            {profile.coverImage && (
              <img
                src={profile.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="absolute -bottom-12 left-6 sm:left-8">
            <img
              src={profile.image || "/default-avatar.png"}
              alt={profile.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-card bg-muted object-cover shadow-lg"
            />
          </div>
        </div>

        {/* Profile Info & Follow Button */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {profile.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
                @{profile.username}
              </p>
            </div>

            {profile.bio && (
              <p className="text-sm text-foreground/90 leading-relaxed">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
              {profile.location && (
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {profile.location}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-primary transition-colors"
                  >
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Joined{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Travel Styles */}
            {profile.travelStyle?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.travelStyle.map((style: string) => (
                  <span
                    key={style}
                    className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold"
                  >
                    {style}
                  </span>
                ))}
              </div>
            )}

            {/* Follower Stats */}
            <div className="flex items-center gap-5 text-xs pt-1">
              <span className="text-muted-foreground font-mono">
                <strong className="text-foreground text-sm font-bold">
                  {profile.followerCount}
                </strong>{" "}
                Followers
              </span>
              <span className="text-muted-foreground font-mono">
                <strong className="text-foreground text-sm font-bold">
                  {profile.followingCount}
                </strong>{" "}
                Following
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {profile.isOwnProfile ? (
              <Button
                onClick={() => router.push("/dashboard/profile")}
                variant="outline"
                className="rounded-full px-5 py-2.5 font-semibold text-xs gap-2 border-border/80 hover:bg-muted"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Profile
              </Button>
            ) : (
              <Button
                onClick={handleFollow}
                disabled={followLoading}
                variant={following ? "outline" : "default"}
                className="rounded-full px-6 py-2.5 font-semibold text-xs gap-2 shadow-sm"
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : following ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 sm:p-6 bg-card/85 backdrop-blur-sm border border-border/80 rounded-3xl shadow-soft text-center space-y-1">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-1" />
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {profile.totalTrips || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Total Trips</div>
          </div>
          <div className="p-5 sm:p-6 bg-card/85 backdrop-blur-sm border border-border/80 rounded-3xl shadow-soft text-center space-y-1">
            <Globe className="w-6 h-6 text-primary mx-auto mb-1" />
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {profile.visitedCountries || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Countries</div>
          </div>
          <div className="p-5 sm:p-6 bg-card/85 backdrop-blur-sm border border-border/80 rounded-3xl shadow-soft text-center space-y-1">
            <Heart className="w-6 h-6 text-primary mx-auto mb-1" />
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {profile.itineraries?.reduce(
                (sum: number, it: any) => sum + (it.likeCount || 0),
                0
              ) || 0}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Trip Likes</div>
          </div>
        </div>

        {/* Public Itineraries Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Public Itineraries ({profile.itineraries?.length || 0})
            </h2>
          </div>

          {(!profile.itineraries || profile.itineraries.length === 0) ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-border/80 bg-card/40 p-8 space-y-2">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                This traveler hasn&apos;t shared any public itineraries yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.itineraries.map((itinerary: any, index: number) => {
                const countryCode = getCountryCode(itinerary.destination);
                const FlagIcon =
                  countryCode &&
                  (Flags as Record<string, React.ComponentType<{ className?: string }>>)[
                    countryCode
                  ];

                return (
                  <motion.div
                    key={itinerary.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/marketplace/${itinerary.id}`)}
                    className="group bg-card/85 rounded-3xl overflow-hidden border border-border/80 hover:border-primary/50 shadow-soft hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative h-44 overflow-hidden bg-muted">
                      <img
                        src={
                          itinerary.coverImage ||
                          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800"
                        }
                        alt={itinerary.destination}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
                          {FlagIcon && (
                            <FlagIcon className="w-4 h-3 rounded-[2px] shadow-sm flex-shrink-0" />
                          )}
                          <span>{itinerary.destination}</span>
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-base font-bold text-white drop-shadow-md line-clamp-1">
                          {itinerary.title || `${itinerary.destination} Trip`}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>{itinerary.duration} days</span>
                      <div className="flex items-center gap-1 text-foreground">
                        <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span>{itinerary.likeCount || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
