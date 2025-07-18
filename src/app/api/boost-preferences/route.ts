import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma'; // Adicione esta linha
// Certifique-se de que o caminho relativo esteja correto para cada rota!
import jwt from 'jsonwebtoken';

// ALTERADO: Removido o valor hardcoded de fallback. JWT_SECRET agora virá APENAS de process.env
const JWT_SECRET = process.env.JWT_SECRET; 

// Interface for the JWT payload (should be the same defined in app/api/me/route.ts)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// NOVO: Interface para o corpo da requisição POST de preferências de boost
interface BoostPreferencesRequestBody {
  preferences: Array<{ game: string; boostType: string; subscribed: boolean }>;
}

// GET endpoint to fetch boost notification preferences for the logged-in user
export async function GET(req: NextRequest) {
  try {
    // Adicionado verificação para garantir que JWT_SECRET esteja definido
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 1. Verify User Authentication
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para boost-preferences GET:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = decodedToken.id; // The ID of the logged-in user

    // 2. Fetch user preferences from the database
    const preferences = await prisma.boostNotificationPreference.findMany({
      where: {
        userId: userId,
      },
    });

    return NextResponse.json({ preferences }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar preferências de boost:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar preferências.' }, { status: 500 });
  }
}

// POST endpoint to create/update boost notification preferences for the logged-in user
export async function POST(req: NextRequest) {
  try {
    // Adicionado verificação para garantir que JWT_SECRET esteja definido
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 1. Verify User Authentication
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para boost-preferences POST:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = decodedToken.id; // The ID of the logged-in user

    // 2. Get Request Body Data
    const body = await req.json() as BoostPreferencesRequestBody;
    const newPreferences = body.preferences; // Now 'body.preferences' is recognized

    if (!Array.isArray(newPreferences)) {
      return NextResponse.json({ error: 'Formato de dados inválido. Esperado um array de preferências.' }, { status: 400 });
    }

    // 3. Process Preferences: create, update, or delete
    await prisma.boostNotificationPreference.deleteMany({
      where: {
        userId: userId,
      },
    });

    const preferencesToCreate = newPreferences
      .filter(p => p.subscribed) // Filter only those the user wants to subscribe to
      .map(p => ({
        userId: userId,
        game: p.game,
        boostType: p.boostType,
      }));

    if (preferencesToCreate.length > 0) {
      await prisma.boostNotificationPreference.createMany({
        data: preferencesToCreate,
      });
    }

    return NextResponse.json({
      message: 'Preferências de notificação de boost salvas com sucesso!',
      savedPreferencesCount: preferencesToCreate.length,
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao salvar preferências de boost:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao salvar preferências.' }, { status: 500 });
  }
}
