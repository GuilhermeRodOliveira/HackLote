// src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

// Declara a variável prisma globalmente (apenas em desenvolvimento)
// Isso evita que novas instâncias do PrismaClient sejam criadas a cada hot reload
// No ambiente de produção, ele sempre será uma única instância
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  // Opcional: Adicione logs para ver as queries no console do servidor durante o desenvolvimento
  // log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma }; // Exporta a única instância do Prisma Client