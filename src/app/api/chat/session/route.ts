// src/app/api/chat/session/route.ts (CORRIGIDO NOVAMENTE)
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
  email: string;
}

// GET: Obter todas as sessões de chat de um usuário logado
export async function GET(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }
    const currentUserId = decodedToken.id;

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserId,
          },
        },
        status: {
          in: ['PENDING_BID', 'ACTIVE'],
        },
      },
      include: {
        participants: {
          select: {
            user: {
              select: {
                id: true,
                usuario: true,
                nome: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, usuario: true, nome: true } } },
        },
        // O `include` para `boostBid` está correto
        boostBid: {
          select: {
            boostRequest: {
              select: {
                id: true,
                game: true,
                currentRank: true,
                desiredRank: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ chats }, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar chats:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao listar chats.' }, { status: 500 });
  }
}

// POST: Criar ou Obter uma Sessão de Chat (agora por bid)
export async function POST(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }
    const currentUserId = decodedToken.id;

    const body = await req.json();
    const { boostBidId } = body;

    if (!boostBidId) {
      return NextResponse.json({ error: 'ID do lance de boost é obrigatório.' }, { status: 400 });
    }

    const boostBid = await prisma.boostBid.findUnique({
      where: { id: boostBidId },
      include: { boostRequest: { select: { userId: true, id: true, game: true, currentRank: true, desiredRank: true } } },
    });

    if (!boostBid) {
      return NextResponse.json({ error: 'Lance não encontrado.' }, { status: 404 });
    }

    const participant1Id = boostBid.boostRequest.userId;
    const participant2Id = boostBid.boosterId;

    if (currentUserId !== participant1Id && currentUserId !== participant2Id) {
      return NextResponse.json({ error: 'Não autorizado a acessar este chat.' }, { status: 403 });
    }

    // CORREÇÃO: `boostBidId` não é um campo direto em Chat, é uma relação. 
    // Para buscar um chat pelo `boostBidId`, a query deve ser aninhada.
    // Usando `findFirst` com uma cláusula `where` que acessa a relação `boostBid`.
    let chat = await prisma.chat.findFirst({
      where: {
        boostBid: {
          id: boostBidId,
        },
      },
      include: {
        participants: {
          select: {
            user: {
              select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, usuario: true, nome: true, profilePictureUrl: true } } },
        },
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          status: 'PENDING_BID',
          boostBid: {
            connect: { id: boostBidId },
          },
          participants: {
            createMany: {
              data: [
                { userId: participant1Id },
                { userId: participant2Id },
              ],
            },
          },
        },
        include: {
          participants: {
            select: {
              user: {
                select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, usuario: true, nome: true, profilePictureUrl: true } } },
          },
        },
      });

      const initialMessageContent = `Boosting Request chat started:
Boosting request ID: ${boostBid.boostRequest.id}
Game: ${boostBid.boostRequest.game}
Current Rank: ${boostBid.boostRequest.currentRank}
Desired Rank: ${boostBid.boostRequest.desiredRank}`;

      await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: boostBid.boosterId,
          text: initialMessageContent,
        },
      });
    }

    if (chat.status === 'CLOSED') {
      return NextResponse.json({ error: 'Esta sessão de chat foi encerrada.' }, { status: 400 });
    }

    return NextResponse.json({ chat }, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerenciar chat:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao gerenciar chat.' }, { status: 500 });
  }
}