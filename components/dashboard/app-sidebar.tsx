"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { format } from "date-fns"
import {
  LayoutDashboard,
  Map,
  Compass,
  Heart,
  Settings,
  Plus,
  LogOut,
  Globe,
  PanelLeftClose,
  CreditCard,
  User,
  Calendar,
  Receipt,
  MessageCircle,
} from "lucide-react"
import * as Flags from "country-flag-icons/react/3x2"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ItineraryData } from "@/app/components/types"
import { getCountryCode } from "@/lib/country-code"
import { cn } from "@/lib/utils"
import { useSubscription } from "@/app/hooks/useSubscription"

interface AppSidebarProps {
  initialTrips?: ItineraryData[]
}

export function AppSidebar({ initialTrips = [] }: AppSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { tier } = useSubscription()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  const [trips, setTrips] = useState<ItineraryData[]>(initialTrips)
  const [loadingTrips, setLoadingTrips] = useState(initialTrips.length === 0)

  // Fetch user's real trips
  useEffect(() => {
    let isMounted = true
    async function fetchTrips() {
      try {
        const res = await fetch("/api/itineraries?limit=5")
        if (!res.ok) return
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.data)) {
          setTrips(data.data)
        }
      } catch (err) {
        console.warn("Failed to load sidebar trips", err)
      } finally {
        if (isMounted) setLoadingTrips(false)
      }
    }

    if (session?.user) {
      fetchTrips()
    }
    return () => {
      isMounted = false
    }
  }, [session?.user])

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TR"

  const renderFlag = (destination?: string | null) => {
    const code = getCountryCode(destination)
    const FlagComponent = Flags[code as keyof typeof Flags]
    if (FlagComponent) {
      return (
        <FlagComponent className="size-4.5 shrink-0 rounded-[2px] shadow-xs object-cover overflow-hidden" />
      )
    }
    return <Globe className="size-4.5 text-muted-foreground shrink-0" />
  }

  const formatTripSubtitle = (trip: ItineraryData) => {
    const days = typeof trip.duration === "number" ? `${trip.duration} Days` : trip.duration || "Multi-Day"
    const dateStr = trip.startDate
      ? format(new Date(trip.startDate), "d MMM yyyy")
      : trip.createdAt
      ? format(new Date(trip.createdAt), "d MMM yyyy")
      : "Upcoming"
    return `${days}, ${dateStr}`
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar select-none">
      {/* 1. Header: Profile Block with Collapse Button (Centered in collapsed mode) */}
      <SidebarHeader
        className={cn(
          "border-b border-sidebar-border/60 transition-all duration-200",
          isCollapsed ? "p-2 py-3 flex flex-col items-center gap-2.5" : "p-4 pb-3"
        )}
      >
        {isCollapsed ? (
          <>
            {/* Centered Collapse Toggle in Icon Rail */}
            <button
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="size-8 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <PanelLeftClose className="size-4 rotate-180" />
            </button>

            {/* Centered Orange Plus Button in Icon Rail */}
            <Button
              asChild
              variant="primary"
              size="icon-round"
              className="size-9 rounded-full shadow-soft bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shrink-0"
              aria-label="New Trip"
            >
              <Link href="/dashboard/create">
                <Plus className="size-4 shrink-0" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="size-9 rounded-full ring-2 ring-primary/20 shrink-0">
                  {session?.user?.image && (
                    <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                  )}
                  <AvatarFallback className="bg-primary-soft text-primary font-bold text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-sm font-bold text-sidebar-foreground truncate">
                      {session?.user?.name || "Traveler"}
                    </span>
                    {tier && tier !== "FREE" && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs shrink-0">
                        {tier}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {tier && tier !== "FREE" ? `${tier} Traveler` : session?.user?.email || "Pro Traveler"}
                  </span>
                </div>
              </div>

              <button
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
                className="p-1.5 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors shrink-0 cursor-pointer"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>

            {/* Full-Width Orange "+ New Trip" Button */}
            <div className="pt-3">
              <Button
                asChild
                variant="primary"
                size="pill"
                className="w-full shadow-soft font-bold gap-2 text-sm justify-center"
              >
                <Link href="/dashboard/create">
                  <Plus className="size-4 shrink-0" />
                  <span>+ New Trip</span>
                </Link>
              </Button>
            </div>
          </>
        )}
      </SidebarHeader>

      {/* 2. Content: No Scrollbar, Smooth scrolling if needed */}
      <SidebarContent className="px-2 py-2.5 space-y-2 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-y-auto">
        {/* TRIPS Section */}
        <SidebarGroup className="p-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
              TRIPS
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {loadingTrips ? (
                <div className="space-y-2 px-3 py-1">
                  <Skeleton className="h-8 w-full rounded-xl" />
                  <Skeleton className="h-8 w-full rounded-xl" />
                </div>
              ) : trips.length === 0 ? (
                !isCollapsed && (
                  <div className="px-3 py-2 text-xs text-muted-foreground italic">
                    No trips planned yet. Click + New Trip to begin!
                  </div>
                )
              ) : (
                trips.map((trip) => {
                  const tripPath = `/itinerary/${trip.id}`
                  const isActive = pathname === tripPath

                  return (
                    <SidebarMenuItem key={trip.id} className={cn(isCollapsed && "flex justify-center")}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={trip.destination}
                        className={cn(
                          "rounded-xl transition-colors",
                          isCollapsed
                            ? "size-9 p-0 justify-center mx-auto"
                            : "h-auto py-2 px-3",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-foreground font-semibold shadow-soft-xs"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        )}
                      >
                        <Link
                          href={tripPath}
                          className={cn(
                            "flex items-center w-full",
                            isCollapsed ? "justify-center" : "gap-2.5"
                          )}
                        >
                          {renderFlag(trip.destination)}
                          {!isCollapsed && (
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs font-bold text-foreground truncate">
                                {trip.destination.split(",")[0]}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {formatTripSubtitle(trip)}
                              </span>
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* GENERAL Section */}
        <SidebarGroup className="p-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
              GENERAL
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname === "/dashboard"
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <LayoutDashboard className="size-4 text-primary shrink-0" />
                    {!isCollapsed && <span>Dashboard</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/itineraries"}
                  tooltip="My Itineraries"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname === "/dashboard/itineraries"
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/itineraries"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <Map className="size-4 text-primary shrink-0" />
                    {!isCollapsed && <span>My Itineraries</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/itineraries?filter=upcoming"}
                  tooltip="Upcoming Trips"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/itineraries?filter=upcoming"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <Calendar className="size-4 text-amber-500 shrink-0" />
                    {!isCollapsed && <span>Upcoming Trips</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* DISCOVER Section */}
        <SidebarGroup className="p-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
              WORLD OF TRAVELLERS
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname?.startsWith("/dashboard/marketplace")}
                  tooltip="Community Itineraries"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname?.startsWith("/dashboard/marketplace")
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/marketplace"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <Compass className="size-4 text-accent shrink-0" />
                    {!isCollapsed && <span>Community Itineraries</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname?.startsWith("/dashboard/chat")}
                  tooltip="Chat Room"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors justify-between",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname?.startsWith("/dashboard/chat")
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/chat"
                    className={cn(
                      "flex items-center justify-between w-full",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="size-4 text-emerald-500 shrink-0" />
                      {!isCollapsed && <span>Chat Room</span>}
                    </div>
                    {!isCollapsed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/favorites"}
                  tooltip="Favorites"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname === "/dashboard/favorites"
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/favorites"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <Heart className="size-4 text-red-500 shrink-0" />
                    {!isCollapsed && <span>Favorites</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ACCOUNT Section */}
        <SidebarGroup className="p-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
              ACCOUNT & BILLING
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/pricing"}
                  tooltip="Pricing & Plans"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname === "/dashboard/pricing"
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/pricing"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <CreditCard className="size-4 text-emerald-500 shrink-0" />
                    {!isCollapsed && <span>Pricing & Plans</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/billing"}
                  tooltip="Billing"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname === "/dashboard/billing"
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/billing"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <Receipt className="size-4 text-blue-500 shrink-0" />
                    {!isCollapsed && <span>Billing</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/profile"}
                  tooltip="Profile"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname === "/dashboard/profile"
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/profile"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <User className="size-4 text-primary shrink-0" />
                    {!isCollapsed && <span>Profile</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/settings"}
                  tooltip="Settings"
                  className={cn(
                    "rounded-xl text-sm font-medium transition-colors",
                    isCollapsed ? "size-9 p-0 justify-center mx-auto" : "px-3 py-2",
                    pathname === "/dashboard/settings"
                      ? "bg-sidebar-accent text-sidebar-foreground font-bold shadow-soft-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href="/dashboard/settings"
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center w-full" : "gap-2.5"
                    )}
                  >
                    <Settings className="size-4 text-muted-foreground shrink-0" />
                    {!isCollapsed && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Footer: Red Logout Button with safe bottom padding */}
      <SidebarFooter className="p-3 pb-8 sm:pb-4 border-t border-sidebar-border/60">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title="Logout"
          className={cn(
            "flex items-center rounded-xl text-destructive hover:bg-destructive/10 font-semibold text-xs transition-colors cursor-pointer",
            isCollapsed
              ? "size-9 p-0 justify-center mx-auto"
              : "w-full px-3 py-2 gap-2.5"
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
