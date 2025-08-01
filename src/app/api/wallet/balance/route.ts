// src/app/api/wallet/balance/route.ts
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

    // ATUALIZADO: Buscar a carteira (Wallet) do usuário e selecionar o saldo
    const wallet = await prisma.wallet.findUnique({
      where: { userId: userId }, // A carteira está ligada ao userId
      select: {
        balance: true,
      },
    });

    if (!wallet) {
      // Se o usuário não tem uma carteira (isso pode acontecer se a carteira não for criada automaticamente no registro)
      // Você pode optar por criar uma carteira aqui ou retornar um saldo zero.
      // Para simplicidade, vamos retornar saldo zero e uma mensagem.
      return NextResponse.json({ balance: 0.00, message: 'Carteira não encontrada para este usuário.' }, { status: 200 });
    }

    // Retorna o saldo da carteira do usuário
    return NextResponse.json({ balance: wallet.balance }, { status: 200 });

  } catch (error) {
    console.error('API GET /api/wallet/balance: Erro ao obter saldo da carteira:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao obter saldo.' }, { status: 500 });
  }
}
