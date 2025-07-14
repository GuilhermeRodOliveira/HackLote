import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ativar preferência (POST)
export async function POST(req: Request) {
  try {
    const { userId, game } = await req.json();

    if (!userId || !game) {
      return NextResponse.json({ error: 'Dados ausentes.' }, { status: 400 });
    }

    const existing = await prisma.boosterPreference.findFirst({
      where: { userId, game }
    });

    if (existing) {
      return NextResponse.json({ message: 'Já está inscrito.' }, { status: 200 });
    }

    const preference = await prisma.boosterPreference.create({
      data: { userId, game }
    });

    return NextResponse.json({ message: 'Inscrição feita com sucesso!', preference });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// Desativar preferência (DELETE)
export async function DELETE(req: Request) {
  try {
    const { userId, game } = await req.json();

    if (!userId || !game) {
      return NextResponse.json({ error: 'Dados ausentes.' }, { status: 400 });
    }

    await prisma.boosterPreference.deleteMany({
      where: { userId, game }
    });

    return NextResponse.json({ message: 'Preferência removida com sucesso!' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
