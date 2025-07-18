// src/app/api/boostbid/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma'; // Caminho para o seu Prisma Client
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client'; // Importante para o tratamento de erros do Prisma

const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

// Interface para o payload do JWT (deve ser a mesma definida em app/api/me/route.ts e AuthContext)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Endpoint GET para buscar todos os lances (opcional, pode ser movido para uma rota específica de lances)
export async function GET(req: NextRequest) {
  try {
    // TODO: Adicionar autenticação e autorização para esta rota GET
    // Por exemplo, apenas admins ou o criador do pedido/booster podem ver todos os lances
    const bids = await prisma.boostBid.findMany({
      include: {
        booster: {
          select: {
            id: true,
            usuario: true,
            nome: true,
            profilePictureUrl: true,
          },
        },
        boostRequest: {
          select: {
            id: true,
            game: true,
            userId: true, // ID do criador do pedido
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limitar para não sobrecarregar
    });
    return NextResponse.json({ bids }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar lances:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar lances.' }, { status: 500 });
  }
}

// Endpoint POST para criar um novo lance
export async function POST(req: NextRequest) {
  console.log('API de Lances (POST): Requisição recebida.');
  try {
    // 1. Verificar JWT_SECRET
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 2. Autenticar Usuário (o booster) e Obter boosterId do Token
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      console.log('Nenhum token encontrado. Retornando 401.');
      return NextResponse.json({ error: 'Não autenticado para enviar lance.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
      console.log('Token decodificado com sucesso. Booster ID (do token):', decodedToken.id);
    } catch (jwtError) {
      console.error('ERRO: Erro ao verificar token JWT para criar lance:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado para criar lance.' }, { status: 401 });
    }

    const boosterId = decodedToken.id; // O ID do usuário logado (o booster)

    // 3. Obter Dados do Corpo da Requisição
    const body = await req.json();
    const { amount, estimatedTime, boostRequestId } = body;

    // 4. Validação Básica de Campos
    if (!amount || !estimatedTime || !boostRequestId) {
      return NextResponse.json(
        { error: 'Preço, Tempo Estimado e ID do Pedido de Boost são obrigatórios.' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 });
    }

    // ====================================================================================
    // NOVO: Verificar se o usuário já fez um lance para este pedido
    const existingBid = await prisma.boostBid.findFirst({
      where: {
        boosterId: boosterId,
        boostRequestId: boostRequestId,
      },
    });

    if (existingBid) {
      console.log('Usuário já fez um lance para este pedido. Retornando 409.');
      return NextResponse.json({ error: 'Você já enviou um lance para este pedido de boost. Por favor, edite ou exclua o lance existente.' }, { status: 409 });
    }
    // ====================================================================================

    // 5. Criar o Lance no Banco de Dados (em uma transação para atomicidade)
    const bid = await prisma.$transaction(async (prisma) => {
      const createdBid = await prisma.boostBid.create({
        data: {
          boosterId,
          boostRequestId,
          amount: parsedAmount,
          estimatedTime,
        },
      });

      // 6. Criar Notificação para o Criador do Pedido de Boost
      const boostRequest = await prisma.boostRequest.findUnique({
        where: { id: boostRequestId },
        select: { userId: true, game: true }, // Precisamos do userId do criador do pedido
      });

      if (boostRequest) {
        await prisma.notification.create({
          data: {
            userId: boostRequest.userId, // ID do criador do pedido
            type: 'NEW_BID',
            message: `Você recebeu um novo lance para o seu pedido de ${boostRequest.game}!`,
            relatedBoostRequestId: boostRequestId,
            relatedBidId: createdBid.id,
          },
        });
        console.log(`Notificação de novo lance criada para o usuário ${boostRequest.userId}`);
      }

      return createdBid;
    });

    console.log('Lance criado com sucesso:', bid.id);
    return NextResponse.json({ message: 'Lance enviado com sucesso!', bid }, { status: 201 });

  } catch (error) {
    console.error('ERRO GERAL ao criar lance:', error);
    // Erros específicos do Prisma podem ser tratados aqui
    return NextResponse.json({ error: 'Erro interno no servidor ao enviar lance.' }, { status: 500 });
  }
}
