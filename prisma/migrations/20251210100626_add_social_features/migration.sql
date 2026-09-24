-- AlterTable
ALTER TABLE "itineraries" ADD COLUMN     "allowCloning" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "cloneCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "followerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "followingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "travelStyle" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visitedCountries" INTEGER NOT NULL DEFAULT 0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "socialLinks" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_reviews" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_likes" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_clones" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "clonedId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_clones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "itinerary_reviews_itineraryId_idx" ON "itinerary_reviews"("itineraryId");

-- CreateIndex
CREATE INDEX "itinerary_reviews_userId_idx" ON "itinerary_reviews"("userId");

-- CreateIndex
CREATE INDEX "itinerary_reviews_rating_idx" ON "itinerary_reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_reviews_itineraryId_userId_key" ON "itinerary_reviews"("itineraryId", "userId");

-- CreateIndex
CREATE INDEX "itinerary_likes_itineraryId_idx" ON "itinerary_likes"("itineraryId");

-- CreateIndex
CREATE INDEX "itinerary_likes_userId_idx" ON "itinerary_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_likes_itineraryId_userId_key" ON "itinerary_likes"("itineraryId", "userId");

-- CreateIndex
CREATE INDEX "itinerary_clones_originalId_idx" ON "itinerary_clones"("originalId");

-- CreateIndex
CREATE INDEX "itinerary_clones_clonedId_idx" ON "itinerary_clones"("clonedId");

-- CreateIndex
CREATE INDEX "itinerary_clones_userId_idx" ON "itinerary_clones"("userId");

-- CreateIndex
CREATE INDEX "itineraries_isPublic_idx" ON "itineraries"("isPublic");

-- CreateIndex
CREATE INDEX "itineraries_likeCount_idx" ON "itineraries"("likeCount");

-- CreateIndex
CREATE INDEX "itineraries_averageRating_idx" ON "itineraries"("averageRating");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_reviews" ADD CONSTRAINT "itinerary_reviews_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_reviews" ADD CONSTRAINT "itinerary_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_likes" ADD CONSTRAINT "itinerary_likes_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_likes" ADD CONSTRAINT "itinerary_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_clones" ADD CONSTRAINT "itinerary_clones_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_clones" ADD CONSTRAINT "itinerary_clones_clonedId_fkey" FOREIGN KEY ("clonedId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_clones" ADD CONSTRAINT "itinerary_clones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
