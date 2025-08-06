// src/app/api/listings/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
}

// Handler GET para buscar uma listagem específica por ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const listingId = params.id;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
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
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listagem não encontrada.' }, { status: 404 });
    }

    const parsedListing = { ...listing };
    try {
      parsedListing.imageUrls = listing.imageUrls ? JSON.parse(listing.imageUrls) : null;
    } catch (e) {
      console.error(`Erro ao fazer parse do JSON para a listagem ${listing.id}:`, e);
      parsedListing.imageUrls = null;
    }
    
    return NextResponse.json(parsedListing, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar a listagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// Handler DELETE para excluir uma listagem específica por ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const listingId = params.id;

  if (!JWT_SECRET) {
    console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
    return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
  }

  const cookieStore = cookies();
  const token = (await cookieStore).get('token'); // Alteração corrigida aqui

  if (!token || !token.value) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let decodedToken: JwtUserPayload;
  try {
    decodedToken = jwt.verify(token.value, JWT_SECRET) as JwtUserPayload;
  } catch (jwtError) {
    return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
  }

  const userId = decodedToken.id;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        sellerId: true,
        imageUrls: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listagem não encontrada.' }, { status: 404 });
    }

    if (listing.sellerId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para excluir esta listagem.' }, { status: 403 });
    }

    try {
      if (listing.imageUrls) {
        const imageUrlsArray = JSON.parse(listing.imageUrls);
        const uploadDir = path.join(process.cwd(), 'public');
        for (const imageUrl of imageUrlsArray) {
          const filePath = path.join(uploadDir, imageUrl);
          await fs.unlink(filePath).catch(e => console.error(`Falha ao excluir arquivo ${filePath}:`, e));
        }
      }
    } catch (e) {
      console.error('Erro ao tentar excluir arquivos de imagem:', e);
    }
    
    await prisma.listing.delete({
      where: { id: listingId },
    });

    return NextResponse.json({ message: 'Listagem excluída com sucesso.' }, { status: 200 });

  } catch (error) {
    console.error('ERRO GERAL ao deletar a listagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao deletar a listagem.' }, { status: 500 });
  }
}