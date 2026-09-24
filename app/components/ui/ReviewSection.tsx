"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, MessageSquare, Trash2, Edit, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username?: string;
    image?: string;
  };
}

interface ReviewSectionProps {
  itineraryId: string;
  averageRating?: number;
  reviewCount?: number;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  itineraryId,
  averageRating,
  reviewCount,
}) => {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [itineraryId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/reviews`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);

        // Check if current user has reviewed
        if (session?.user?.email) {
          const userReview = data.reviews.find(
            (r: Review) => r.user.id === session.user.id
          );
          setHasReviewed(!!userReview);
        }
      }
    } catch (error) {
      console.error("Fetch reviews error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    setShowForm(false);
    fetchReviews();
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(
        `/api/itineraries/${itineraryId}/reviews/${reviewId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        fetchReviews();
      }
    } catch (error) {
      console.error("Delete review error:", error);
    }
  };

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Reviews & Ratings
          </h2>
          {averageRating && reviewCount ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-white">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-400">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          ) : (
            <p className="text-gray-400">No reviews yet</p>
          )}
        </div>

        {session && !hasReviewed && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Write a Review
          </button>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-400 mb-6">
            Be the first to share your experience!
          </p>
          {session && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors"
            >
              Write the First Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={review.user.image || "/default-avatar.png"}
                    alt={review.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="font-semibold text-white">
                      {review.user.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} readonly size="sm" />

                  {session?.user?.id === review.user.id && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-300 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      {showForm && (
        <ReviewForm
          itineraryId={itineraryId}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
