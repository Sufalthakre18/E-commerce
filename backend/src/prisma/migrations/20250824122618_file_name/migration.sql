/*
  Warnings:

  - Made the column `fileName` on table `DigitalFile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."DigitalFile" ALTER COLUMN "fileName" SET NOT NULL;
