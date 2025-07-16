-- CreateTable
CREATE TABLE "BoostNotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "boostType" TEXT NOT NULL,
    CONSTRAINT "BoostNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BoostNotificationPreference_userId_game_boostType_key" ON "BoostNotificationPreference"("userId", "game", "boostType");
