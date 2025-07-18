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
    const { searchParams } = new URL(req.url); // Obtém os parâmetros da URL
    
    // Extrai os parâmetros de filtro
    const searchTerm = searchParams.get('search');
    const category = searchParams.get('category');
    const game = searchParams.get('game'); // NOVO: Filtro por jogo
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const where: Prisma.ListingWhereInput = {}; // Objeto para construir a cláusula WHERE do Prisma

    // Aplica filtro de busca por termo
    if (searchTerm) {
      where.OR = [
        // REMOVIDO: mode: 'insensitive'
        { title: { contains: searchTerm } }, 
        { description: { contains: searchTerm } }, 
      ];
    }

    // Aplica filtro por categoria
    if (category) {
      where.category = category;
    }

    // NOVO: Aplica filtro por jogo
    if (game) {
      where.game = game;
    }

    // Aplica filtro por preço
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        (where.price as Prisma.FloatFilter).gte = parseFloat(minPrice); // Greater than or equal
      }
      if (maxPrice) {
        (where.price as Prisma.FloatFilter).lte = parseFloat(maxPrice); // Less than or equal
      }
    }

    const listings = await prisma.listing.findMany({
      where, // Aplica a cláusula WHERE construída
      orderBy: {
        createdAt: 'desc', // Ordena pelas mais recentes
      },
      take: 12, // Limita a 12 listagens por padrão (pode ser um parâmetro de paginação no futuro)
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

// Endpoint POST (para criar listagens com upload de imagem e autenticação)
export async function POST(req: NextRequest) {
  console.log('API de Listagens (POST): Requisição recebida.');
  try {
    // 1. Verificar JWT_SECRET
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 2. Autenticar Usuário e Obter sellerId do Token JWT
    const tokenCookie = req.cookies.get('token'); // Pega o token do cookie
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

    const sellerId = decodedToken.id; // <<< AQUI: O sellerId agora vem do usuário logado!

    // 3. Obter os dados do formulário usando req.formData()
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const category = formData.get('category') as string;
    const subCategory = formData.get('subCategory') as string;
    const game = formData.get('game') as string; // NOVO: Obtém o campo 'game'
    const imageFile = formData.get('image') as File;

    // Validação básica
    if (!title || !description || !priceStr || !category || !game || !imageFile) { // Adicionado 'game' à validação
      console.error('Dados de listagem inválidos ou imagem ausente.');
      return NextResponse.json({ error: 'Por favor, preencha todos os campos e selecione uma imagem.' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 });
    }

    // Validação do arquivo (tamanho e tipo)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'O arquivo de imagem é muito grande (máx. 5MB).' }, { status: 413 });
    }
    if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo de imagem não suportado. Use JPG, PNG, GIF ou WebP.' }, { status: 415 });
    }

    // 4. Salvar o arquivo de imagem localmente
    const uniqueFileName = `${Date.now()}-${imageFile.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, uniqueFileName);

    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/${uniqueFileName}`;
    console.log('Imagem salva em:', imageUrl);

    // 5. Salvar a nova listagem no banco de dados
    const newList = await prisma.listing.create({
      data: {
        title: title,
        description: description,
        price: price,
        category: category,
        subCategory: subCategory,
        game: game, // NOVO: Salva o jogo
        imageUrl: imageUrl,
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
    if (error instanceof Error && error.message.includes('maxFileSize exceeded')) {
        return NextResponse.json({ error: 'O arquivo de imagem é muito grande (máx. 5MB).' }, { status: 413 });
    }
    
    return NextResponse.json({ error: 'Erro interno no servidor ao criar listagem.' }, { status: 500 });
  }
}
