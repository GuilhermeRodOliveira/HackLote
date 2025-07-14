import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { boosterId, boostRequestId, amount, estimatedTime } = body;

    if (!boosterId || !boostRequestId || !amount || !estimatedTime) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const bid = await prisma.boostBid.create({
      data: {
        boosterId,
        boostRequestId,
        amount,
        estimatedTime,
      },
    });

    return NextResponse.json({ message: 'Lance enviado com sucesso!', bid });
  } catch (error) {
    console.error('Erro ao criar lance:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
