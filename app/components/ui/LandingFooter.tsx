"use client"

import * as React from "react"
import Link from "next/link"
import { Compass, Instagram, Twitter, Github, Heart } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="border-t border-border/80 bg-card/60 pb-28 sm:pb-24 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-soft-xs">
                <Compass className="size-4" />
              </div>
              <span className="font-serif-logo text-2xl font-bold tracking-wider text-foreground">
                WANDER.AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Next-generation AI travel companion. Turn vague travel aspirations into
              geographically sound, budget-conscious day-by-day itineraries.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <Twitter className="size-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <Instagram className="size-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <Github className="size-4" />
              </a>
            </div>
          </div>

          {/* Explore Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/marketplace" className="hover:text-foreground transition-colors">
                  Travel Marketplace
                </Link>
              </li>
              <li>
                <Link href="/dashboard/itineraries" className="hover:text-foreground transition-colors">
                  My Trips
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link href="/dashboard/create" className="hover:text-foreground transition-colors">
                  Trip Creation Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/60 text-xs">
                  Cookie Preferences Managed Automatically
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Wander.AI Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="size-3 text-red-500 fill-current" /> for travelers worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}
