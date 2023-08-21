-- CreateTable
CREATE TABLE "Bill" (
    "id" SERIAL NOT NULL,
    "billId" INTEGER NOT NULL,
    "change_hash" TEXT NOT NULL,
    "description" TEXT,
    "last_action" TEXT,
    "last_action_date" TEXT,
    "number" TEXT,
    "status" INTEGER NOT NULL,
    "status_date" TEXT,
    "title" TEXT,
    "url" TEXT,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);
