import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // Use a mesma chave secreta

// Interface para o payload do JWT (deve ser a mesma definida em app/api/me/route.ts)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Endpoint GET para buscar as listagens do usuário logado
export async function GET(req: NextRequest) {
  try {
    // 1. Verificar Autenticação do Usuário
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para my-listings:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = decodedToken.id; // O ID do usuário logado vem do token

    // 2. Buscar Listagens Filtradas pelo ID do Usuário Logado
    const listings = await prisma.listing.findMany({
      where: {
        sellerId: userId, // Filtra as listagens pelo ID do vendedor (usuário logado)
      },
      include: {
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
        createdAt: 'desc', // Ordena as listagens pelas mais recentes primeiro
      },
    });

    return NextResponse.json({ listings }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar minhas listagens:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar minhas listagens.' }, { status: 500 });
  }
}
