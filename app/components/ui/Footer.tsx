import React from "react";
import { Compass, Instagram, Twitter, Github } from "lucide-react";
import Link from "next/link";

/**
 * Footer Component
 */
export const Footer: React.FC = () => {
  return (
    <footer className="bg-card/60 backdrop-blur-sm pt-16 pb-10 border-t border-border/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-12 mb-16">
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Compass className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif tracking-widest text-lg sm:text-xl font-black uppercase text-foreground">
                Wander.ai
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Revolutionizing travel with artificial intelligence. Discover personalized itineraries, optimize budgets, and explore the world seamlessly.
            </p>
            <div className="flex gap-3 pt-2">
              {[Instagram, Twitter, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-muted/60 border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  aria-label="Social Link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Destinations", href: "/marketplace" },
                { label: "Trip Planner", href: "/dashboard/create" },
                { label: "Hotels", href: "/hotels" },
                { label: "Flights", href: "/flights" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4">
              Product & Legal
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Pricing", href: "/pricing" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
                { label: "Cookie Policy", href: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-border/60 text-muted-foreground text-xs gap-4">
          <p>© {new Date().getFullYear()} Wander AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Crafted with passion for global adventurers.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
