"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import {
  Compass,
  LayoutDashboard,
  Map,
  Plus,
  Settings,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  MapPin,
  CreditCard,
  User,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { ItineraryData } from "@/app/components/types"

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trips?: ItineraryData[]
}

export function CommandSearch({ open, onOpenChange, trips = [] }: CommandSearchProps) {
  const router = useRouter()
  const { setTheme, theme } = useTheme()

  const [fetchedTrips, setFetchedTrips] = useState<ItineraryData[]>([])

  // Register global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  // Fetch recent trips when dialog opens if not provided via props
  useEffect(() => {
    if (open && trips.length === 0) {
      fetch("/api/itineraries?limit=10")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && Array.isArray(data.data)) {
            setFetchedTrips(data.data)
          }
        })
        .catch(() => {})
    }
  }, [open, trips.length])

  const effectiveTrips = trips.length > 0 ? trips : fetchedTrips

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Wander.AI"
      description="Search trips, destinations, navigation and actions"
    >
      <CommandInput placeholder="Type a command or search trips..." />
      <CommandList className="max-h-[360px]">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* 1. Quick Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <LayoutDashboard className="size-4 text-primary" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/create"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <Plus className="size-4 text-accent" />
            <span>Create New Trip</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/itineraries"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <Map className="size-4 text-primary" />
            <span>My Itineraries</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/marketplace"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <Compass className="size-4 text-accent" />
            <span>Travel Marketplace</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/pricing"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <CreditCard className="size-4 text-emerald-500" />
            <span>Pricing & Plans</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/profile"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <User className="size-4 text-primary" />
            <span>My Profile</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <Settings className="size-4 text-muted-foreground" />
            <span>Settings & Preferences</span>
          </CommandItem>
        </CommandGroup>

        {/* 2. User Trips Search */}
        {effectiveTrips.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Your Trips">
              {effectiveTrips.map((trip) => (
                <CommandItem
                  key={trip.id}
                  onSelect={() =>
                    runCommand(() => router.push(`/itinerary/${trip.id}`))
                  }
                  className="flex items-center justify-between cursor-pointer py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">
                      {trip.destination}
                    </span>
                    {trip.title && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        • {trip.title}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {trip.duration}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* 3. Actions */}
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))
            }
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            {theme === "dark" ? (
              <Sun className="size-4 text-amber-400" />
            ) : (
              <Moon className="size-4 text-indigo-400" />
            )}
            <span>Toggle Theme (Light / Dark)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/pricing"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <CreditCard className="size-4 text-accent" />
            <span>Upgrade to PRO</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => signOut({ callbackUrl: "/" }))}
            className="flex items-center gap-2 cursor-pointer py-2.5 text-destructive"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
