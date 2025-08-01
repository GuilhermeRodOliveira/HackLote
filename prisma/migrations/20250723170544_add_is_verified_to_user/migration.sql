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
    "hasChangedUsername" BOOLEAN NOT NULL DEFAULT false,
    "usernameLastChangedAt" DATETIME,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_User" ("bio", "country", "createdAt", "email", "failedLoginAttempts", "hasChangedUsername", "id", "isActivityPublic", "isProfilePublic", "lockoutUntil", "nome", "password", "preferredCurrency", "preferredLanguage", "profilePictureUrl", "receiveInAppNotifications", "receiveMarketingEmails", "receiveMessageNotifications", "receiveOrderUpdates", "theme", "updatedAt", "usernameLastChangedAt", "usuario") SELECT "bio", "country", "createdAt", "email", "failedLoginAttempts", "hasChangedUsername", "id", "isActivityPublic", "isProfilePublic", "lockoutUntil", "nome", "password", "preferredCurrency", "preferredLanguage", "profilePictureUrl", "receiveInAppNotifications", "receiveMarketingEmails", "receiveMessageNotifications", "receiveOrderUpdates", "theme", "updatedAt", "usernameLastChangedAt", "usuario" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
