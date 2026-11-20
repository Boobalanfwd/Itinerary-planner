-- Add enum values and current-schema objects missing from the original migration history.

ALTER TYPE "CollaboratorRole" ADD VALUE IF NOT EXISTS 'TRAVELER';

CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

ALTER TABLE "itineraries" ADD COLUMN "travelers" TEXT, ADD COLUMN "preferences" JSONB, ADD COLUMN "share_token" TEXT, ADD COLUMN "tripStatus" TEXT DEFAULT 'planning';

ALTER TABLE "days" ADD COLUMN "theme" TEXT;

ALTER TABLE "activities" ADD COLUMN "place_id" TEXT, ADD COLUMN "position" INTEGER, ADD COLUMN "indoor" BOOLEAN DEFAULT false, ADD COLUMN "lockedByUserId" TEXT, ADD COLUMN "lockedAt" TIMESTAMP(3);

ALTER TABLE "itinerary_collaborators" ADD COLUMN "inviteStatus" "InviteStatus" NOT NULL DEFAULT 'ACCEPTED', ADD COLUMN "invitedEmail" TEXT, ADD COLUMN "invitedByUserId" TEXT, ADD COLUMN "sectionOverrides" JSONB;

CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formatted_address" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "place_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "step" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "anchorType" TEXT NOT NULL,
    "anchorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "text" TEXT NOT NULL,
    "attachments" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_reactions" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "voteType" TEXT NOT NULL DEFAULT 'thumbs',
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "linkedActivityId" TEXT,
    "winnerOptionId" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "dayNumber" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "notes" TEXT NOT NULL,
    "mood" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'photo',
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "locationName" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trip_summaries" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "standoutMoments" JSONB,
    "tone" TEXT NOT NULL DEFAULT 'sentimental',
    "stats" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_summaries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memory_books" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "coverPhoto" TEXT,
    "layoutTemplate" TEXT NOT NULL DEFAULT 'magazine',
    "visibility" TEXT NOT NULL DEFAULT 'collaborators',
    "collaborative" BOOLEAN NOT NULL DEFAULT true,
    "customCaptions" JSONB,
    "selectedEntries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorId" TEXT NOT NULL,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_books_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "itineraries_share_token_key" ON "itineraries"("share_token");

CREATE INDEX "activities_place_id_idx" ON "activities"("place_id");

CREATE INDEX "itinerary_collaborators_inviteStatus_idx" ON "itinerary_collaborators"("inviteStatus");

CREATE UNIQUE INDEX "places_place_id_key" ON "places"("place_id");

CREATE INDEX "places_name_idx" ON "places"("name");

CREATE INDEX "places_category_idx" ON "places"("category");

CREATE INDEX "generation_jobs_user_id_idx" ON "generation_jobs"("user_id");

CREATE INDEX "generation_jobs_status_idx" ON "generation_jobs"("status");

CREATE INDEX "generation_jobs_created_at_idx" ON "generation_jobs"("created_at");

CREATE INDEX "comments_itineraryId_idx" ON "comments"("itineraryId");

CREATE INDEX "comments_anchorType_anchorId_idx" ON "comments"("anchorType", "anchorId");

CREATE INDEX "comments_userId_idx" ON "comments"("userId");

CREATE UNIQUE INDEX "comment_reactions_commentId_userId_emoji_key" ON "comment_reactions"("commentId", "userId", "emoji");

CREATE INDEX "polls_itineraryId_idx" ON "polls"("itineraryId");

CREATE INDEX "poll_options_pollId_idx" ON "poll_options"("pollId");

CREATE INDEX "poll_votes_pollId_idx" ON "poll_votes"("pollId");

CREATE INDEX "poll_votes_userId_idx" ON "poll_votes"("userId");

CREATE UNIQUE INDEX "poll_votes_pollId_optionId_userId_key" ON "poll_votes"("pollId", "optionId", "userId");

CREATE INDEX "journal_entries_itineraryId_idx" ON "journal_entries"("itineraryId");

CREATE INDEX "journal_entries_authorId_idx" ON "journal_entries"("authorId");

CREATE INDEX "journal_entries_date_idx" ON "journal_entries"("date");

CREATE INDEX "trip_summaries_itineraryId_idx" ON "trip_summaries"("itineraryId");

CREATE UNIQUE INDEX "memory_books_shareToken_key" ON "memory_books"("shareToken");

CREATE INDEX "memory_books_itineraryId_idx" ON "memory_books"("itineraryId");

CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

CREATE INDEX "activity_logs_itineraryId_idx" ON "activity_logs"("itineraryId");

CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

ALTER TABLE "activities" ADD CONSTRAINT "activities_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "itinerary_collaborators" ADD CONSTRAINT "itinerary_collaborators_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "polls" ADD CONSTRAINT "polls_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "polls" ADD CONSTRAINT "polls_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "polls" ADD CONSTRAINT "polls_linkedActivityId_fkey" FOREIGN KEY ("linkedActivityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trip_summaries" ADD CONSTRAINT "trip_summaries_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memory_books" ADD CONSTRAINT "memory_books_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memory_books" ADD CONSTRAINT "memory_books_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
