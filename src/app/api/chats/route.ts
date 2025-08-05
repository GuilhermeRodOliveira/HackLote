// file: src/app/api/chats/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
}

export async function GET(req: NextRequest) {
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

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        participants: {
          select: {
            user: {
              select: {
                id: true,
                nome: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return NextResponse.json({ chats }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar chats.' }, { status: 500 });
  }
}