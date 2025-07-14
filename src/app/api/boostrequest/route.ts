// src/app/api/boostrequest/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, game, currentRank, desiredRank, description } = body;

    if (!userId || !game || !currentRank || !desiredRank) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando.' },
        { status: 400 }
      );
    }

    const request = await prisma.boostRequest.create({
      data: {
        userId,
        game,
        currentRank,
        desiredRank,
        description,
      },
    });

    return NextResponse.json(
      { message: 'Pedido de boost criado com sucesso!', request }
    );
  } catch (error) {
    console.error('Erro ao criar boost request:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}


// Adicione no mesmo arquivo (src/app/api/boostrequest/route.ts)
export async function GET() {
  try {
    const requests = await prisma.boostRequest.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar pedidos.' },
      { status: 500 }
    );
  }
}
