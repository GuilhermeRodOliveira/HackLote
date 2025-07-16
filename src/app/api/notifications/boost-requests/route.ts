import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

export async function GET(req: NextRequest) {
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
      console.error('Erro ao verificar token JWT para notificações de boost:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = decodedToken.id; // O ID do usuário logado

    // 3. Buscar as preferências de notificação de boost do usuário
    const userPreferences = await prisma.boostNotificationPreference.findMany({
      where: { userId: userId },
      select: {
        game: true,
        boostType: true,
      },
    });

    // Se o usuário não tem preferências, não há pedidos para mostrar
    if (userPreferences.length === 0) {
      return NextResponse.json({ boostRequests: [] }, { status: 200 });
    }

    // 4. Construir a cláusula WHERE para buscar pedidos de boost que correspondam às preferências
    const whereConditions = userPreferences.map(pref => ({
      game: pref.game,
      // Opcional: Se boostType for muito específico, você pode querer buscar apenas por jogo.
      // Ou, se os pedidos de boost tiverem um campo para 'tipo de boost', você pode usar:
      // boostType: pref.boostType,
    }));

    // Usar 'OR' para combinar as condições de jogo/tipo de boost
    const boostRequests = await prisma.boostRequest.findMany({
      where: {
        OR: whereConditions,
        // Opcional: Excluir pedidos criados pelo próprio usuário (se um booster não puder ver os próprios pedidos)
        // userId: {
        //   not: userId
        // }
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

    return NextResponse.json({ boostRequests }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar notificações de boost:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar notificações.' }, { status: 500 });
  }
}
