// src/app/api/me/route.ts
import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken'; // Importe a biblioteca jsonwebtoken
import { prisma } from '../../../utils/prisma'; // Importe o Prisma Client

// Defina uma interface para o payload do seu JWT
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number; // Issued At
  exp: number; // Expiration Time
}

// É crucial que esta JWT_SECRET seja a mesma usada para assinar o token no login
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; 

export async function GET(req: NextRequest) {
  try {
    // Obtenha o cookie 'token' da requisição
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado: Token não encontrado.' }, { status: 401 });
    }

    const token = tokenCookie.value;

    let decodedToken: JwtUserPayload; // Tipando decodedToken com a interface
    try {
      // Verifica e decodifica o token usando a mesma chave secreta
      decodedToken = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      // Se o token for inválido (expirado, modificado, etc.)
      console.error('Erro ao verificar token JWT em /api/me:', jwtError);
      return NextResponse.json({ error: 'Não autenticado: Token inválido ou expirado.' }, { status: 401 });
    }

    // Agora que temos o ID do usuário do token, buscamos os dados completos do perfil no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: {
        id: true,
        usuario: true,
        email: true,
        nome: true, // Inclua o campo nome
        bio: true, // Inclua o campo bio
        profilePictureUrl: true, // Inclua a URL da foto de perfil
        country: true, // Inclua o campo país
        // Inclua quaisquer outros campos de perfil que você queira que o frontend tenha acesso imediato
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado no banco de dados.' }, { status: 404 });
    }

    // Retorna o objeto de usuário completo
    return NextResponse.json({ user: user });

  } catch (error) {
    console.error('Erro no endpoint /api/me:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
