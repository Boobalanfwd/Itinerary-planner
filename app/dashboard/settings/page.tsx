"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, Lock, Globe, Moon, LogOut, Trash2, User, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    publicProfile: false,
    darkMode: true,
  });

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <div className="py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="border-b border-border/60 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Preferences
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account credentials, notifications, and security preferences.
          </p>
        </div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Account Information
          </h2>
          <div className="bg-card/85 backdrop-blur-sm border border-border/80 rounded-3xl p-6 sm:p-7 shadow-soft space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="w-full p-3.5 bg-muted/50 border border-border/70 rounded-2xl text-muted-foreground text-sm font-mono cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={session?.user?.name || ""}
                className="w-full p-3.5 bg-background border border-border/80 rounded-2xl text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Notifications & Privacy
          </h2>
          <div className="bg-card/85 backdrop-blur-sm border border-border/80 rounded-3xl p-6 sm:p-7 shadow-soft space-y-5 divide-y divide-border/50">
            <div className="pb-4">
              <SettingToggle
                icon={Bell}
                label="Push Notifications"
                description="Receive updates about your trip schedules and flight changes"
                checked={settings.notifications}
                onChange={(checked) =>
                  setSettings({ ...settings, notifications: checked })
                }
              />
            </div>
            <div className="py-4">
              <SettingToggle
                icon={Globe}
                label="Email Digest"
                description="Receive weekly curated destination ideas and travel offers"
                checked={settings.emailUpdates}
                onChange={(checked) =>
                  setSettings({ ...settings, emailUpdates: checked })
                }
              />
            </div>
            <div className="py-4">
              <SettingToggle
                icon={Lock}
                label="Public Profile"
                description="Allow fellow travelers to view your public itineraries"
                checked={settings.publicProfile}
                onChange={(checked) =>
                  setSettings({ ...settings, publicProfile: checked })
                }
              />
            </div>
            <div className="pt-4">
              <SettingToggle
                icon={Moon}
                label="Dark Theme"
                description="Adapts to your operating system or selected theme toggle"
                checked={settings.darkMode}
                onChange={(checked) =>
                  setSettings({ ...settings, darkMode: checked })
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-bold text-destructive flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Danger Zone
          </h2>
          <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 sm:p-7 shadow-soft space-y-4">
            <p className="text-xs text-muted-foreground">
              Signing out will end your active session on this device. Deleting your account will permanently purge all itineraries, preferences, and saved locations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="rounded-full px-5 py-2.5 font-semibold text-xs gap-2 border-border/80 hover:bg-muted"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
              <Button
                variant="destructive"
                onClick={() => alert("Account deletion requires contacting support.")}
                className="rounded-full px-5 py-2.5 font-semibold text-xs gap-2 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface SettingToggleProps {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-foreground font-semibold text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-primary" : "bg-muted border border-border"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
};
