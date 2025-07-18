// src/app/api/user/boost-requests/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma'; // << CORRIGIDO O CAMINHO!
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// GET: Obter todos os pedidos de boost do usuário logado
export async function GET(req: NextRequest) {
  console.log('API de Meus Pedidos de Boost (GET): Requisição recebida.');
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
      console.error('Erro ao verificar token JWT para meus pedidos de boost:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }
    const userId = decodedToken.id; // ID do usuário logado

    // Buscar pedidos de boost onde o userId do pedido corresponde ao userId logado
    const myBoostRequests = await prisma.boostRequest.findMany({
      where: {
        userId: userId,
      },
      include: {
        user: { // Inclui os dados do próprio usuário (criador do pedido)
          select: {
            id: true,
            usuario: true,
            nome: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        bids: { // Inclui os lances para cada pedido
          select: {
            id: true,
            amount: true,
            estimatedTime: true,
            booster: {
              select: {
                id: true,
                usuario: true,
                nome: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Ordena pelos mais recentes
      },
    });

    console.log(`Meus pedidos de boost encontrados para o usuário ${userId}: ${myBoostRequests.length}`);
    return NextResponse.json({ myBoostRequests }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar meus pedidos de boost:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar meus pedidos de boost.' }, { status: 500 });
  }
}
