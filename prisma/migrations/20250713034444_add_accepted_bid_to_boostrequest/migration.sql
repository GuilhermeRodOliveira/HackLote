/*
  Warnings:

  - You are about to drop the column `acceptedBid` on the `BoostRequest` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BoostRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "currentRank" TEXT NOT NULL,
    "desiredRank" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedBidId" TEXT,
    CONSTRAINT "BoostRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoostRequest_acceptedBidId_fkey" FOREIGN KEY ("acceptedBidId") REFERENCES "BoostBid" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BoostRequest" ("createdAt", "currentRank", "description", "desiredRank", "game", "id", "userId") SELECT "createdAt", "currentRank", "description", "desiredRank", "game", "id", "userId" FROM "BoostRequest";
DROP TABLE "BoostRequest";
ALTER TABLE "new_BoostRequest" RENAME TO "BoostRequest";
CREATE UNIQUE INDEX "BoostRequest_acceptedBidId_key" ON "BoostRequest"("acceptedBidId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
