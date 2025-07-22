// src/app/api/orders/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma'; // Confirme o caminho
import jwt from 'jsonwebtoken';

// Defina a interface para o payload do seu JWT (deve ser a mesma que em /api/me)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  // iat, exp e outras props do JWT serão adicionadas automaticamente pelo jwt.verify
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_ONLY'; // Use uma chave forte em produção!

export async function GET(req: NextRequest) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET não está definido nas variáveis de ambiente do servidor.');
    return NextResponse.json({ error: 'Erro de configuração interna.' }, { status: 500 });
  }

  try {
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      // Se não há token, não está autenticado
      return NextResponse.json({ error: 'Não autenticado: Token não encontrado.' }, { status: 401 });
    }

    const token = tokenCookie.value;
    let userId: string;

    try {
      // Verifica e decodifica o token para obter o payload do usuário
      const decodedToken = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
      userId = decodedToken.id; // Obtém o ID do usuário do token
    } catch (jwtError) {
      // Se o token for inválido, expirado ou modificado
      console.error('Erro ao verificar token JWT em /api/orders:', jwtError);
      return NextResponse.json({ error: 'Não autenticado: Token inválido ou expirado.' }, { status: 401 });
    }

    // Busca pedidos onde o usuário (obtido do token JWT) é o comprador OU o vendedor
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            price: true,
          },
        },
        buyer: {
          select: {
            id: true,
            usuario: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            usuario: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Pedidos mais recentes primeiro
      },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar pedidos.' }, { status: 500 });
  }
}