// src/app/api/notifications/boost-requests/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma'; // Caminho para o seu Prisma Client
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

// Interface para o payload do JWT (deve ser a mesma definida em app/api/me/route.ts)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  console.log('API de Notificações de Boost: Requisição recebida.');
  try {
    // 1. Verificar JWT_SECRET
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor: JWT_SECRET ausente.' }, { status: 500 });
    }
    console.log('JWT_SECRET está definido.');

    // 2. Autenticar Usuário e Obter userId do Token
    const tokenCookie = req.cookies.get('token');
    console.log('Token cookie:', tokenCookie ? 'Presente' : 'Ausente');

    if (!tokenCookie || !tokenCookie.value) {
      console.log('Nenhum token encontrado. Retornando 401.');
      return NextResponse.json({ error: 'Não autenticado: Token ausente.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload; // << CORRIGIDO: O 'a' extra foi removido aqui!
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
      console.log('Token decodificado com sucesso. User ID:', decodedToken.id);
    } catch (jwtError) {
      console.error('ERRO: Erro ao verificar token JWT para notificações de boost:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = decodedToken.id; // O ID do usuário logado

    // 3. Buscar as preferências de notificação de boost do usuário
    console.log('Buscando preferências de notificação para userId:', userId);
    const userPreferences = await prisma.boostNotificationPreference.findMany({
      where: { userId: userId },
      select: {
        game: true,
        boostType: true,
      },
    });
    console.log('Preferências de usuário encontradas:', userPreferences.length);

    // Se o usuário não tem preferências, não há pedidos para mostrar
    if (userPreferences.length === 0) {
      console.log('Usuário não tem preferências de notificação. Retornando lista vazia.');
      return NextResponse.json({ boostRequests: [] }, { status: 200 });
    }

    // 4. Construir a cláusula WHERE para buscar pedidos de boost que correspondam às preferências
    const whereConditions = userPreferences.map((pref: { game: any; }) => ({
      game: pref.game,
    }));
    console.log('Condições WHERE para boost requests:', JSON.stringify(whereConditions));

    // Usar 'OR' para combinar as condições de jogo/tipo de boost
    const boostRequests = await prisma.boostRequest.findMany({
      where: {
        OR: whereConditions,
      },
      include: {
        user: { // Incluir informações do usuário que fez o pedido
          select: {
            id: true,
            usuario: true,
            email: true,
            nome: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Ordenar pelos mais recentes
      },
      take: 20, // Limitar o número de resultados para não sobrecarregar
    });
    console.log('Boost requests encontrados:', boostRequests.length);

    return NextResponse.json({ boostRequests }, { status: 200 });

  } catch (error) {
    console.error('ERRO GERAL: Erro ao buscar notificações de boost:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar notificações.' }, { status: 500 });
  }
}