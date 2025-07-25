// src/app/api/my-listings/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma'; // Confirme o caminho
import jwt from 'jsonwebtoken';

// Interface para o payload do JWT (deve ser a mesma que você usa em /api/login e /api/me)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_ONLY'; // Use uma chave forte em produção!

export async function GET(req: NextRequest) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET não está definido nas variáveis de ambiente do servidor.');
    return NextResponse.json({ error: 'Erro de configuração interna.' }, { status: 500 });
  }

  let userId: string;
  try {
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      // Se não há token, não está autenticado
      return NextResponse.json({ error: 'Não autenticado: Token não encontrado.' }, { status: 401 });
    }

    const token = tokenCookie.value;
    try {
      // Verifica e decodifica o token para obter o payload do usuário
      const decodedToken = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
      userId = decodedToken.id; // Obtém o ID do usuário do token
    } catch (jwtError) {
      // Se o token for inválido, expirado ou modificado
      console.error('Erro ao verificar token JWT em /api/my-listings:', jwtError);
      return NextResponse.json({ error: 'Não autenticado: Token inválido ou expirado.' }, { status: 401 });
    }

  } catch (error) {
    console.error('Erro na autenticação em /api/my-listings:', error);
    return NextResponse.json({ error: 'Erro de autenticação interno.' }, { status: 500 });
  }

  try {
    // Busca APENAS as listagens onde o sellerId é o userId obtido do token
    const listings = await prisma.listing.findMany({
      where: {
        sellerId: userId,
      },
      include: {
        // Inclui as informações do vendedor (que é o próprio usuário logado)
        seller: {
          select: {
            id: true,
            usuario: true,
            email: true,
            nome: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Listagens mais recentes primeiro
      },
    });

    return NextResponse.json({ listings }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar minhas listagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar suas listagens.' }, { status: 500 });
  }
}