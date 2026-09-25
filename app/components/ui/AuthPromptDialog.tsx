import React from "react";
import { X, LogIn, UserPlus, Sparkles, Compass } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Authentication Prompt Dialog
 * Shows when unauthenticated users try to generate an itinerary
 * Preserves the user's entered trip prompt across login/register
 */
interface AuthPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: string;
}

export const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({
  isOpen,
  onClose,
  prompt,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignIn = () => {
    if (prompt && prompt.trim()) {
      try {
        sessionStorage.setItem("pending_trip_prompt", prompt.trim());
      } catch {}
      const target = encodeURIComponent(`/dashboard/create?prompt=${encodeURIComponent(prompt.trim())}`);
      router.push(`/auth/signin?callbackUrl=${target}`);
    } else {
      router.push("/auth/signin?callbackUrl=/dashboard/create");
    }
  };

  const handleRegister = () => {
    if (prompt && prompt.trim()) {
      try {
        sessionStorage.setItem("pending_trip_prompt", prompt.trim());
      } catch {}
      const target = encodeURIComponent(`/dashboard/create?prompt=${encodeURIComponent(prompt.trim())}`);
      router.push(`/auth/register?callbackUrl=${target}`);
    } else {
      router.push("/auth/register?callbackUrl=/dashboard/create");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative bg-card/95 border border-border/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Top Amber Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center pt-2">
            {/* Icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-soft">
              <Compass className="w-7 h-7" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-serif mb-2">
              Ready to Craft Your Trip?
            </h2>

            {/* Trip Prompt Preview Badge if user typed something */}
            {prompt && prompt.trim() && (
              <div className="my-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-700 dark:text-amber-300 max-w-xs mx-auto truncate">
                ✨ &quot;{prompt.trim()}&quot;
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Sign in or create a free account to generate this personalized itinerary, collaborate with friends, and save your memories.
            </p>

            {/* Actions */}
            <div className="space-y-3">
              {/* Sign In Button */}
              <button
                onClick={handleSignIn}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl transition-all shadow-soft flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In & Continue Trip
              </button>

              {/* Register Button */}
              <button
                onClick={handleRegister}
                className="w-full py-3 px-4 bg-muted/60 hover:bg-muted border border-border/80 text-foreground font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Create Free Account
              </button>

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full py-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium cursor-pointer"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
