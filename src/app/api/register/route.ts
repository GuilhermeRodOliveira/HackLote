import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { nome, usuario, email, password } = await req.json();

    if (!nome || !usuario || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'E-mail já está em uso.' }, { status: 400 });
    }

    const existingUsuario = await prisma.user.findUnique({ where: { usuario } });
    if (existingUsuario) {
      return NextResponse.json({ error: 'Usuário já está em uso.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nome,
        usuario,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'Conta criada com sucesso!', user: { id: user.id, nome: user.nome, usuario: user.usuario } });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
