// src/app/api/wallet/transactions/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Interface para o payload do token JWT (reutilizada)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Função auxiliar para obter o userId do token (reutilizada de outras rotas)
function getUserIdFromRequest(request: NextRequest): string | null {
  const tokenCookie = request.cookies.get('token');
  if (!tokenCookie || !tokenCookie.value) {
    console.warn('getUserIdFromRequest: Token cookie não encontrado.');
    return null;
  }

  try {
    if (!JWT_SECRET) {
      console.error('getUserIdFromRequest: JWT_SECRET não está definido.');
      return null;
    }
    const decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    return decodedToken.id;
  } catch (error) {
    console.error('getUserIdFromRequest: Erro ao decodificar token JWT:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ message: 'Não autenticado ou token inválido.' }, { status: 401 });
    }

    // Primeiro, encontre a carteira (Wallet) do usuário
    const wallet = await prisma.wallet.findUnique({
      where: { userId: userId },
      select: {
        id: true, // Precisamos do ID da carteira para buscar as transações
      },
    });

    if (!wallet) {
      // Se não há carteira, não há transações para retornar
      // Isso pode acontecer se a carteira não for criada automaticamente no registro
      return NextResponse.json([], { status: 200 }); // Retorna um array vazio
    }

    // Buscar transações associadas ao ID da carteira (walletId)
    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id }, // Agora filtramos por walletId
      orderBy: {
        createdAt: 'desc', // Ordena das mais recentes para as mais antigas
      },
      select: { // Seleciona os campos que você quer retornar
        id: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        relatedOrderId: true, // Usar relatedOrderId
        createdAt: true,
      },
    });

    // Retorna a lista de transações
    return NextResponse.json(transactions, { status: 200 });

  } catch (error) {
    console.error('API GET /api/wallet/transactions: Erro ao obter histórico de transações:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao obter transações.' }, { status: 500 });
  }
}
