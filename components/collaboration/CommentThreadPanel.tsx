"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  Circle,
  Paperclip,
  Smile,
  AtSign,
  CornerDownRight,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CommentThreadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  anchorType: "activity" | "place" | "day" | "itinerary";
  anchorId: string;
  anchorTitle: string;
  currentUser: any;
  collaborators: any[];
  onCommentAdded?: (comment: any, mentionedUserIds: string[]) => void;
  onCommentResolved?: (commentId: string, resolved: boolean) => void;
  onCommentReacted?: (commentId: string, emoji: string, reactions: any[]) => void;
}

const COMMON_EMOJIS = ["👍", "❤️", "🔥", "🎉", "💡"];

export function CommentThreadPanel({
  isOpen,
  onClose,
  tripId,
  anchorType,
  anchorId,
  anchorTitle,
  currentUser,
  collaborators = [],
  onCommentAdded,
  onCommentResolved,
  onCommentReacted,
}: CommentThreadPanelProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);

  // Mention dropdown
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  // Attachments
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState<"photo" | "link">("photo");

  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // Load comments
  const loadComments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/comments?tripId=${tripId}&anchorType=${anchorType}&anchorId=${anchorId}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setComments(data.comments || []);
        }
      }
    } catch (e) {
      console.error("Error loading comments:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tripId && anchorId) {
      loadComments();
    }
  }, [isOpen, tripId, anchorType, anchorId]);

  // Handle typing & mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const lastWord = val.split(" ").pop() || "";
    if (lastWord.startsWith("@") && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertMention = (user: any) => {
    const words = inputText.split(" ");
    words.pop();
    words.push(`@${user.username || user.name}`);
    setInputText(words.join(" ") + " ");
    setShowMentionMenu(false);
  };

  // Submit comment
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    // Detect mentioned users
    const mentionedUserIds: string[] = [];
    for (const c of collaborators) {
      const u = c.user;
      if (
        u &&
        (inputText.includes(`@${u.username}`) || inputText.includes(`@${u.name}`))
      ) {
        mentionedUserIds.push(u.id);
      }
    }

    const attachments = attachmentUrl.trim()
      ? [{ type: attachmentType, url: attachmentUrl.trim(), name: "Attachment" }]
      : [];

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          anchorType,
          anchorId,
          text: inputText.trim(),
          parentId: replyToId,
          attachments,
          mentionedUserIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInputText("");
        setReplyToId(null);
        setAttachmentUrl("");
        setShowAttachInput(false);
        onCommentAdded?.(data.comment, mentionedUserIds);
        loadComments();
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      }
    } catch {
      toast.error("Failed to post comment");
    }
  };

  // Toggle resolve
  const handleToggleResolve = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/resolve`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, resolved: data.comment.resolved } : c
          )
        );
        onCommentResolved?.(commentId, data.comment.resolved);
      }
    } catch {
      toast.error("Error resolving comment");
    }
  };

  // Emoji reaction
  const handleReact = async (commentId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, reactions: data.reactions } : c
          )
        );
        onCommentReacted?.(commentId, emoji, data.reactions);
      }
    } catch {
      toast.error("Error reacting to comment");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{anchorTitle}</h3>
            <span className="text-[11px] text-muted-foreground uppercase font-semibold">
              {anchorType} Discussion
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="text-center py-8 text-xs text-muted-foreground">Loading comments...</div>
        )}

        {!isLoading && comments.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ask your travel crew what they think, tag them with @, or leave notes!
            </p>
          </div>
        )}

        {comments.map((comment) => (
          <div
            key={comment.id}
            className={cn(
              "p-3 rounded-2xl border transition-all text-xs",
              comment.resolved
                ? "bg-muted/40 border-muted-foreground/20 opacity-75"
                : "bg-background border-border/80 shadow-sm"
            )}
          >
            {/* Author row & Resolve toggle */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img
                  src={
                    comment.user?.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`
                  }
                  alt={comment.user?.name || "Traveler"}
                  className="w-6 h-6 rounded-full object-cover border"
                />
                <span className="font-bold text-foreground">
                  {comment.user?.name || "Traveler"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Resolve toggle */}
              <button
                onClick={() => handleToggleResolve(comment.id)}
                title={comment.resolved ? "Re-open discussion" : "Mark as resolved"}
                className={cn(
                  "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors",
                  comment.resolved
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-emerald-600"
                )}
              >
                {comment.resolved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolved</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </>
                )}
              </button>
            </div>

            {/* Comment Text */}
            <p
              className={cn(
                "text-foreground text-xs leading-relaxed",
                comment.resolved && "line-through text-muted-foreground"
              )}
            >
              {comment.text}
            </p>

            {/* Attachments */}
            {comment.attachments && Array.isArray(comment.attachments) && (
              <div className="mt-2 space-y-1">
                {comment.attachments.map((att: any, idx: number) => (
                  <div key={idx} className="mt-1">
                    {att.type === "photo" ? (
                      <img
                        src={att.url}
                        alt="attachment"
                        className="rounded-lg max-h-36 object-cover border shadow-sm"
                      />
                    ) : (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {att.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Emoji Reactions & Reply Bar */}
            <div className="mt-2 pt-2 border-t flex items-center justify-between">
              {/* Existing reactions */}
              <div className="flex items-center gap-1 flex-wrap">
                {COMMON_EMOJIS.map((emoji) => {
                  const reactionsWithEmoji = (comment.reactions || []).filter(
                    (r: any) => r.emoji === emoji
                  );
                  const hasReacted = reactionsWithEmoji.some(
                    (r: any) => r.userId === currentUser?.id
                  );

                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReact(comment.id, emoji)}
                      className={cn(
                        "text-[11px] px-1.5 py-0.5 rounded-full border transition-all flex items-center gap-1",
                        hasReacted
                          ? "bg-amber-500/20 border-amber-500/50 font-bold"
                          : "bg-muted/40 border-transparent hover:bg-muted"
                      )}
                    >
                      <span>{emoji}</span>
                      {reactionsWithEmoji.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {reactionsWithEmoji.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reply button */}
              <button
                onClick={() => setReplyToId(comment.id)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" />
                Reply
              </button>
            </div>

            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 pl-3 border-l-2 border-amber-500/30 space-y-2">
                {comment.replies.map((reply: any) => (
                  <div key={reply.id} className="bg-muted/30 p-2 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 mb-1 font-semibold text-foreground">
                      <img
                        src={
                          reply.user?.image ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId}`
                        }
                        alt="User"
                        className="w-4 h-4 rounded-full"
                      />
                      <span>{reply.user?.name || "Traveler"}</span>
                    </div>
                    <p className="text-foreground">{reply.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>

      {/* Mention helper menu */}
      {showMentionMenu && (
        <div className="bg-popover border-t p-2 max-h-36 overflow-y-auto space-y-1 shadow-lg">
          <div className="text-[10px] uppercase font-bold text-muted-foreground px-2">
            Mention Collaborator
          </div>
          {collaborators
            .filter((c) =>
              c.user?.name?.toLowerCase().includes(mentionQuery || "") ||
              c.user?.username?.toLowerCase().includes(mentionQuery || "")
            )
            .map((c) => (
              <button
                key={c.id}
                onClick={() => insertMention(c.user)}
                className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted text-xs text-foreground"
              >
                <img
                  src={c.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`}
                  alt=""
                  className="w-5 h-5 rounded-full"
                />
                <span className="font-medium">{c.user?.name}</span>
                <span className="text-[11px] text-muted-foreground">@{c.user?.username}</span>
              </button>
            ))}
        </div>
      )}

      {/* Attachment input row */}
      {showAttachInput && (
        <div className="p-2 border-t bg-muted/30 flex items-center gap-2 text-xs">
          <select
            value={attachmentType}
            onChange={(e) => setAttachmentType(e.target.value as any)}
            className="bg-background border rounded px-1.5 py-1 text-[11px]"
          >
            <option value="photo">Photo URL</option>
            <option value="link">Web Link</option>
          </select>
          <Input
            placeholder="Paste image or link URL..."
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            className="h-8 text-xs bg-background"
          />
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-card flex flex-col gap-2">
        {replyToId && (
          <div className="flex items-center justify-between text-[11px] bg-amber-500/10 px-2.5 py-1 rounded-lg text-amber-700 dark:text-amber-400">
            <span>Replying to thread...</span>
            <button type="button" onClick={() => setReplyToId(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            placeholder={`Comment on ${anchorTitle}... (@ to tag)`}
            value={inputText}
            onChange={handleInputChange}
            className="h-9 rounded-xl text-xs bg-background focus-visible:ring-amber-500"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachInput(!showAttachInput)}
            title="Attach photo or link"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-amber-600"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
