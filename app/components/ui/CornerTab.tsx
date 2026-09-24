"use client"

import * as React from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { User, LogIn, LayoutDashboard, Compass, Settings, LogOut, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function CornerTab() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated" && !!session?.user

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"

  return (
    <div className="fixed top-0 right-0 z-50 select-none">
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="User account menu"
              className="group flex items-center gap-2.5 bg-primary text-primary-foreground pl-5 pr-5 py-2.5 sm:pl-7 sm:pr-6 sm:py-3 rounded-bl-[2rem] sm:rounded-bl-[2.5rem] shadow-soft-lg hover:bg-primary-hover active:scale-[0.98] transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-7 sm:size-8 ring-2 ring-primary-foreground/30">
                {session.user?.image && (
                  <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                )}
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left leading-tight hidden xs:block">
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  {session.user?.name?.split(" ")[0] || "Traveler"}
                </span>
                <span className="text-[10px] text-primary-foreground/80 font-medium">
                  My Trips
                </span>
              </div>
              <ChevronDown className="size-3.5 text-primary-foreground/80 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-soft-xl mt-1">
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-foreground leading-none">
                  {session.user?.name || "Traveler"}
                </p>
                <p className="text-xs text-muted-foreground leading-none truncate">
                  {session.user?.email}
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
      ) : (
        <Link
          href="/auth/signin"
          className="group inline-flex items-center gap-2 bg-primary text-primary-foreground pl-5 pr-5 py-2.5 sm:pl-7 sm:pr-6 sm:py-3 rounded-bl-[2rem] sm:rounded-bl-[2.5rem] shadow-soft-lg hover:bg-primary-hover active:scale-[0.98] transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs sm:text-sm font-bold tracking-tight"
        >
          <User className="size-4 text-primary-foreground/90 group-hover:scale-110 transition-transform" />
          <span>Log in / Sign up</span>
          <LogIn className="size-3.5 opacity-75 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  )
}
