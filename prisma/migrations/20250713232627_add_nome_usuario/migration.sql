/*
  Warnings:

  - A unique constraint covering the columns `[usuario]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "nome" TEXT;
ALTER TABLE "User" ADD COLUMN "usuario" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");
