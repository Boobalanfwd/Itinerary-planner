"use client"

import * as React from "react"
import { useMemo } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Search, User, Settings, LayoutDashboard, Compass, LogOut } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsPopover } from "@/components/dashboard/notifications-popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AppTopbarProps {
  onSearchClick: () => void
}

export function AppTopbar({ onSearchClick }: AppTopbarProps) {
  const { data: session } = useSession()

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "Good morning"
    if (hour >= 12 && hour < 17) return "Good afternoon"
    return "Good evening"
  }, [])

  const firstName = session?.user?.name?.split(" ")[0] || "Traveler"

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TR"

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-8 py-3.5 border-b border-border/80 bg-background/80 backdrop-blur-xl transition-colors select-none">
      {/* Left: Mobile Trigger + Time-based Greeting */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="p-2 rounded-xl text-foreground hover:bg-muted" />

        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-tight flex items-center gap-1.5">
            <span>{greeting}, {firstName}!</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Ready to plan your next adventure?
          </p>
        </div>
      </div>

      {/* Right: Round Icon Buttons & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1. Search Button (Opens Command Palette) */}
        <Button
          variant="icon-round"
          size="icon-round"
          onClick={onSearchClick}
          aria-label="Search trips (Cmd+K)"
          className="text-foreground hover:bg-muted"
        >
          <Search className="size-4" />
        </Button>

        {/* 2. Notifications with Red Dot */}
        <NotificationsPopover />

        {/* 3. Theme Toggle (Light/Dark mode) */}
        <ThemeToggle />

        {/* 4. User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="User profile menu"
              className="rounded-full ring-2 ring-transparent hover:ring-primary/40 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
            >
              <Avatar className="size-9 rounded-full ring-1 ring-border shadow-soft-xs">
                {session?.user?.image && (
                  <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                )}
                <AvatarFallback className="bg-primary-soft text-primary font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-soft-xl mt-1">
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-foreground leading-none">
                  {session?.user?.name || "Traveler"}
                </p>
                <p className="text-xs text-muted-foreground leading-none truncate">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer rounded-xl py-2">
                <LayoutDashboard className="size-4 text-primary" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/itineraries" className="flex items-center gap-2 cursor-pointer rounded-xl py-2">
                <Compass className="size-4 text-accent" />
                <span>My Itineraries</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer rounded-xl py-2">
                <Settings className="size-4 text-muted-foreground" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive rounded-xl py-2"
            >
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
