"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Clock, DollarSign, Tag, FileText } from "lucide-react";
import { toast } from "sonner";
import { Activity, ActivityType } from "@/app/components/types";

interface EditActivityDialogProps {
  activity: Activity | null;
  dayNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Activity) => void;
}

export function EditActivityDialog({
  activity,
  dayNumber,
  isOpen,
  onClose,
  onSave,
}: EditActivityDialogProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<ActivityType>("sightseeing");
  const [duration, setDuration] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activity) {
      setTitle(activity.title || "");
      setTime(activity.time || "");
      setType(activity.type || "sightseeing");
      setDuration(activity.duration ? String(activity.duration) : "");
      setCost(activity.cost !== undefined && activity.cost !== null ? String(activity.cost) : "");
      setLocationName(activity.locationName || activity.location?.name || "");
      setAddress(activity.address || "");
      setDesc(activity.description || activity.desc || "");
      setNotes(activity.notes || "");
    }
  }, [activity]);

  if (!activity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedDuration =
        duration.trim() !== "" ? parseInt(duration, 10) : undefined;
      const parsedCost =
        cost.trim() !== "" ? parseFloat(cost) : undefined;

      const payload = {
        title: title.trim(),
        time: time.trim() || activity.time,
        type,
        duration:
          parsedDuration !== undefined && !isNaN(parsedDuration)
            ? parsedDuration
            : null,
        cost:
          parsedCost !== undefined && !isNaN(parsedCost)
            ? parsedCost
            : null,
        locationName: locationName.trim() || undefined,
        address: address.trim() || undefined,
        description: desc.trim(),
        notes: notes.trim() || undefined,
      };

      if (activity.id) {
        const res = await fetch(`/api/activities/${activity.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update stop");
        }
      }

      const updatedActivity: Activity = {
        ...activity,
        title: payload.title,
        time: payload.time,
        type: payload.type,
        duration: payload.duration ?? undefined,
        cost: payload.cost ?? undefined,
        locationName: payload.locationName,
        address: payload.address,
        description: payload.description,
        desc: payload.description,
        notes: payload.notes,
        location: activity.location
          ? {
              ...activity.location,
              name: payload.locationName || activity.location.name,
            }
          : payload.locationName
          ? {
              name: payload.locationName,
              lat: activity.locationLat || 0,
              lng: activity.locationLng || 0,
            }
          : undefined,
      };

      onSave(updatedActivity);
      toast.success("Activity details updated!");
      onClose();
    } catch (err: any) {
      console.error("Failed to save activity:", err);
      toast.error(err?.message || "Failed to save changes");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Day {dayNumber}
            </span>
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Stop</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the timing, place name, or details for this itinerary stop.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stop Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Louvre Museum & Courtyard"
              className="h-10 rounded-xl"
              required
            />
          </div>

          {/* Time & Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" /> Time
              </Label>
              <Input
                id="edit-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 09:30 AM"
                className="h-10 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-primary" /> Category
              </Label>
              <Select value={type} onValueChange={(val) => setType(val as ActivityType)}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="sightseeing">🏛️ Sightseeing</SelectItem>
                  <SelectItem value="food">🍽️ Food & Dining</SelectItem>
                  <SelectItem value="travel">✈️ Travel & Transit</SelectItem>
                  <SelectItem value="hotel">🏨 Accommodation</SelectItem>
                  <SelectItem value="nightlife">🍸 Nightlife & Shows</SelectItem>
                  <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                  <SelectItem value="ACTIVITIES">🧗 Activity / Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-duration" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Duration (minutes)
              </Label>
              <Input
                id="edit-duration"
                type="number"
                min="0"
                step="5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 120"
                className="h-10 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-cost" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Est. Cost ($)
              </Label>
              <Input
                id="edit-cost"
                type="number"
                min="0"
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 25"
                className="h-10 rounded-xl font-mono text-sm"
              />
            </div>
          </div>

          {/* Location Name & Address */}
          <div className="space-y-3 pt-1 border-t border-border/50">
            <div className="space-y-1.5">
              <Label htmlFor="edit-location" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Location / Venue Name
              </Label>
              <Input
                id="edit-location"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Musée du Louvre"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Address (Optional)
              </Label>
              <Input
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Rue de Rivoli, 75001 Paris"
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 pt-1 border-t border-border/50">
            <Label htmlFor="edit-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-primary" /> Description & Plan
            </Label>
            <Textarea
              id="edit-desc"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What to do, recommended route, what to see..."
              className="rounded-xl resize-none text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Traveler Notes & Tips
            </Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Book skip-the-line tickets in advance"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
