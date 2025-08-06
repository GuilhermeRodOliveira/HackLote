// src/app/api/chat/session/[id]/messages/route.ts (CORRIGIDO)
import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
}

async function getCurrentUser(req: Request) {
  const tokenCookie = req.headers.get('cookie')?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  if (!tokenCookie || !JWT_SECRET) {
    return null;
  }
  try {
    const decodedToken = jwt.verify(tokenCookie, JWT_SECRET) as JwtUserPayload;
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true },
    });
    return user;
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
}

// GET: Obter mensagens de um chat
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const chatId = params.id;
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          include: { sender: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        participants: {
          select: {
            user: {
              select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true },
            },
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat não encontrado.' }, { status: 404 });
    }

    // Corrigido: Acesso a 'userId' dentro do objeto 'user' do participante
    const isParticipant = chat.participants.some(p => p.user.id === currentUser.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Você não tem acesso a este chat.' }, { status: 403 });
    }

    return NextResponse.json({ messages: chat.messages, chatStatus: chat.status }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar mensagens do chat:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST: Enviar uma nova mensagem para um chat
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const chatId = params.id;
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'O conteúdo da mensagem é obrigatório.' }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat não encontrado.' }, { status: 404 });
    }

    // Corrigido: Acesso a 'userId' dentro do objeto 'user' do participante
    const isParticipant = chat.participants.some(p => p.userId === currentUser.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Você não tem permissão para enviar mensagens neste chat.' }, { status: 403 });
    }

    if (chat.status === 'CLOSED') {
      return NextResponse.json({ error: 'Este chat está fechado para novas mensagens.' }, { status: 400 });
    }

    const chatMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: currentUser.id,
        text: content.trim(),
      },
      include: {
        sender: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } },
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessageText: content.trim(),
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Mensagem enviada com sucesso!', chatMessage }, { status: 201 });
  } catch (error) {
    console.error('Erro ao enviar mensagem de chat:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}