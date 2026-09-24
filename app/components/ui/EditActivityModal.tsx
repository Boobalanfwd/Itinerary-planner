"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Clock, Save } from "lucide-react";
import { Activity, ActivityType } from "../types";

interface EditActivityModalProps {
  activity: Activity;
  dayNumber: number;
  onSave: (updatedActivity: Activity) => void;
  onClose: () => void;
}

export const EditActivityModal: React.FC<EditActivityModalProps> = ({
  activity,
  dayNumber,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    time: activity.time,
    title: activity.title,
    desc: activity.desc,
    type: activity.type,
    locationName: activity.location?.name || "",
    locationLat: activity.location?.lat?.toString() || "",
    locationLng: activity.location?.lng?.toString() || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedActivity: Activity = {
      ...activity,
      time: formData.time,
      title: formData.title,
      desc: formData.desc,
      type: formData.type,
      location:
        formData.locationName && formData.locationLat && formData.locationLng
          ? {
              name: formData.locationName,
              lat: parseFloat(formData.locationLat),
              lng: parseFloat(formData.locationLng),
            }
          : undefined,
    };

    onSave(updatedActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-black/95 border-2 border-white/20 rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl shadow-emerald-500/20 animate-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-sm">
              {dayNumber}
            </span>
            Edit Activity
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Time */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Time
            </label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              placeholder="e.g., 09:00 AM"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Activity Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Visit Eiffel Tower"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.desc}
              onChange={(e) =>
                setFormData({ ...formData, desc: e.target.value })
              }
              placeholder="Describe the activity..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Activity Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as ActivityType,
                })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none transition-colors"
            >
              <option value="sightseeing">Sightseeing</option>
              <option value="food">Food</option>
              <option value="travel">Travel</option>
              <option value="hotel">Hotel</option>
              <option value="nightlife">Nightlife</option>
            </select>
          </div>

          {/* Location */}
          <div className="border-t border-white/10 pt-6">
            <label className="block text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Location (Optional)
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.locationName}
                onChange={(e) =>
                  setFormData({ ...formData, locationName: e.target.value })
                }
                placeholder="Location name (e.g., Eiffel Tower)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  value={formData.locationLat}
                  onChange={(e) =>
                    setFormData({ ...formData, locationLat: e.target.value })
                  }
                  placeholder="Latitude (e.g., 48.8584)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                />
                <input
                  type="number"
                  step="any"
                  value={formData.locationLng}
                  onChange={(e) =>
                    setFormData({ ...formData, locationLng: e.target.value })
                  }
                  placeholder="Longitude (e.g., 2.2945)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
