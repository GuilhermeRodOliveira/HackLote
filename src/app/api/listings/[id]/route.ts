// src/app/api/listings/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import { z } from 'zod';

const listingUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  imageUrls: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  attributes: z.any().optional(),
  game: z.string().optional(),
});

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrls?: string;
}

// SIMULAÇÃO DE BANCO DE DADOS: Agora com o formato de URL corrigido
let mockListings: Listing[] = [
  { 
    id: 'cmltsl2r0007peo9bgtznee', 
    title: 'Conta de Exemplo', 
    description: 'Uma conta de exemplo.', 
    price: 50.0, 
    imageUrls: '/img/lol.png,/img/valorant.png' // URLs separadas por vírgula e com barra inicial
  },
  { 
    id: '1', 
    title: 'Outro Item', 
    description: 'Outro item para teste', 
    price: 22.0, 
    imageUrls: '/img/rocketleague.png' 
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'ID da listagem não fornecido.' }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: id },
      include: {
        seller: {
          select: {
            id: true,
            usuario: true,
            email: true,
          },
        },
      },
    });

    if (!listing) {
      const mockListing = mockListings.find(l => l.id === id);
      if (mockListing) {
        return NextResponse.json(mockListing);
      }
      return NextResponse.json({ error: 'Listagem não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Erro ao buscar listagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();

  const validation = listingUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.issues }, { status: 400 });
  }

  try {
    const updatedListing = await prisma.listing.update({
      where: { id: id },
      data: validation.data,
    });

    return NextResponse.json({ message: 'Listagem atualizada com sucesso!', listing: updatedListing });
  } catch (error) {
    console.error('Erro ao atualizar listagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}