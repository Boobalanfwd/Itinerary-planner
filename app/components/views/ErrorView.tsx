import React from "react";
import { AlertCircle } from "lucide-react";

/**
 * Error View
 */
interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-black relative p-6 text-center">
    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 text-red-500">
      <AlertCircle className="w-8 h-8" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">Mission Failed</h2>
    <p className="text-gray-400 max-w-md mb-8">{message}</p>
    <button
      onClick={onRetry}
      className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-emerald-400 transition-colors"
    >
      Try Again
    </button>
  </div>
);
