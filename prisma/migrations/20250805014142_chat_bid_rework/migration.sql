/*
  Warnings:

  - You are about to drop the column `boostRequestId` on the `Chat` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BoostBid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boosterId" TEXT NOT NULL,
    "boostRequestId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT,
    CONSTRAINT "BoostBid_boosterId_fkey" FOREIGN KEY ("boosterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoostBid_boostRequestId_fkey" FOREIGN KEY ("boostRequestId") REFERENCES "BoostRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoostBid_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BoostBid" ("amount", "boostRequestId", "boosterId", "createdAt", "estimatedTime", "id") SELECT "amount", "boostRequestId", "boosterId", "createdAt", "estimatedTime", "id" FROM "BoostBid";
DROP TABLE "BoostBid";
ALTER TABLE "new_BoostBid" RENAME TO "BoostBid";
CREATE UNIQUE INDEX "BoostBid_chatId_key" ON "BoostBid"("chatId");
CREATE TABLE "new_Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastMessageText" TEXT,
    "lastMessageAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_BID'
);
INSERT INTO "new_Chat" ("createdAt", "id", "lastMessageAt", "lastMessageText", "status", "updatedAt") SELECT "createdAt", "id", "lastMessageAt", "lastMessageText", "status", "updatedAt" FROM "Chat";
DROP TABLE "Chat";
ALTER TABLE "new_Chat" RENAME TO "Chat";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
