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

    // Aplica filtro de busca por termo
    if (searchTerm) {
      where.OR = [
        // @ts-ignore
        { title: { contains: searchTerm, mode: 'insensitive' } }, 
        // @ts-ignore
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Aplica filtro por categoria
    if (category) {
      where.category = category;
    }

    // Aplica filtro por jogo
    if (game) {
      where.game = game;
    }

    // Aplica filtro por preço
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

    return NextResponse.json({ listings }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar listagens:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar listagens.' }, { status: 500 });
  }
}

// Endpoint POST (para criar listagens com upload de imagem ou logo de jogo)
export async function POST(req: NextRequest) {
  console.log('API de Listagens (POST): Requisição recebida.');
  try {
    // 1. Verificar JWT_SECRET
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 2. Autenticar Usuário e Obter sellerId do Token JWT
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

    // 3. Obter os dados do formulário usando req.formData()
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const category = formData.get('category') as string;
    const game = formData.get('game') as string;
    const gameLogoUrl = formData.get('gameLogoUrl') as string | null;

    // Validação de campos obrigatórios
    if (!title || !description || !priceStr || !category || !game) {
      console.error('Dados de listagem inválidos. Campos obrigatórios ausentes.');
      return NextResponse.json({ error: 'Por favor, preencha todos os campos obrigatórios.' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 });
    }

    // Array para armazenar todos os URLs das imagens
    const imageUrls: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    let hasUploadedFiles = false;

    // Itera sobre todos os arquivos que começam com 'images['
    // Use `getAll` para pegar todos os arquivos com o mesmo nome (se o navegador enviar assim)
    // ou itere sobre `entries()` como fizemos antes. O `ListingForm` envia como `images[0]`, `images[1]`
    // então a iteração por `entries()` é a correta.
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

    // Se nenhuma imagem foi uploaded, e um gameLogoUrl foi fornecido, use-o como a primeira imagem
    if (!hasUploadedFiles && gameLogoUrl) {
      imageUrls.push(gameLogoUrl);
      console.log('Usando logo do jogo como imagem de fallback:', gameLogoUrl);
    }

    // Validação final de imagem (se não houver imagens enviadas E não houver logo de jogo)
    if (imageUrls.length === 0) {
      return NextResponse.json({ error: 'Por favor, selecione pelo menos uma imagem ou escolha um jogo com logo disponível.' }, { status: 400 });
    }

    const newList = await prisma.listing.create({
      data: {
        title: title,
        description: description,
        price: price,
        category: category,
        game: game,
        imageUrls: imageUrls, // ATUALIZADO: Usando o array de URLs
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
    // A validação de tamanho de arquivo já é feita dentro do loop.
    // Esta parte pode precisar de ajuste dependendo de como o erro é propagado se vários arquivos falharem.
    // if (error instanceof Error && error.message.includes('maxFileSize exceeded')) {
    //     return NextResponse.json({ error: 'Um dos arquivos de imagem é muito grande (máx. 5MB).' }, { status: 413 });
    // }
    
    return NextResponse.json({ error: 'Erro interno no servidor ao criar listagem.' }, { status: 500 });
  }
}