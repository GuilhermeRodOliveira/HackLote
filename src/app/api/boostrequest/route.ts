import { NextResponse, NextRequest } from 'next/server'; // Importar NextRequest
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // Importar jwt para verificar o token

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

// Interface para o payload do JWT (deve ser a mesma definida em app/api/me/route.ts)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

export async function POST(req: NextRequest) { // Tipar req como NextRequest
  try {
    // 1. Verificar JWT_SECRET
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 2. Autenticar Usuário e Obter userId do Token
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para boost request POST:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = decodedToken.id; // O ID do usuário logado vem do token

    // 3. Obter Dados do Corpo da Requisição (REMOVIDO userId daqui)
    const body = await req.json();
    const { game, currentRank, desiredRank, description } = body; // userId não é mais esperado no body

    // 4. Validação Básica de Campos
    if (!game || !currentRank || !desiredRank) { // userId não é mais validado aqui
      return NextResponse.json(
        { error: 'Jogo, Rank Atual e Rank Desejado são obrigatórios.' },
        { status: 400 }
      );
    }

    // 5. Criar o Pedido de Boost no Banco de Dados
    const request = await prisma.boostRequest.create({
      data: {
        userId, // Usar o userId obtido do token
        game,
        currentRank,
        desiredRank,
        description,
      },
    });

    return NextResponse.json(
      { message: 'Pedido de boost criado com sucesso!', request },
      { status: 201 } // Status 201 Created para sucesso na criação
    );
  } catch (error) {
    console.error('Erro ao criar boost request:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao criar pedido de boost.' },
      { status: 500 }
    );
  }
}

// Adicione no mesmo arquivo (src/app/api/boostrequest/route.ts)
// O método GET já está bom, mas vou incluí-lo para completude
export async function GET() {
  try {
    const requests = await prisma.boostRequest.findMany({
      include: {
        user: true, // Inclui os dados do usuário criador do pedido
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar pedidos.' },
      { status: 500 }
    );
  }
}
