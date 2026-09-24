"use client"

import * as React from "react"
import { useState } from "react"
import { Bell, Calendar, Sparkles, CloudSun, Check, Trash2 } from "lucide-react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
  icon: React.ComponentType<{ className?: string }>
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Trip Reminder",
    message: "Your upcoming journey is scheduled soon. Review your packing list.",
    time: "2 hours ago",
    unread: true,
    icon: Calendar,
  },
  {
    id: "notif-2",
    title: "AI Suggestion Added",
    message: "3 verified local cafes were added to your destination recommendations.",
    time: "Yesterday",
    unread: true,
    icon: Sparkles,
  },
  {
    id: "notif-3",
    title: "Weather Alert",
    message: "Mild temperatures and clear skies forecasted for your upcoming travel days.",
    time: "2 days ago",
    unread: false,
    icon: CloudSun,
  },
]

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="icon-round"
          size="icon-round"
          aria-label={`Notifications (${unreadCount} unread)`}
          className="relative text-foreground hover:bg-muted"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-card animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl p-0 shadow-soft-xl border border-border/80 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="tag-peach" className="text-[10px] px-2 py-0.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              <Bell className="size-8 mx-auto mb-2 opacity-30" />
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = notif.icon
              return (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start gap-3 transition-colors ${
                    notif.unread ? "bg-primary-soft/30 hover:bg-primary-soft/40" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="size-8 rounded-xl bg-card border border-border/80 text-primary flex items-center justify-center shrink-0 shadow-soft-xs mt-0.5">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-foreground truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-2.5 border-t border-border/80 bg-muted/20 flex justify-between">
            <Button
              variant="ghost"
              size="xs"
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive text-[11px] gap-1"
            >
              <Trash2 className="size-3" />
              <span>Clear all</span>
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setIsOpen(false)}
              className="text-foreground text-[11px]"
            >
              Done
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
