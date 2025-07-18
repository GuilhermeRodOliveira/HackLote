import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// GET: Buscar perfil do usuário
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } 
) {
  try {
    // << HACK PARA O AVISO DO TURBOPACK/NEXT.JS 15.3.5 >>
    // Isso força o 'params' a ser "awaitado", mesmo que ele já seja um objeto.
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams; // Obtém o ID do utilizador da URL

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        usuario: true,
        // email: true, // Geralmente email não é público no perfil. Se quiser, descomente.
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

// PUT: Atualizar perfil do usuário
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } } 
) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // << HACK PARA O AVISO DO TURBOPACK/NEXT.JS 15.3.5 >>
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

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

    if (decodedToken.id !== id) {
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
    if (profilePictureBase64 !== undefined && profilePictureBase64 !== null) {
      dataToUpdate.profilePictureUrl = profilePictureBase64;
    } else if (profilePictureBase64 === null) {
      dataToUpdate.profilePictureUrl = null;
    }

    const currentUserProfile = await prisma.user.findUnique({
      where: { id },
      select: { usuario: true },
    });

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    if (usuario !== undefined && usuario !== currentUserProfile.usuario) {
      const existingUser = await prisma.user.findUnique({
        where: { usuario },
      });

      if (existingUser && existingUser.id !== id) {
        return NextResponse.json({ error: 'Nome de usuário já está em uso.' }, { status: 409 });
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
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar perfil.' }, { status: 500 });
  }
}