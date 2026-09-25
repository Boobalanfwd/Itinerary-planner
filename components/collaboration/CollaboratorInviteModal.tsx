"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  UserPlus,
  Shield,
  Copy,
  Check,
  Mail,
  Trash2,
  RefreshCw,
  Sliders,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface CollaboratorInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle?: string;
  isOwner: boolean;
  onInviteSent?: (collaborator: any, invitedUserId?: string, notification?: any) => void;
}

export function CollaboratorInviteModal({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  isOwner,
  onInviteSent,
}: CollaboratorInviteModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"TRAVELER" | "EDITOR" | "VIEWER">("TRAVELER");
  const [rolePerUser, setRolePerUser] = useState<Record<string, "TRAVELER" | "EDITOR" | "VIEWER">>({});

  // Active collaborators and pending invites
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [owner, setOwner] = useState<any>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Section override dialog state
  const [activeSectionOverrideUser, setActiveSectionOverrideUser] = useState<any | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({
    FOOD_DRINK: "TRAVELER",
    FLIGHT: "VIEWER",
    ACCOMMODATION: "TRAVELER",
    ACTIVITIES: "TRAVELER",
  });

  // Load collaborators and pending invites
  const loadCollaborators = async () => {
    try {
      setIsLoadingList(true);
      const res = await fetch(`/api/collaborators?tripId=${tripId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCollaborators(data.collaborators || []);
          setOwner(data.owner || null);
        }
      }
    } catch (e) {
      console.error("Failed to load collaborators:", e);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
    }
  }, [isOpen, tripId]);

  useEffect(() => {
    if (isOpen) {
      fetchSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, isOpen, tripId]);

  // In-portal traveler search
  const fetchSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const res = await fetch(`/api/users/search?tripId=${tripId}&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.users || []);
        }
      }
    } catch (e) {
      console.warn("Search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Send in-portal invite
  const handleSendInvite = async (targetUser: any) => {
    const role = rolePerUser[targetUser.id] || selectedRole;
    try {
      const res = await fetch("/api/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          targetUserId: targetUser.id,
          role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          data.message ||
            `Invite sent to ${targetUser.name || targetUser.username} as ${role}!`
        );
        onInviteSent?.(data.collaborator, targetUser.id, data.notification);
        loadCollaborators();
        fetchSearch(debouncedSearchQuery);
      } else {
        toast.error(data.error || "Failed to send invite");
      }
    } catch (err) {
      toast.error("Error sending invite");
    }
  };

  // Send external email invite
  const [emailInput, setEmailInput] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const handleSendEmailInvite = async () => {
    if (!emailInput.trim()) return;
    try {
      setIsSendingEmail(true);
      const res = await fetch("/api/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          email: emailInput.trim(),
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          data.message || `Invitation sent and email delivered to ${emailInput}!`
        );
        setEmailInput("");
        loadCollaborators();
      } else {
        toast.error(data.error || "Failed to send email invite");
      }
    } catch {
      toast.error("Failed to send email invite");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Resend invitation email
  const handleResendInvite = async (collaborator: any) => {
    try {
      const res = await fetch("/api/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          targetUserId: collaborator.userId,
          email: collaborator.user?.email || collaborator.invitedEmail,
          role: collaborator.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Invitation email resent!");
        loadCollaborators();
      } else {
        toast.error(data.error || "Failed to resend invite");
      }
    } catch {
      toast.error("Failed to resend invite");
    }
  };

  // Update role
  const handleUpdateRole = async (collaboratorId: string, newRole: string) => {
    try {
      const res = await fetch("/api/collaborators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId, role: newRole }),
      });
      if (res.ok) {
        toast.success("Role updated");
        loadCollaborators();
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  // Revoke or remove
  const handleRemove = async (collaboratorId: string, name: string) => {
    try {
      const res = await fetch(`/api/collaborators?id=${collaboratorId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Removed ${name}`);
        loadCollaborators();
      }
    } catch {
      toast.error("Failed to remove collaborator");
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/itinerary/${tripId}?invite=true`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Save section overrides
  const handleSaveSectionOverrides = async () => {
    if (!activeSectionOverrideUser) return;
    try {
      await fetch("/api/collaborators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaboratorId: activeSectionOverrideUser.id,
          sectionOverrides: overrides,
        }),
      });
      toast.success("Section permissions updated");
      setActiveSectionOverrideUser(null);
      loadCollaborators();
    } catch {
      toast.error("Failed to save section permissions");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl bg-card border shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Collaborate on {tripTitle || "Trip"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Plan in real time with friends and family. Changes sync live with sub-second latency.
              </DialogDescription>
            </div>
          </div>

          {/* Quick share link bar */}
          <div className="mt-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-xl border border-border/70">
            <span className="text-xs font-medium text-muted-foreground px-2">Share link:</span>
            <input
              type="text"
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}/itinerary/${tripId}` : ""}
              className="text-xs text-foreground bg-transparent flex-1 outline-none truncate"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyShareLink}
              className="h-7 text-xs rounded-lg border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedLink ? "Copied" : "Copy Link"}
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* SECTION 1: IN-PORTAL TRAVELER SEARCH */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-500" />
                Find Travelers on Wander.AI
              </label>
              <span className="text-[11px] text-muted-foreground">Instant in-portal invite</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search registered travelers by name, @username, or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 h-10 rounded-xl bg-background border-border/80 text-sm focus-visible:ring-amber-500"
              />
            </div>

            {/* Traveler Profile Cards */}
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {isSearching && (
                <div className="text-center py-4 text-xs text-muted-foreground">Searching travelers...</div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No registered travelers found. You can still invite by email below!
                </div>
              )}

              {searchResults.map((user) => {
                const userRole = rolePerUser[user.id] || "TRAVELER";
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                        alt={user.name || "Traveler"}
                        className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {user.name || "Traveler"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.username ? `@${user.username}` : user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.isAlreadyCollaborator ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Joined
                        </span>
                      ) : (
                        <>
                          <select
                            value={userRole}
                            onChange={(e) =>
                              setRolePerUser((prev) => ({
                                ...prev,
                                [user.id]: e.target.value as any,
                              }))
                            }
                            className="text-xs bg-background border rounded-lg px-2 py-1 outline-none text-foreground font-medium"
                          >
                            <option value="TRAVELER">Traveler (Full Edit)</option>
                            <option value="EDITOR">Editor (Items/Votes)</option>
                            <option value="VIEWER">Viewer (Read-only)</option>
                          </select>

                          <Button
                            size="sm"
                            onClick={() => handleSendInvite(user)}
                            className="h-8 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
                          >
                            Send Invite
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: EMAIL INVITE FALLBACK */}
          <div className="pt-2 border-t">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              Invite Friends via Email
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="friend@example.com"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendEmailInvite();
                  }
                }}
                className="h-9 rounded-xl text-xs bg-background"
              />
              <Button
                size="sm"
                onClick={handleSendEmailInvite}
                disabled={isSendingEmail || !emailInput.trim()}
                className="h-9 text-xs rounded-xl px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-1.5 cursor-pointer"
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    Send Email Invite
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              An invitation email with trip details, assigned role, and a one-click join link will be sent directly to their inbox.
            </p>
          </div>

          {/* SECTION 3: COLLABORATOR LIST & ROLE MANAGEMENT */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                Collaborators & Invites ({collaborators.length + (owner ? 1 : 0)})
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCollaborators}
                className="h-6 text-[11px] text-muted-foreground"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              {/* Trip Owner */}
              {owner && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <img
                      src={owner.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${owner.userId}`}
                      alt={owner.user?.name || "Owner"}
                      className="w-9 h-9 rounded-full object-cover border border-amber-500/50"
                    />
                    <div>
                      <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        {owner.user?.name || "Trip Owner"}
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          Owner
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {owner.user?.username ? `@${owner.user.username}` : owner.user?.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Full Access</span>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((c) => {
                const statusColor =
                  c.inviteStatus === "ACCEPTED"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : c.inviteStatus === "PENDING"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`}
                        alt={c.user?.name || "Collaborator"}
                        className="w-9 h-9 rounded-full object-cover border"
                      />
                      <div>
                        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                          {c.user?.name || "Traveler"}
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                              statusColor
                            )}
                          >
                            {c.inviteStatus}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.user?.username ? `@${c.user.username}` : c.user?.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <select
                            value={c.role}
                            onChange={(e) => handleUpdateRole(c.id, e.target.value)}
                            className="text-xs bg-background border rounded-lg px-2 py-1 text-foreground font-medium outline-none"
                          >
                            <option value="TRAVELER">Traveler</option>
                            <option value="EDITOR">Editor</option>
                            <option value="VIEWER">Viewer</option>
                          </select>

                          {/* Section Overrides Button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setActiveSectionOverrideUser(c);
                              if (c.sectionOverrides) setOverrides(c.sectionOverrides);
                            }}
                            title="Per-section permission overrides"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </Button>

                          {/* Resend Email Invite button (for pending invites) */}
                          {c.inviteStatus === "PENDING" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleResendInvite(c)}
                              title="Resend invitation email"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* Revoke / Remove button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemove(c.id, c.user?.name || "Collaborator")}
                            title={c.inviteStatus === "PENDING" ? "Revoke invite" : "Remove member"}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground px-2 py-1 rounded-lg bg-muted">
                          {c.role}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION OVERRIDE MODAL SUB-VIEW */}
        {activeSectionOverrideUser && (
          <div className="p-5 border-t bg-amber-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-foreground">
                Section Permissions for {activeSectionOverrideUser.user?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSectionOverrideUser(null)}
                className="h-6 text-xs"
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              {["FOOD_DRINK", "FLIGHT", "ACCOMMODATION", "ACTIVITIES"].map((sec) => (
                <div key={sec} className="flex items-center justify-between bg-card p-2 rounded-lg border">
                  <span className="font-medium text-muted-foreground capitalize">
                    {sec.toLowerCase().replace("_", " ")}
                  </span>
                  <select
                    value={overrides[sec] || "TRAVELER"}
                    onChange={(e) =>
                      setOverrides((prev) => ({ ...prev, [sec]: e.target.value }))
                    }
                    className="text-[11px] bg-background border rounded px-1.5 py-0.5"
                  >
                    <option value="TRAVELER">Edit</option>
                    <option value="VIEWER">View Only</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={handleSaveSectionOverrides} className="text-xs h-8 bg-amber-500 text-white">
                Save Section Overrides
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
