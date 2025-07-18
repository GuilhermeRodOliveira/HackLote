// src/app/api/chat/session/[id]/messages/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma'; // Ajuste o caminho conforme seu projeto
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Interface para o payload do JWT
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Função auxiliar para obter o usuário logado
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


// GET: Obter mensagens de uma sessão de chat
export async function GET(
  req: Request,
  { params }: { params: { id: string } } // id é o chatSessionId
) {
  const chatSessionId = params.id;

  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
      include: {
        messages: {
          include: { sender: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        participant1: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } },
        participant2: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Sessão de chat não encontrada.' }, { status: 404 });
    }

    // Verifica se o usuário logado é um dos participantes da sessão
    if (chatSession.participant1Id !== currentUser.id && chatSession.participant2Id !== currentUser.id) {
      return NextResponse.json({ error: 'Você não tem acesso a esta sessão de chat.' }, { status: 403 });
    }

    return NextResponse.json({ messages: chatSession.messages, chatStatus: chatSession.status }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar mensagens de chat:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST: Enviar uma nova mensagem para uma sessão de chat
export async function POST(
  req: Request,
  { params }: { params: { id: string } } // id é o chatSessionId
) {
  const chatSessionId = params.id;

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

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Sessão de chat não encontrada.' }, { status: 404 });
    }

    // Verifica se o usuário logado é um dos participantes da sessão e se a sessão está aberta
    if (chatSession.participant1Id !== currentUser.id && chatSession.participant2Id !== currentUser.id) {
      return NextResponse.json({ error: 'Você não tem permissão para enviar mensagens nesta sessão.' }, { status: 403 });
    }

    // Verifica se a sessão está aberta para envio de mensagens
    if (chatSession.status !== 'OPEN') {
      return NextResponse.json({ error: 'Esta sessão de chat não está aberta para novas mensagens.' }, { status: 400 });
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: chatSession.id,
        senderId: currentUser.id,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } },
      },
    });

    return NextResponse.json({ message: 'Mensagem enviada com sucesso!', chatMessage }, { status: 201 });

  } catch (error) {
    console.error('Erro ao enviar mensagem de chat:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}