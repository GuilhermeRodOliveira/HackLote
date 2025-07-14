/*
  Warnings:

  - You are about to drop the `BoosterPreference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "BoosterPreference_userId_game_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BoosterPreference";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "BoostBid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boosterId" TEXT NOT NULL,
    "boostRequestId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoostBid_boosterId_fkey" FOREIGN KEY ("boosterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoostBid_boostRequestId_fkey" FOREIGN KEY ("boostRequestId") REFERENCES "BoostRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);
INSERT INTO "new_User" ("email", "id", "password") SELECT "email", "id", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
