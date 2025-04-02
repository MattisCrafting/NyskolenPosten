-- CreateTable
CREATE TABLE "GlobalStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockMessage" TEXT,
    "lastUpdatedBy" INTEGER NOT NULL,
    "lastUpdatedAt" DATETIME NOT NULL,
    CONSTRAINT "GlobalStatus_lastUpdatedBy_fkey" FOREIGN KEY ("lastUpdatedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
