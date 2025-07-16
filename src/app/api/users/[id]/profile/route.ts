import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// ===== GET: Buscar perfil de usuário =====
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        usuario: true,
        bio: true,
        profilePictureUrl: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ profile: userProfile }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar perfil de usuário:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar perfil.' }, { status: 500 });
  }
}

// ===== PUT: Atualizar perfil de usuário =====
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

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

    const authenticatedUserId = decodedToken.id;

    if (authenticatedUserId !== id) {
      return NextResponse.json({ error: 'Não autorizado a atualizar este perfil.' }, { status: 403 });
    }

    const body = await req.json();
    const { nome, usuario, bio, profilePictureBase64 } = body;

    const dataToUpdate: {
      nome?: string;
      usuario?: string;
      bio?: string;
      profilePictureUrl?: string | null;
    } = {};

    if (nome !== undefined) dataToUpdate.nome = nome;
    if (bio !== undefined) dataToUpdate.bio = bio;

    if (profilePictureBase64 !== undefined) {
      dataToUpdate.profilePictureUrl = profilePictureBase64 === null ? null : profilePictureBase64;
    }

    const currentUserProfile = await prisma.user.findUnique({
      where: { id },
      select: { usuario: true },
    });

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado para atualização.' }, { status: 404 });
    }

    if (usuario !== undefined && usuario !== currentUserProfile.usuario) {
      const existingUser = await prisma.user.findUnique({
        where: { usuario },
      });

      if (existingUser && existingUser.id !== id) {
        return NextResponse.json({ error: 'Nome de usuário já em uso por outro usuário.' }, { status: 409 });
      }

      dataToUpdate.usuario = usuario;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: 'Nenhum dado fornecido para atualização.' }, { status: 200 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        bio: true,
        profilePictureUrl: true,
      },
    });

    return NextResponse.json({ message: 'Perfil atualizado com sucesso!', profile: updatedUser }, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar perfil de usuário:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao atualizar perfil.' }, { status: 500 });
  }
}
