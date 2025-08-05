/*
  Warnings:

  - You are about to drop the column `receiveInAppNotifications` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastMessageText" TEXT,
    "lastMessageAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_BID',
    "boostRequestId" TEXT,
    CONSTRAINT "Chat_boostRequestId_fkey" FOREIGN KEY ("boostRequestId") REFERENCES "BoostRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Chat" ("createdAt", "id", "lastMessageAt", "lastMessageText", "updatedAt") SELECT "createdAt", "id", "lastMessageAt", "lastMessageText", "updatedAt" FROM "Chat";
DROP TABLE "Chat";
ALTER TABLE "new_Chat" RENAME TO "Chat";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT,
    "usuario" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cpf" TEXT,
    "bio" TEXT,
    "profilePictureUrl" TEXT,
    "country" TEXT,
    "hasChangedUsername" BOOLEAN NOT NULL DEFAULT false,
    "usernameLastChangedAt" DATETIME,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "receiveMarketingEmails" BOOLEAN NOT NULL DEFAULT true,
    "receiveOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "receiveMessageNotifications" BOOLEAN NOT NULL DEFAULT true,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT true,
    "isActivityPublic" BOOLEAN NOT NULL DEFAULT true,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'pt-BR',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "preferredCurrency" TEXT NOT NULL DEFAULT 'BRL',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("bio", "country", "cpf", "createdAt", "email", "failedLoginAttempts", "hasChangedUsername", "id", "isActivityPublic", "isProfilePublic", "isVerified", "lockoutUntil", "nome", "password", "preferredCurrency", "preferredLanguage", "profilePictureUrl", "receiveMarketingEmails", "receiveMessageNotifications", "receiveOrderUpdates", "theme", "updatedAt", "usernameLastChangedAt", "usuario") SELECT "bio", "country", "cpf", "createdAt", "email", "failedLoginAttempts", "hasChangedUsername", "id", "isActivityPublic", "isProfilePublic", "isVerified", "lockoutUntil", "nome", "password", "preferredCurrency", "preferredLanguage", "profilePictureUrl", "receiveMarketingEmails", "receiveMessageNotifications", "receiveOrderUpdates", "theme", "updatedAt", "usernameLastChangedAt", "usuario" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
