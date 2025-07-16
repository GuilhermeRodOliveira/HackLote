import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // Para gerar o token de login após a verificação

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET; // JWT_SECRET deve ser carregado do .env

export async function POST(req: NextRequest) {
  try {
    // Verifica se JWT_SECRET está definido. Se não, retorna erro de configuração.
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const body = await req.json();
    const { email, code } = body;

    // 1. Validação Básica de Campos: Verifica se email e código foram fornecidos.
    if (!email || !code) {
      return NextResponse.json({ error: 'Email e código de verificação são obrigatórios.' }, { status: 400 });
    }

    // 2. Busca o código de verificação no banco de dados para o email fornecido.
    const verificationEntry = await prisma.verificationCode.findUnique({
      where: { email: email },
    });

    // 3. Valida o código e a expiração:
    // Se não encontrou nenhuma entrada para o email.
    if (!verificationEntry) {
      return NextResponse.json({ error: 'Código de verificação não encontrado para este e-mail.' }, { status: 400 });
    }

    // Se o código fornecido não corresponde ao código salvo.
    if (verificationEntry.code !== code) {
      return NextResponse.json({ error: 'Código de verificação inválido.' }, { status: 400 });
    }

    // Se o código já expirou.
    if (new Date() > verificationEntry.expiresAt) {
      // Opcional: deleta o código expirado do banco de dados para limpeza.
      await prisma.verificationCode.delete({ where: { email: email } });
      return NextResponse.json({ error: 'Código de verificação expirado. Por favor, solicite um novo.' }, { status: 400 });
    }

    // 4. Se todas as validações passaram, cria o usuário definitivo no modelo User.
    const newUser = await prisma.user.create({
      data: {
        nome: verificationEntry.nome,
        usuario: verificationEntry.usuario,
        email: verificationEntry.email,
        password: verificationEntry.hashedPassword, // A senha já está hash aqui
      },
    });

    // 5. Deleta o código de verificação do banco de dados, pois já foi usado.
    await prisma.verificationCode.delete({
      where: { email: email },
    });

    // 6. Gera um token JWT e configura um cookie HttpOnly para logar o usuário automaticamente.
    // O usuário estará logado assim que esta resposta for processada pelo frontend.
    const tokenPayload = {
      id: newUser.id,
      usuario: newUser.usuario,
      email: newUser.email,
    };
    // Garante que JWT_SECRET é tratado como string para jwt.sign
    const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: '7d' }); 

    const response = NextResponse.json({
      message: 'E-mail verificado e conta criada com sucesso!',
      user: {
        id: newUser.id,
        usuario: newUser.usuario,
        email: newUser.email,
      },
    }, { status: 200 });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Apenas em HTTPS em produção
      path: '/', // O cookie estará disponível em todas as rotas
      maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
      sameSite: 'lax', // Proteção contra CSRF
    });

    return response;

  } catch (error: any) {
    // Trata erros específicos do Prisma, como violação de restrição única (P2002).
    if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
            return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 409 });
        }
        if (error.meta?.target?.includes('usuario')) {
            return NextResponse.json({ error: 'Este nome de usuário já está em uso.' }, { status: 409 });
        }
    }
    // Loga o erro completo para depuração no servidor.
    console.error('Erro ao verificar e-mail e criar conta:', error);
    // Retorna uma mensagem de erro genérica para o cliente.
    return NextResponse.json({ error: 'Erro interno no servidor ao verificar e-mail.' }, { status: 500 });
  }
}
