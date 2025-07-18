// src/app/api/chat/session/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma'; // Caminho CORRETO para src/utils/prisma
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// GET: Obter todas as sessões de chat de um usuário logado
export async function GET(req: NextRequest) {
  console.log('API de Sessão de Chat (GET): Requisição recebida.');
  try {
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // Autenticar Usuário
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para listar chats:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }
    const currentUserId = decodedToken.id;

    // Buscar todas as sessões de chat onde o usuário logado é participante1 ou participante2
    const chatSessions = await prisma.chatSession.findMany({ // ESTA LINHA SÓ FUNCIONARÁ COM PRISMA CLIENT ATUALIZADO
      where: {
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
        status: 'OPEN', // Apenas sessões de chat abertas
      },
      include: {
        participant1: { select: { id: true, usuario: true, nome: true, profilePictureUrl: true } },
        participant2: { select: { id: true, usuario: true, nome: true, profilePictureUrl: true } },
        boostRequest: { select: { id: true, game: true, currentRank: true, desiredRank: true } }, // Inclui detalhes do pedido
        messages: {
          take: 1, // Pega apenas a última mensagem para pré-visualização (opcional)
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, usuario: true, nome: true } } },
        },
      },
      orderBy: {
        updatedAt: 'desc', // Ordena pelas sessões mais recentes (com base na última atualização/mensagem)
      },
    });

    console.log(`Sessões de chat encontradas para o usuário ${currentUserId}: ${chatSessions.length}`);
    return NextResponse.json({ chatSessions }, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar sessões de chat:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao listar sessões de chat.' }, { status: 500 });
  }
}


// POST: Criar ou Obter uma Sessão de Chat (código existente)
export async function POST(req: NextRequest) {
  console.log('API de Sessão de Chat (POST): Requisição recebida.');
  try {
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // Autenticar Usuário
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para chat:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }
    const currentUserId = decodedToken.id;

    const body = await req.json();
    const { boostRequestId, participant1Id, participant2Id } = body;

    if (!boostRequestId || !participant1Id || !participant2Id) {
      return NextResponse.json({ error: 'ID do pedido de boost e IDs dos participantes são obrigatórios.' }, { status: 400 });
    }

    // Verificar se o usuário logado é um dos participantes
    if (currentUserId !== participant1Id && currentUserId !== participant2Id) {
      return NextResponse.json({ error: 'Não autorizado a acessar este chat.' }, { status: 403 });
    }

    // Buscar ou criar a sessão de chat
    let chatSession = await prisma.chatSession.findUnique({ // ESTA LINHA SÓ FUNCIONARÁ COM PRISMA CLIENT ATUALIZADO
      where: { boostRequestId: boostRequestId },
      include: {
        participant1: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } },
        participant2: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, usuario: true, nome: true, profilePictureUrl: true } } },
        },
      },
    });

    if (!chatSession) {
      // Criar nova sessão de chat se não existir
      chatSession = await prisma.chatSession.create({
        data: {
          boostRequestId: boostRequestId,
          participant1Id: participant1Id,
          participant2Id: participant2Id,
          status: 'OPEN', // Inicia como aberta
        },
        include: {
          participant1: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } },
          participant2: { select: { id: true, usuario: true, nome: true, email: true, profilePictureUrl: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, usuario: true, nome: true, profilePictureUrl: true } } },
          },
        },
      });
      console.log('Nova sessão de chat criada:', chatSession.id);
    } else {
      console.log('Sessão de chat existente encontrada:', chatSession.id);
    }

    // Verificar se a sessão está aberta
    if (chatSession.status !== 'OPEN') {
      return NextResponse.json({ error: 'Sessão de chat não está aberta.' }, { status: 400 });
    }

    return NextResponse.json({ chatSession }, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerenciar sessão de chat:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao gerenciar sessão de chat.' }, { status: 500 });
  }
}
