/*
  Warnings:

  - A unique constraint covering the columns `[billId]` on the table `Bill` will be added. If there are existing duplicate values, this will fail.
  - Made the column `billId` on table `Bill` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Bill" ALTER COLUMN "billId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billId_key" ON "Bill"("billId");
