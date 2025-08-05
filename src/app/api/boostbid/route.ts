// src/app/api/boostbid/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Endpoint POST para criar um novo lance
export async function POST(req: NextRequest) {
  console.log('API de Lances (POST): Requisição para criar novo lance recebida.');
  try {
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado para criar lance.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('ERRO: Erro ao verificar token JWT para criar lance:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado para criar lance.' }, { status: 401 });
    }

    const boosterId = decodedToken.id;

    const body = await req.json();
    const { boostRequestId, amount, estimatedTime } = body;

    if (!boostRequestId || !amount || !estimatedTime) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 });
    }

    // 1. Verificar se o pedido existe e pegar o ID do cliente
    const boostRequest = await prisma.boostRequest.findUnique({
      where: { id: boostRequestId },
      select: { userId: true },
    });

    if (!boostRequest) {
      return NextResponse.json({ error: 'Pedido de boost não encontrado.' }, { status: 404 });
    }

    const clientUserId = boostRequest.userId;

    // 2. Verificar se o booster já fez um lance para este pedido
    const existingBid = await prisma.boostBid.findFirst({
      where: {
        boosterId: boosterId,
        boostRequestId: boostRequestId,
      },
    });

    if (existingBid) {
      return NextResponse.json({ error: 'Você já fez um lance para este pedido.' }, { status: 409 });
    }

    // 3. Criar o lance no banco de dados
    const newBid = await prisma.boostBid.create({
      data: {
        boosterId,
        boostRequestId,
        amount: parsedAmount,
        estimatedTime,
      },
    });

    // 4. LÓGICA DE CRIAÇÃO DO CHAT TEMPORÁRIO
    // CORRIGIDO: Consulta para encontrar um chat que tem ambos os participantes
    const existingChat = await prisma.chat.findFirst({
      where: {
        boostRequestId: boostRequestId,
        AND: [
          {
            participants: {
              some: { userId: clientUserId },
            },
          },
          {
            participants: {
              some: { userId: boosterId },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!existingChat) {
      await prisma.chat.create({
        data: {
          boostRequestId: boostRequestId,
          status: 'PENDING_BID',
          participants: {
            create: [
              { userId: clientUserId },
              { userId: boosterId },
            ],
          },
          messages: {
            create: {
              senderId: boosterId,
              text: `Olá! Fiz um lance de R$${parsedAmount} para o seu pedido. Podemos conversar sobre os detalhes aqui.`,
            },
          },
        },
      });
    }

    return NextResponse.json({ message: 'Lance criado com sucesso!', bid: newBid }, { status: 201 });

  } catch (error) {
    console.error('ERRO GERAL ao criar lance:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao criar lance.' }, { status: 500 });
  }
}
