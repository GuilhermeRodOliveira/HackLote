// file: src/app/api/chats/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    const userId = decodedToken.id;
    const chatId = params.id;

    const isParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: userId,
      },
    });

    if (!isParticipant) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ messages }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar mensagens.' }, { status: 500 });
  }
}