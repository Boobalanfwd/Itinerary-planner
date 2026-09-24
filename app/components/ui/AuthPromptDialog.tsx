import React from "react";
import { X, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Authentication Prompt Dialog
 * Shows when unauthenticated users try to generate an itinerary
 */
interface AuthPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  const handleRegister = () => {
    router.push("/auth/register");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-emerald-400" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Sign In Required
            </h2>

            {/* Description */}
            <p className="text-gray-400 text-center mb-8 leading-relaxed">
              Please sign in to your account to generate personalized AI
              itineraries and access all features.
            </p>

            {/* Actions */}
            <div className="space-y-3">
              {/* Sign In Button */}
              <button
                onClick={handleSignIn}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>

              {/* Register Button */}
              <button
                onClick={handleRegister}
                className="w-full px-6 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Create Account
              </button>

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full px-6 py-3 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
