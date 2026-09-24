-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'FLIGHT';

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "flightInfo" JSONB;
