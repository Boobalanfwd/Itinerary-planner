"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { TripCreationForm } from "@/components/trip-creation-form";

export default function CreateItineraryPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/dashboard/create");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Compass className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading travel studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/80 hover:bg-card border border-border/70 hover:border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-primary" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* All-in-one trip generation workstation */}
        <TripCreationForm />
      </div>
    </div>
  );
}
