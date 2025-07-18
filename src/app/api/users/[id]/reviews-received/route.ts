// src/app/api/users/[id]/reviews-received/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../utils/prisma'; // Caminho para o seu Prisma Client

// Endpoint GET para buscar as avaliações recebidas por um utilizador específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // O ID do utilizador cujo perfil está a ser visualizado
) {
  try {
    // CORREÇÃO: Para silenciar o aviso "params should be awaited" em algumas versões do Next.js/Turbopack
    // O 'params' já é um objeto, mas esta forma pode ser necessária para o linter.
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams; // Obtém o ID do utilizador da URL

    if (!id) {
      return NextResponse.json({ error: 'ID do utilizador não fornecido.' }, { status: 400 });
    }

    // Busca as avaliações onde 'reviewedId' é o ID do utilizador do perfil
    const reviews = await prisma.review.findMany({
      where: {
        reviewedId: id,
      },
      include: {
        // Inclui informações básicas do avaliador
        reviewer: {
          select: {
            id: true,
            usuario: true, // Nome de utilizador do avaliador
            nome: true,    // Nome completo do avaliador
            profilePictureUrl: true, // URL da foto de perfil do avaliador
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Ordena pelas avaliações mais recentes
      },
    });

    return NextResponse.json({ reviews }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar avaliações recebidas:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar avaliações recebidas.' }, { status: 500 });
  }
}