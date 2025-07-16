/*
  Warnings:

  - Added the required column `hashedPassword` to the `VerificationCode` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VerificationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "nome" TEXT,
    "usuario" TEXT,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_VerificationCode" ("code", "createdAt", "email", "expiresAt", "id", "updatedAt") SELECT "code", "createdAt", "email", "expiresAt", "id", "updatedAt" FROM "VerificationCode";
DROP TABLE "VerificationCode";
ALTER TABLE "new_VerificationCode" RENAME TO "VerificationCode";
CREATE UNIQUE INDEX "VerificationCode_email_key" ON "VerificationCode"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
