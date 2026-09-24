"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Navigation,
  Trash2,
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react";
import { Activity } from "@/app/components/types";
import { toast } from "sonner";

interface ActivityActionsMenuProps {
  activity: Activity;
  dayNumber: number;
  onEdit: () => void;
  onDelete: (activityId: string) => Promise<void> | void;
}

export function ActivityActionsMenu({
  activity,
  dayNumber,
  onEdit,
  onDelete,
}: ActivityActionsMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDirections = () => {
    if (activity.locationLat && activity.locationLng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${activity.locationLat},${activity.locationLng}`,
        "_blank"
      );
    } else if (activity.address) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activity.address)}`,
        "_blank"
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          activity.locationName || activity.title
        )}`,
        "_blank"
      );
    }
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(activity.title);
    toast.success("Stop title copied to clipboard");
  };

  const handleConfirmDelete = async () => {
    if (!activity.id) return;
    setIsDeleting(true);
    try {
      await onDelete(activity.id);
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete activity");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-border/80 bg-background/95 backdrop-blur-md">
          <DropdownMenuItem
            onClick={onEdit}
            className="rounded-lg cursor-pointer flex items-center gap-2 py-2 text-xs font-medium text-foreground hover:text-primary focus:text-primary"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Stop
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDirections}
            className="rounded-lg cursor-pointer flex items-center gap-2 py-2 text-xs font-medium text-foreground hover:text-primary focus:text-primary"
          >
            <Navigation className="w-3.5 h-3.5 text-primary" />
            Get Directions
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCopyTitle}
            className="rounded-lg cursor-pointer flex items-center gap-2 py-2 text-xs font-medium text-foreground hover:text-foreground focus:text-foreground"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Name
          </DropdownMenuItem>

          {activity.bookingUrl && (
            <DropdownMenuItem
              onClick={() => window.open(activity.bookingUrl, "_blank")}
              className="rounded-lg cursor-pointer flex items-center gap-2 py-2 text-xs font-medium text-blue-500 hover:text-blue-600 focus:text-blue-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Booking Link
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-1 border-border/40" />

          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="rounded-lg cursor-pointer flex items-center gap-2 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Stop
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-border/80 bg-background shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Delete Stop from Day {dayNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to remove &quot;{activity.title}&quot;? Remaining activities in this day will be re-indexed automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Stop"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
