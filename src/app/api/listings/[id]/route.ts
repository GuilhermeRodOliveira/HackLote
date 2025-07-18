import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma'; // Confirme o caminho

// Endpoint GET para buscar uma única listagem pelo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // O ID da listagem virá nos parâmetros da URL
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams; // Obtém o ID da listagem da URL

    if (!id) {
      return NextResponse.json({ error: 'ID da listagem não fornecido.' }, { status: 400 });
    }

    // Busca a listagem no banco de dados pelo ID
    const listing = await prisma.listing.findUnique({
      where: {
        id: id,
      },
      include: {
        // Inclui as informações do vendedor
        seller: {
          select: {
            id: true,
            usuario: true,
            email: true,
            nome: true,
          },
        },
      },
      // REMOVIDO: orderBy: { createdAt: 'desc' }, // << NÃO USAR 'orderBy' com 'findUnique'
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listagem não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ listing }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar detalhes da listagem:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar detalhes da listagem.' }, { status: 500 });
  }
}