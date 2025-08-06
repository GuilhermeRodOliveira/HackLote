// src/app/api/boost/accept-bid/route.ts (CORRIGIDO)
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    const currentUserId = decodedToken.id;

    const body = await req.json();
    const { bidId, requestId } = body;

    const boostRequest = await prisma.boostRequest.findUnique({
      where: { id: requestId },
    });

    if (!boostRequest || boostRequest.userId !== currentUserId) {
      return NextResponse.json({ error: 'Não autorizado a aceitar este lance.' }, { status: 403 });
    }

    // 1. Atualizar o BoostRequest para refletir o lance aceito
    const updatedRequest = await prisma.boostRequest.update({
      where: { id: requestId },
      data: {
        acceptedBidId: bidId,
      },
    });

    // 2. Fechar todos os outros chats de lances não aceitos
    const allBidsForRequest = await prisma.boostBid.findMany({
      where: { boostRequestId: requestId },
      include: { chat: true },
    });

    for (const bid of allBidsForRequest) {
      if (bid.chat && bid.id !== bidId) {
        await prisma.chat.update({
          where: { id: bid.chat.id },
          data: { status: 'CLOSED' },
        });
      }
    }

    // 3. Mudar o status do chat aceito para 'ACTIVE'
    const acceptedBidChat = await prisma.boostBid.findUnique({
      where: { id: bidId },
      select: { chat: true },
    });

    if (acceptedBidChat?.chat) {
      await prisma.chat.update({
        where: { id: acceptedBidChat.chat.id },
        data: { status: 'ACTIVE' },
      });
    }

    return NextResponse.json({ message: 'Lance aceito com sucesso.', chatId: acceptedBidChat?.chat?.id }, { status: 200 });

  } catch (error) {
    console.error('Erro ao aceitar lance:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}