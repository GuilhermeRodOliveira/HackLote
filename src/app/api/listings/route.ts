// src/app/api/listings/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Endpoint GET para buscar listagens (AGORA COM FILTROS!)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const searchTerm = searchParams.get('search');
    const category = searchParams.get('category');
    const game = searchParams.get('game');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const where: Prisma.ListingWhereInput = {};

    if (searchTerm) {
      where.OR = [
        // @ts-ignore
        { title: { contains: searchTerm, mode: 'insensitive' } },
        // @ts-ignore
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (game) {
      where.game = game;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        (where.price as Prisma.FloatFilter).gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        (where.price as Prisma.FloatFilter).lte = parseFloat(maxPrice);
      }
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
      include: {
        seller: {
          select: {
            id: true,
            usuario: true,
            nome: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // ##################################################################
    // ## ALTERAÇÃO AQUI: PARSE O JSON DE `imageUrls` para um array. ##
    // ##################################################################
    const listingsWithParsedImages = listings.map(listing => {
      // Cria uma cópia da listagem para evitar mutação direta
      const parsedListing = { ...listing };
      try {
        // Se imageUrls existir, tenta fazer o parse do JSON
        // Retorna null ou um array de strings
        parsedListing.imageUrls = listing.imageUrls ? JSON.parse(listing.imageUrls) : null;
      } catch (e) {
        console.error(`Erro ao fazer parse do JSON para a listagem ${listing.id}:`, e);
        // Em caso de erro, define como null para evitar quebra do front-end
        parsedListing.imageUrls = null;
      }
      return parsedListing;
    });

    return NextResponse.json({ listings: listingsWithParsedImages }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar listagens:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar listagens.' }, { status: 500 });
  }
}

// Endpoint POST (para criar listagens com upload de imagem ou logo de jogo)
export async function POST(req: NextRequest) {
  console.log('API de Listagens (POST): Requisição recebida.');
  try {
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      console.log('Nenhum token encontrado. Retornando 401.');
      return NextResponse.json({ error: 'Não autenticado para criar listagem.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
      console.log('Token decodificado com sucesso. Seller ID (do token):', decodedToken.id);
    } catch (jwtError) {
      console.error('ERRO: Erro ao verificar token JWT para criar listagem:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado para criar listagem.' }, { status: 401 });
    }

    const sellerId = decodedToken.id;

    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const category = formData.get('category') as string;
    const game = formData.get('game') as string;
    const gameLogoUrl = formData.get('gameLogoUrl') as string | null;

    if (!title || !description || !priceStr || !category || !game) {
      console.error('Dados de listagem inválidos. Campos obrigatórios ausentes.');
      return NextResponse.json({ error: 'Por favor, preencha todos os campos obrigatórios.' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 });
    }

    const imageUrls: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    let hasUploadedFiles = false;

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('images[') && value instanceof File && value.size > 0) {
        hasUploadedFiles = true;

        if (value.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `O arquivo '${value.name}' é muito grande (máx. 5MB).` }, { status: 413 });
        }
        if (!ALLOWED_MIME_TYPES.includes(value.type)) {
          return NextResponse.json({ error: `Tipo de arquivo '${value.name}' não suportado. Use JPG, PNG, GIF ou WebP.` }, { status: 415 });
        }

        const uniqueFileName = `${Date.now()}-${value.name}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        await fs.mkdir(uploadDir, { recursive: true });
        const buffer = Buffer.from(await value.arrayBuffer());
        await fs.writeFile(filePath, buffer);

        imageUrls.push(`/uploads/${uniqueFileName}`);
        console.log(`Imagem de upload salva em: /uploads/${uniqueFileName}`);
      }
    }

    if (!hasUploadedFiles && gameLogoUrl) {
      imageUrls.push(gameLogoUrl);
      console.log('Usando logo do jogo como imagem de fallback:', gameLogoUrl);
    }

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: 'Por favor, selecione pelo menos uma imagem ou escolha um jogo com logo disponível.' }, { status: 400 });
    }

    // ################################################################
    // ## ALTERAÇÃO AQUI: CONVERTE O ARRAY DE URLS PARA STRING JSON. ##
    // ################################################################
    const imageUrlsAsJson = JSON.stringify(imageUrls);

    const newList = await prisma.listing.create({
      data: {
        title: title,
        description: description,
        price: price,
        category: category,
        game: game,
        imageUrls: imageUrlsAsJson, // Agora passamos a string JSON
        sellerId: sellerId,
      },
    });
    console.log('Listagem criada com sucesso:', newList.id);

    return NextResponse.json({ message: 'Listagem criada com sucesso!', listing: newList }, { status: 201 });

  } catch (error) {
    console.error('ERRO GERAL ao criar listagem:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'Erro de validação: ID do vendedor não encontrado ou inválido.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro interno no servidor ao criar listagem.' }, { status: 500 });
  }
}