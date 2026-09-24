"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Compass,
  Sparkles,
  Cloud,
  Share2,
  Download,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  callbackUrl?: string;
}

export function AuthPromptDialog({
  open,
  onOpenChange,
  title = "Save Your Itinerary with Wander.AI",
  description = "Create a free account or sign in to save this trip, sync it across all your devices, and share it with travel companions.",
  callbackUrl = "/dashboard",
}: AuthPromptDialogProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6 sm:p-7 rounded-3xl border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="text-center space-y-2.5 items-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Compass className="w-6 h-6 animate-[spin_12s_linear_infinite]" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-serif">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Value Perks */}
        <div className="grid grid-cols-3 gap-2.5 my-4 p-3.5 rounded-2xl bg-muted/40 border border-border/50 text-center">
          <div className="space-y-1">
            <Cloud className="w-4 h-4 mx-auto text-primary" />
            <p className="text-[11px] font-semibold leading-tight text-foreground">
              Cloud Sync
            </p>
          </div>
          <div className="space-y-1">
            <Share2 className="w-4 h-4 mx-auto text-emerald-500" />
            <p className="text-[11px] font-semibold leading-tight text-foreground">
              Share Links
            </p>
          </div>
          <div className="space-y-1">
            <Download className="w-4 h-4 mx-auto text-primary" />
            <p className="text-[11px] font-semibold leading-tight text-foreground">
              Export PDF
            </p>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full h-11 border-border/80 hover:bg-accent/60 font-medium rounded-full cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
            ) : (
              <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              <Button
                variant="outline"
                className="w-full h-11 rounded-full text-xs font-semibold cursor-pointer"
              >
                Sign In
              </Button>
            </Link>
            <Link
              href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              <Button className="w-full h-11 rounded-full text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/25 cursor-pointer">
                Register
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-3">
          No credit card required. Free tier includes up to 5 AI trips.
        </p>
      </DialogContent>
    </Dialog>
  );
}
