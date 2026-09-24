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
import {
  Loader2,
  Clock,
  DollarSign,
  Tag,
  FileText,
  Timer,
  MapPin,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Activity, ActivityType } from "@/app/components/types";
import { LocationPickerMap } from "./LocationPickerMap";

interface LocationValue {
  locationName: string;
  address: string;
  lat: number;
  lng: number;
}

interface AddStopDialogProps {
  dayId: string;
  dayNumber: number;
  dayTitle?: string;
  destination?: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: (activity: Activity) => void;
}

const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: "sightseeing", label: "Sightseeing", icon: "🏛️" },
  { value: "food", label: "Food & Drink", icon: "🍜" },
  { value: "shopping", label: "Shopping", icon: "🛍️" },
  { value: "sightseeing", label: "Activities", icon: "🎯" },
  { value: "travel", label: "Transportation", icon: "🚗" },
  { value: "hotel", label: "Accommodation", icon: "🏨" },
  { value: "nightlife", label: "Entertainment", icon: "🎭" },
];

const UNIQUE_ACTIVITY_TYPES: { value: string; label: string; icon: string }[] = [
  { value: "SIGHTSEEING", label: "Sightseeing", icon: "🏛️" },
  { value: "FOOD_DRINK", label: "Food & Drink", icon: "🍜" },
  { value: "SHOPPING", label: "Shopping", icon: "🛍️" },
  { value: "ACTIVITIES", label: "Activities", icon: "🎯" },
  { value: "TRANSPORTATION", label: "Transportation", icon: "🚗" },
  { value: "ACCOMMODATION", label: "Accommodation", icon: "🏨" },
  { value: "ENTERTAINMENT", label: "Entertainment", icon: "🎭" },
];

export function AddStopDialog({
  dayId,
  dayNumber,
  dayTitle,
  destination,
  isOpen,
  onClose,
  onAdded,
}: AddStopDialogProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState("SIGHTSEEING");
  const [duration, setDuration] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setTime("09:00");
      setType("SIGHTSEEING");
      setDuration("");
      setCost("");
      setDescription("");
      setNotes("");
      setLocation(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Stop title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedDuration = duration ? parseInt(duration, 10) : undefined;
      const parsedCost = cost ? parseFloat(cost) : undefined;

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        time: time || "09:00",
        type,
        duration: parsedDuration && !isNaN(parsedDuration) ? parsedDuration : undefined,
        cost: parsedCost !== undefined && !isNaN(parsedCost) ? parsedCost : undefined,
        notes: notes.trim() || undefined,
        locationName: location?.locationName || undefined,
        locationLat: location?.lat || undefined,
        locationLng: location?.lng || undefined,
        address: location?.address || undefined,
      };

      const res = await fetch(`/api/days/${dayId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 || data.code === "UNAUTHORIZED") {
          toast.error("Please sign in to add stops to this trip");
          onClose();
          return;
        }
        throw new Error(data.error || "Failed to add stop");
      }

      const raw = data.data;

      // Build frontend Activity shape from API response
      const newActivity: Activity = {
        id: raw.id,
        title: raw.title,
        description: raw.description || "",
        desc: raw.description || "",
        time: raw.time || "09:00",
        type: mapTypeToFrontend(raw.type),
        duration: raw.duration ?? undefined,
        cost: raw.cost ?? undefined,
        notes: raw.notes ?? undefined,
        locationName: raw.locationName ?? undefined,
        locationLat: raw.locationLat ?? undefined,
        locationLng: raw.locationLng ?? undefined,
        address: raw.address ?? undefined,
        position: raw.position ?? 0,
        location:
          raw.locationLat && raw.locationLng
            ? { name: raw.locationName || raw.title, lat: raw.locationLat, lng: raw.locationLng }
            : undefined,
      };

      toast.success(`"${newActivity.title}" added to Day ${dayNumber}`);
      onAdded(newActivity);
      onClose();
    } catch (err: unknown) {
      console.error("Add stop error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add stop");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Plus className="w-5 h-5 text-primary" />
            Add Stop to Day {dayNumber}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {dayTitle ? `"${dayTitle}"` : `Day ${dayNumber}`} • Add a custom stop with location, time, and details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="stop-title" className="text-sm font-semibold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              Stop Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stop-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senso-ji Temple, Tokyo Ramen Street..."
              className="rounded-xl"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="stop-desc" className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Description
            </Label>
            <Textarea
              id="stop-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you do here? Add details, tips, opening hours..."
              className="rounded-xl resize-none min-h-[80px]"
            />
          </div>

          {/* Category, Time, Duration, Cost — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Category
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIQUE_ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <Label htmlFor="stop-time" className="text-sm font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Start Time
              </Label>
              <Input
                id="stop-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label htmlFor="stop-duration" className="text-sm font-semibold flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-primary" />
                Duration (minutes)
              </Label>
              <Input
                id="stop-duration"
                type="number"
                min="5"
                max="1440"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 60"
                className="rounded-xl"
              />
            </div>

            {/* Cost */}
            <div className="space-y-1.5">
              <Label htmlFor="stop-cost" className="text-sm font-semibold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                Estimated Cost ($)
              </Label>
              <Input
                id="stop-cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 25"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Location Picker Map */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Location <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <LocationPickerMap
              initialDestination={destination}
              value={location}
              onChange={setLocation}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="stop-notes" className="text-sm font-semibold text-muted-foreground">
              Private Notes (optional)
            </Label>
            <Input
              id="stop-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Booking reference, reminders, tips..."
              className="rounded-xl"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="rounded-xl gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding Stop...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Stop
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function mapTypeToFrontend(prismaType?: string): ActivityType {
  const t = (prismaType || "").toUpperCase();
  if (t === "FOOD_DRINK" || t === "RESTAURANT") return "food";
  if (t === "ACCOMMODATION") return "hotel";
  if (t === "TRANSPORTATION" || t === "FLIGHT") return "travel";
  if (t === "ENTERTAINMENT") return "nightlife";
  if (t === "SHOPPING") return "shopping";
  return "sightseeing";
}
