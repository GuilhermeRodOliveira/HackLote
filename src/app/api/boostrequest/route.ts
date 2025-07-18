// src/app/api/boostrequest/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma'; // Caminho correto para src/utils/prisma
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client'; // Importante para o tratamento de erros do Prisma

const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Endpoint GET para buscar todos os pedidos de boost
export async function GET(req: NextRequest) {
  console.log('API de Pedidos de Boost (GET): Requisição recebida.');
  try {
    const requests = await prisma.boostRequest.findMany({
      include: {
        user: true, // Inclui os dados do usuário criador do pedido
      },
      orderBy: {
        createdAt: 'desc',
      },
      // Não use 'take' aqui se você quer todos os pedidos para a página de listagem
      // take: 50, 
    });

    console.log('API de Pedidos de Boost (GET): Retornando dados - Tipo:', typeof requests, 'É Array:', Array.isArray(requests), 'Primeiro item:', requests.length > 0 ? requests[0] : 'N/A');
    
    return NextResponse.json(requests); // Retorna o array direto
  } catch (error) {
    console.error('ERRO ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar pedidos.' },
      { status: 500 }
    );
  }
}

// Endpoint POST para criar um novo pedido de boost
export async function POST(req: NextRequest) {
  console.log('API de Pedidos de Boost (POST): Requisição recebida.');
  try {
    // 1. Verificar JWT_SECRET
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 2. Autenticar Usuário e Obter userId do Token
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      console.log('Nenhum token encontrado. Retornando 401.');
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
      console.log('Token decodificado com sucesso. User ID:', decodedToken.id);
    } catch (jwtError) {
      console.error('ERRO: Erro ao verificar token JWT para boost request POST:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = decodedToken.id; // O ID do usuário logado vem do token

    // 3. Obter Dados do Corpo da Requisição
    const body = await req.json();
    const { game, currentRank, desiredRank, description } = body;

    // 4. Validação Básica de Campos
    if (!game || !currentRank || !desiredRank) {
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

    // 6. Criar notificação para o próprio usuário que criou o pedido (opcional)
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'BOOST_REQUEST_CREATED',
        message: `Seu pedido de boost para ${game} foi criado com sucesso!`,
        relatedBoostRequestId: request.id,
      },
    });

    return NextResponse.json(
      { message: 'Pedido de boost criado com sucesso!', request },
      { status: 201 } // Status 201 Created para sucesso na criação
    );
  } catch (error) {
    console.error('ERRO ao criar boost request:', error);
    // Erros específicos do Prisma podem ser tratados aqui
    return NextResponse.json(
      { error: 'Erro interno no servidor ao criar pedido de boost.' },
      { status: 500 }
    );
  }
}
