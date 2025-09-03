/*
  Warnings:

  - Made the column `password` on table `OTP` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."OTP" ALTER COLUMN "password" SET NOT NULL;
