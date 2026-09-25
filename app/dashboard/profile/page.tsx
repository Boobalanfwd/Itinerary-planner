"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, MapPin, Globe, Calendar, Edit, Camera, Sparkles, Check, Crown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    bio: "",
    location: "",
    website: "",
    travelStyle: [] as string[],
    subscriptionTier: "FREE",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const username = session?.user?.email?.split("@")[0];
      const response = await fetch(`/api/users/${username}`);
      const data = await response.json();

      if (data.success && data.profile) {
        setProfile({
          bio: data.profile.bio || "",
          location: data.profile.location || "",
          website: data.profile.website || "",
          travelStyle: data.profile.travelStyle || [],
          subscriptionTier: data.profile.subscriptionTier || "FREE",
        });
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const username = session?.user?.email?.split("@")[0];
      const response = await fetch(`/api/users/${username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success) {
        setEditing(false);
      }
    } catch (error) {
      console.error("Save profile error:", error);
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard/profile");
    }
  }, [status, router]);

  if (status === "unauthenticated") {
    return null;
  }

  const travelStyles = [
    "Adventure",
    "Luxury",
    "Budget",
    "Cultural",
    "Food",
    "Nature",
    "Beach",
    "City",
    "Photography",
    "Solo",
  ];

  const stats = [
    { label: "Total Trips", value: "0", icon: Calendar },
    { label: "Countries Visited", value: "0", icon: Globe },
    { label: "Cities Explored", value: "0", icon: MapPin },
  ];

  return (
    <div className="py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Cover & Avatar Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Cover Image Banner */}
          <div className="h-44 sm:h-52 bg-gradient-to-r from-emerald-600 via-teal-600 to-primary rounded-3xl relative overflow-hidden shadow-soft">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            <button
              aria-label="Change cover image"
              className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Picture */}
          <div className="absolute -bottom-14 left-6 sm:left-8 flex items-end gap-4">
            <div className="relative">
              <img
                src={session?.user?.image || "/default-avatar.png"}
                alt={session?.user?.name || "User"}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-card bg-muted object-cover shadow-lg"
              />
              <button
                aria-label="Change avatar"
                className="absolute bottom-1 right-1 p-2 bg-primary hover:bg-primary/90 rounded-full text-primary-foreground shadow-md transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Profile Info & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="pt-10 sm:pt-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                  {session?.user?.name || "Traveler"}
                </h1>
                {profile.subscriptionTier && profile.subscriptionTier !== "FREE" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-soft">
                    <Crown className="w-3.5 h-3.5" />
                    {profile.subscriptionTier} TRAVELER
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/80">
                    Free Explorer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-muted-foreground font-mono">
                  @{session?.user?.email?.split("@")[0] || "user"}
                </p>
                {profile.subscriptionTier === "FREE" && (
                  <Link
                    href="/dashboard/pricing"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Upgrade to Pro</span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </Link>
                )}
              </div>
            </div>
            <Button
              variant={editing ? "outline" : "default"}
              onClick={() => setEditing(!editing)}
              className="rounded-full px-5 font-semibold text-xs gap-2 self-start sm:self-auto shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" />
              {editing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          {editing ? (
            <div className="space-y-5 p-6 sm:p-8 bg-card/85 backdrop-blur-sm border border-border/80 rounded-3xl shadow-soft">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  placeholder="Tell us about your travel passions..."
                  rows={3}
                  className="w-full p-3.5 bg-background border border-border/80 rounded-2xl text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                    placeholder="e.g. San Francisco, CA"
                    className="w-full p-3.5 bg-background border border-border/80 rounded-2xl text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Website / Portfolio
                  </label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) =>
                      setProfile({ ...profile, website: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full p-3.5 bg-background border border-border/80 rounded-2xl text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Travel Styles
                </label>
                <div className="flex flex-wrap gap-2">
                  {travelStyles.map((style) => {
                    const active = profile.travelStyle.includes(style);
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => {
                          setProfile({
                            ...profile,
                            travelStyle: active
                              ? profile.travelStyle.filter((s) => s !== style)
                              : [...profile.travelStyle, style],
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-full py-3 font-semibold text-sm shadow-md"
                >
                  {saving ? "Saving Changes..." : "Save Profile Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-card/85 backdrop-blur-sm border border-border/80 rounded-3xl shadow-soft space-y-4">
              {profile.bio ? (
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No bio added yet. Click &quot;Edit Profile&quot; to share your travel story.
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                {profile.location && (
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <MapPin className="w-4 h-4 text-primary" />
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <Globe className="w-4 h-4 text-primary" />
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
              </div>

              {profile.travelStyle.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                  {profile.travelStyle.map((style) => (
                    <span
                      key={style}
                      className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-5 sm:p-6 bg-card/85 backdrop-blur-sm border border-border/80 rounded-3xl shadow-soft text-center space-y-1.5"
            >
              <div className="w-10 h-10 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
