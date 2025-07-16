import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Endpoint POST para criar uma nova listagem (código existente)
export async function POST(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const sellerId = decodedToken.id;

    const body = await req.json();
    const { title, description, price, category, subCategory, imageUrl, attributes } = body;

    if (!title || !description || !price || !category || !subCategory) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 });
    }
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'O preço deve ser um número positivo.' }, { status: 400 });
    }

    const newListing = await prisma.listing.create({
      data: {
        title,
        description,
        price,
        category,
        subCategory,
        imageUrl: imageUrl || null,
        attributes: attributes || {},
        sellerId,
      },
    });

    return NextResponse.json({
      message: 'Listagem criada com sucesso!',
      listing: newListing,
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar listagem:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao criar listagem.' }, { status: 500 });
  }
}

// ATUALIZADO: Endpoint GET para buscar listagens com filtros
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const searchTerm = searchParams.get('search'); // Termo de busca geral

    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    if (subCategory) {
      whereClause.subCategory = subCategory;
    }

    if (searchTerm) {
      // Adiciona busca por título ou descrição (case-insensitive)
      whereClause.OR = [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive', // Para PostgreSQL, MySQL. SQLite é case-insensitive por padrão.
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    const listings = await prisma.listing.findMany({
      where: whereClause, // Aplica os filtros
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ listings }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar listagens com filtros:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar listagens.' }, { status: 500 });
  }
}
