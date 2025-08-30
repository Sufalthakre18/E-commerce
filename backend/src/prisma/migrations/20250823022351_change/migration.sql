/*
  Warnings:

  - Made the column `publicId` on table `DigitalFile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."DigitalFile" ALTER COLUMN "publicId" SET NOT NULL;
