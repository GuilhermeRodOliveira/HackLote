import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // Defina sua variável de ambiente

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Email não encontrado.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // Cria payload com dados mínimos para o token
    const tokenPayload = {
      id: user.id,
      usuario: user.usuario,
      email: user.email,
    };

    // Gera o JWT com validade, ex: 7 dias
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Retorna response com cookie HttpOnly
    const response = NextResponse.json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        usuario: user.usuario,
        email: user.email,
      },
    });

    // Define cookie 'token' com opções de segurança
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
