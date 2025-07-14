// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar usuários.' }, { status: 500 });
  }
}
