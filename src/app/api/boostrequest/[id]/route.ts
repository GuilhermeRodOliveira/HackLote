// src/app/api/boostrequest/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/utils/prisma'; // Ajuste o caminho conforme seu projeto
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

// Interface para o payload do JWT (deve ser a mesma definida em app/api/me/route.ts e AuthContext)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Função auxiliar para obter o usuário logado do token JWT
async function getCurrentUser(req: NextRequest) {
  const tokenCookie = req.cookies.get('token');
  if (!tokenCookie || !tokenCookie.value || !JWT_SECRET) {
    return null;
  }

  try {
    const decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    return await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: { id: true, usuario: true, email: true, nome: true, profilePictureUrl: true },
    });
  } catch (jwtError) {
    console.error('Erro ao verificar token JWT:', jwtError);
    return null;
  }
}

// GET: Obter detalhes de um pedido de boost específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // O ID do pedido de boost virá nos parâmetros da URL
) {
  // Acessando 'id' diretamente de 'params'
  const { id } = params; 
  console.log('API de Detalhes de Boost: Requisição recebida para ID:', id);

  try {
    if (!id) {
      return NextResponse.json({ error: 'ID do pedido de boost não fornecido.' }, { status: 400 });
    }

    const boostRequest = await prisma.boostRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            usuario: true,
            nome: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        bids: {
          include: {
            booster: {
              select: {
                id: true,
                usuario: true,
                nome: true,
                email: true,
                profilePictureUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' }, // Ordena os lances por data de criação
        },
        acceptedBid: true, // Inclui o lance aceito, se houver
      },
    });

    if (!boostRequest) {
      console.log(`Pedido de boost NÃO encontrado para ID: ${id}`);
      return NextResponse.json({ error: 'Pedido de boost não encontrado.' }, { status: 404 });
    }

    console.log(`Pedido de boost encontrado para ID: ${id}`);
    return NextResponse.json({ boostRequest }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido de boost:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar pedido de boost.' }, { status: 500 });
  }
}

// Você pode adicionar métodos PUT/DELETE aqui se precisar editar/excluir pedidos de boost