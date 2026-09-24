"use client"

import * as React from "react"
import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AppTopbar } from "@/components/dashboard/app-topbar"
import { CommandSearch } from "@/components/dashboard/command-search"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Left Collapsible App Sidebar matching Image 2 */}
        <AppSidebar />

        {/* Main App Inset */}
        <SidebarInset className="flex flex-col min-w-0 bg-background">
          {/* Top Bar with Time-based Greeting & Controls */}
          <AppTopbar onSearchClick={() => setIsSearchOpen(true)} />

          {/* Page Content */}
          <div className="flex-1 w-full">
            {children}
          </div>
        </SidebarInset>

        {/* Global Command Palette (Cmd+K) */}
        <CommandSearch
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
        />
      </div>
    </SidebarProvider>
  )
}
