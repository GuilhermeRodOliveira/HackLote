import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

// Interface para o payload do JWT
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Endpoint POST para criar uma nova avaliação
export async function POST(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 1. Autenticar Utilizador e Obter reviewerId do Token
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para criar avaliação:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const reviewerId = decodedToken.id; // O utilizador que está a dar a avaliação

    // 2. Obter Dados do Corpo da Requisição
    const body = await req.json();
    const { reviewedId, rating, comment } = body; // reviewedId é o utilizador que está a ser avaliado

    // 3. Validação Básica de Campos
    if (!reviewedId || rating === undefined || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'ID do utilizador avaliado e pontuação (1-5) são obrigatórios.' }, { status: 400 });
    }

    // 4. Prevenir auto-avaliação
    if (reviewerId === reviewedId) {
      return NextResponse.json({ error: 'Não pode avaliar o seu próprio perfil.' }, { status: 400 });
    }

    // 5. Verificar se já existe uma avaliação deste reviewer para este reviewed (baseado na @@unique)
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_reviewedId: { // Usa o campo @@unique do Prisma
          reviewerId: reviewerId,
          reviewedId: reviewedId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Já avaliou este utilizador.' }, { status: 409 }); // 409 Conflict
    }

    // 6. Criar a Avaliação no Banco de Dados
    const newReview = await prisma.review.create({
      data: {
        reviewerId,
        reviewedId,
        rating,
        comment: comment || null, // Comentário é opcional
      },
      include: {
        reviewer: { // Incluir dados do avaliador para o frontend
          select: { id: true, usuario: true, nome: true, email: true }
        }
      }
    });

    return NextResponse.json({ message: 'Avaliação criada com sucesso!', review: newReview }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar avaliação:', error);
    // Tratar violação de unique constraint (se alguém tentar criar duas vezes sem o findUnique acima)
    if (error.code === 'P2002' && error.meta?.target?.includes('reviewerId_reviewedId')) {
      return NextResponse.json({ error: 'Já avaliou este utilizador.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno no servidor ao criar avaliação.' }, { status: 500 });
  }
}
