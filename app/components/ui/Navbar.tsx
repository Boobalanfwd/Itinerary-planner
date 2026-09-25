"use client";

import React, { useState, useEffect } from "react";
import { Compass, Menu, X, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "../lib/utils";
import { ViewState } from "../types";
import { Button } from "@/components/ui/button";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { useSubscription } from "@/app/hooks/useSubscription";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationInviteInbox } from "@/components/collaboration/NotificationInviteInbox";
import Link from "next/link";

/**
 * Navigation Component
 */
interface NavbarProps {
  onViewChange: (view: ViewState) => void;
}

export function Navbar({ onViewChange }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const { tier } = useSubscription();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-background/85 backdrop-blur-md border-border/70 shadow-sm py-3.5"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2.5 select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Compass className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif tracking-widest text-lg sm:text-xl font-black uppercase text-foreground">
            Wander.ai
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {status === "authenticated" && (
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/marketplace"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>

          {/* Notifications and Trip Invites Inbox */}
          <NotificationInviteInbox currentUserId={session?.user?.id} />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User Section */}
          {status === "authenticated" && session?.user ? (
            <UserProfileDropdown user={session.user} subscriptionTier={tier} />
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-full px-5 font-semibold text-xs shadow-sm"
            >
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile: notifications + theme toggle + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <NotificationInviteInbox currentUserId={session?.user?.id} />
          <ThemeToggle />
          <button
            className="text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/80 p-6 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-4 shadow-xl">
          {status === "authenticated" && (
            <Link
              href="/dashboard"
              className="text-base font-bold text-primary hover:text-primary/80"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/marketplace"
            className="text-base font-medium text-foreground/80 hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Marketplace
          </Link>
          <Link
            href="/pricing"
            className="text-base font-medium text-foreground/80 hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Pricing
          </Link>

          {/* Mobile User Section */}
          {status === "authenticated" && session?.user ? (
            <div className="flex flex-col gap-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/60 border border-border/60">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {session.user.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full rounded-full gap-2 border-border/80 hover:bg-muted"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              asChild
              className="w-full rounded-full py-3 font-semibold text-sm shadow-md"
            >
              <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                Sign In / Get Started
              </Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
