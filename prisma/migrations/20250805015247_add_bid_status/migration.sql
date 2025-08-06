-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BoostBid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boosterId" TEXT NOT NULL,
    "boostRequestId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT,
    CONSTRAINT "BoostBid_boosterId_fkey" FOREIGN KEY ("boosterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoostBid_boostRequestId_fkey" FOREIGN KEY ("boostRequestId") REFERENCES "BoostRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoostBid_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BoostBid" ("amount", "boostRequestId", "boosterId", "chatId", "createdAt", "estimatedTime", "id") SELECT "amount", "boostRequestId", "boosterId", "chatId", "createdAt", "estimatedTime", "id" FROM "BoostBid";
DROP TABLE "BoostBid";
ALTER TABLE "new_BoostBid" RENAME TO "BoostBid";
CREATE UNIQUE INDEX "BoostBid_chatId_key" ON "BoostBid"("chatId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
