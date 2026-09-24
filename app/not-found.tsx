import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Compass, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg w-full">
        {/* Animated compass / map icon */}
        <div className="mx-auto mb-6 relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
            <Compass className="h-10 w-10 text-primary animate-spin [animation-duration:8s]" />
          </div>
        </div>

        {/* 404 */}
        <p className="text-8xl font-black text-primary/20 leading-none select-none mb-2">
          404
        </p>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Destination not found
        </h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Looks like this page wandered off the map. Let&apos;s get you back on
          track.
        </p>

        {/* Suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          {[
            { href: "/dashboard", label: "Dashboard", hint: "Your trips overview" },
            { href: "/dashboard/create", label: "Plan a new trip", hint: "Start from scratch" },
            { href: "/dashboard/itineraries", label: "My Itineraries", hint: "All your travel plans" },
            { href: "/marketplace", label: "Explore trips", hint: "Community itineraries" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted hover:border-primary/30 transition-all group"
            >
              <MapPin className="mt-0.5 h-4 w-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
