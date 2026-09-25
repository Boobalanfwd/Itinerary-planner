"use client";

import React, { useState } from "react";
import {
  Bell,
  Mail,
  Check,
  X,
  MessageSquare,
  Vote,
  Sparkles,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, PendingInvite, AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface NotificationInviteInboxProps {
  currentUserId?: string;
}

export function NotificationInviteInbox({ currentUserId }: NotificationInviteInboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    pendingInvites,
    unreadCount,
    markAsRead,
    respondToInvite,
  } = useNotifications(currentUserId);

  const [activeTab, setActiveTab] = useState<"invites" | "notifications">("invites");
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const handleAction = async (invite: PendingInvite, action: "ACCEPT" | "DECLINE") => {
    try {
      setRespondingId(invite.id);
      const res = await respondToInvite(invite.id, action);
      if (res?.success) {
        if (action === "ACCEPT") {
          toast.success(`You joined "${invite.itinerary.title || invite.itinerary.destination}"! 🎉`);
        } else {
          toast.info("Invite declined");
        }
      }
    } finally {
      setRespondingId(null);
    }
  };

  const totalBadges = unreadCount + pendingInvites.length;

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-4 h-4" />
        {totalBadges > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {totalBadges > 9 ? "9+" : totalBadges}
          </span>
        )}
      </Button>

      {/* Dropdown Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-card border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Activity & Invites
                </span>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead(undefined, true)}
                  className="text-[11px] font-semibold text-amber-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b text-xs font-semibold bg-muted/30">
              <button
                onClick={() => setActiveTab("invites")}
                className={cn(
                  "flex-1 py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                  activeTab === "invites"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Pending Invites</span>
                {pendingInvites.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    {pendingInvites.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={cn(
                  "flex-1 py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                  activeTab === "notifications"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Content Body */}
            <div className="max-h-80 overflow-y-auto p-3 space-y-2.5 text-xs">
              {activeTab === "invites" ? (
                pendingInvites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="font-medium text-foreground">No pending invites</p>
                    <p className="text-[11px]">When friends invite you to trips, they'll appear here live!</p>
                  </div>
                ) : (
                  pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/25 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={
                            invite.itinerary.coverImage ||
                            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150"
                          }
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-foreground text-xs truncate">
                            {invite.itinerary.title || invite.itinerary.destination}
                          </h4>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            <span>{invite.itinerary.destination}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Invited by <span className="font-semibold text-foreground">{invite.invitedByUser?.name || "A friend"}</span> as <span className="font-semibold text-amber-600">{invite.role}</span>
                          </div>
                        </div>
                      </div>

                      {/* Accept / Decline Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                        <Button
                          size="sm"
                          disabled={respondingId === invite.id}
                          onClick={() => handleAction(invite, "ACCEPT")}
                          className="flex-1 h-7 text-xs rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm font-semibold"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Accept Invite
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={respondingId === invite.id}
                          onClick={() => handleAction(invite, "DECLINE")}
                          className="h-7 text-xs rounded-lg border-border text-muted-foreground hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-medium text-foreground">All caught up!</p>
                  <p className="text-[11px]">New comments, mentions, and poll updates appear here.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={cn(
                      "p-2.5 rounded-xl border transition-colors cursor-pointer flex items-start gap-2.5",
                      notif.isRead
                        ? "bg-background border-border/50 text-muted-foreground"
                        : "bg-amber-500/5 border-amber-500/30 text-foreground font-medium"
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      {notif.type === "MENTION" ? (
                        <MessageSquare className="w-3.5 h-3.5" />
                      ) : notif.type === "POLL_CREATED" || notif.type === "POLL_DEADLINE" ? (
                        <Vote className="w-3.5 h-3.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground">{notif.title}</div>
                      <div className="text-[11px] text-muted-foreground leading-snug">{notif.message}</div>
                      <div className="text-[10px] text-muted-foreground/80 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
