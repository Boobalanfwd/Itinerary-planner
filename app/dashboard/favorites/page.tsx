"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard/favorites");
    }
  }, [status, router]);

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Saved Trips
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif">
            Your Favorites
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trips and curated itineraries you've bookmarked for future adventures.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved favorites..."
              className="pl-11 py-5 rounded-2xl bg-card border-border/80 text-sm focus-visible:ring-primary shadow-xs"
            />
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-16 sm:py-20 rounded-3xl border border-dashed border-border/80 bg-card/60 backdrop-blur-sm p-8 max-w-2xl mx-auto shadow-soft">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            No favorites yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Discover itineraries shared by other travelers or generate your own custom trips to save them here.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => router.push("/marketplace")}
              className="rounded-full px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold shadow-md shadow-primary/25 cursor-pointer text-xs"
            >
              <Compass className="w-4 h-4 mr-2" />
              Explore Marketplace
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/create")}
              className="rounded-full px-6 py-3 border-border/70 hover:border-primary/40 text-xs font-semibold cursor-pointer"
            >
              Plan a New Trip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
