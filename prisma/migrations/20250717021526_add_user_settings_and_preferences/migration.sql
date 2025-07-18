-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT,
    "usuario" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "bio" TEXT,
    "profilePictureUrl" TEXT,
    "country" TEXT,
    "receiveMarketingEmails" BOOLEAN NOT NULL DEFAULT true,
    "receiveOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "receiveMessageNotifications" BOOLEAN NOT NULL DEFAULT true,
    "receiveInAppNotifications" BOOLEAN NOT NULL DEFAULT true,
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
INSERT INTO "new_User" ("bio", "createdAt", "email", "failedLoginAttempts", "id", "lockoutUntil", "nome", "password", "profilePictureUrl", "updatedAt", "usuario") SELECT "bio", "createdAt", "email", "failedLoginAttempts", "id", "lockoutUntil", "nome", "password", "profilePictureUrl", "updatedAt", "usuario" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
