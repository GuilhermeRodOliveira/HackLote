-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedBoostRequestId" TEXT,
    "relatedBidId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_relatedBoostRequestId_fkey" FOREIGN KEY ("relatedBoostRequestId") REFERENCES "BoostRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_relatedBidId_fkey" FOREIGN KEY ("relatedBidId") REFERENCES "BoostBid" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
