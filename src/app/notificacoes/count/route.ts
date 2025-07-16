import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

// Interface para o payload do JWT
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      // Se não autenticado, retorna 0 notificações
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para contagem de notificações:', jwtError);
      // Se o token for inválido, retorna 0 notificações
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const userId = decodedToken.id;

    // Buscar as preferências de notificação de boost do usuário
    const userPreferences = await prisma.boostNotificationPreference.findMany({
      where: { userId: userId },
      select: {
        game: true,
        boostType: true,
      },
    });

    if (userPreferences.length === 0) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const whereConditions = userPreferences.map(pref => ({
      game: pref.game,
      // boostType: pref.boostType, // Opcional: se quiser filtrar por tipo de boost também
    }));

    // Contar os pedidos de boost que correspondem às preferências
    const notificationsCount = await prisma.boostRequest.count({
      where: {
        OR: whereConditions,
        // Opcional: Excluir pedidos criados pelo próprio usuário
        // userId: {
        //   not: userId
        // }
      },
    });

    return NextResponse.json({ count: notificationsCount }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar contagem de notificações de boost:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar contagem de notificações.' }, { status: 500 });
  }
}
