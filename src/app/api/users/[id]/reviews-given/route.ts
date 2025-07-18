// src/app/api/users/[id]/reviews-given/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../utils/prisma'; // << CORRIGIDO O CAMINHO!

// Endpoint GET para buscar as avaliações dadas por um utilizador específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // O ID do utilizador cujo perfil está a ser visualizado
) {
  try {
    // CORREÇÃO: Para silenciar o aviso "params should be awaited" em algumas versões do Next.js/Turbopack
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams; // Obtém o ID do utilizador da URL

    if (!id) {
      return NextResponse.json({ error: 'ID do utilizador não fornecido.' }, { status: 400 });
    }

    // Busca as avaliações onde 'reviewerId' é o ID do utilizador do perfil
    const reviews = await prisma.review.findMany({
      where: {
        reviewerId: id,
      },
      include: {
        // Inclui informações básicas do utilizador avaliado
        reviewed: {
          select: {
            id: true,
            usuario: true, // Nome de utilizador do avaliado
            nome: true,    // Nome completo do avaliado
            profilePictureUrl: true, // URL da foto de perfil do avaliado
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Ordena pelas avaliações mais recentes
      },
    });

    return NextResponse.json({ reviews }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar avaliações dadas:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar avaliações dadas.' }, { status: 500 });
  }
}