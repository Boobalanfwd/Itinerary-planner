"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Compass,
  ArrowLeft,
  RefreshCw,
  Home,
  ShieldAlert,
} from "lucide-react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorInfo = (err: string | null) => {
    switch (err) {
      case "Configuration":
        return {
          title: "Server Configuration Issue",
          description:
            "There was a problem communicating with the authentication server. Please check environment variables or try again.",
        };
      case "AccessDenied":
        return {
          title: "Access Denied",
          description:
            "You do not have permission to access this resource or complete this sign in.",
        };
      case "Verification":
        return {
          title: "Verification Token Expired",
          description:
            "The verification link or token has expired or has already been used. Please request a new code.",
        };
      case "OAuthSignin":
      case "OAuthCallback":
        return {
          title: "OAuth Connection Error",
          description:
            "We could not complete sign in with Google. Please try again or sign in with your email and password.",
        };
      case "OAuthAccountNotLinked":
        return {
          title: "Account Already Exists",
          description:
            "An account already exists with this email using a different sign-in method. Please sign in with your password.",
        };
      case "CredentialsSignin":
        return {
          title: "Invalid Credentials",
          description:
            "The email or password you entered is incorrect. Please verify your credentials and try again.",
        };
      case "SessionRequired":
        return {
          title: "Authentication Required",
          description:
            "You need to be signed in to view this trip or perform this action.",
        };
      default:
        return {
          title: "Authentication Error",
          description:
            "An unexpected authentication error occurred. Please try signing in again.",
        };
    }
  };

  const { title, description } = getErrorInfo(error);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-destructive/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4 text-destructive shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            {description}
          </p>
        </div>

        <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-xl dark:shadow-2xl">
          <CardContent className="p-6 sm:p-8 space-y-3">
            <Link href="/auth/signin" className="w-full block">
              <Button className="w-full h-11 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Signing In Again
              </Button>
            </Link>

            <Link href="/" className="w-full block">
              <Button variant="outline" className="w-full h-11 rounded-xl border-border/70 hover:bg-accent">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </Link>

            {error === "OAuthAccountNotLinked" && (
              <div className="pt-2 text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot your password? Reset it here →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground text-sm">Loading error details...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
