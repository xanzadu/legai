/*
  Warnings:

  - Added the required column `role` to the `ChatHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatHistory" ADD COLUMN     "role" TEXT NOT NULL;
