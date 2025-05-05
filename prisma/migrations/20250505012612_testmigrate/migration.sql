-- CreateTable
CREATE TABLE "Prayer" (
    "id" TEXT NOT NULL,
    "text" TEXT,
    "submittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prayer_pkey" PRIMARY KEY ("id")
);
