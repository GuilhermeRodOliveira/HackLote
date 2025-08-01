// src/app/api/verify-email/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma';
import jwt from 'jsonwebtoken'; // Para gerar o token de login após a verificação
import { serialize } from 'cookie'; // Importar para lidar com cookies

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
      where: { email: email.toLowerCase() }, // Garante que o email seja minúsculo
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
      await prisma.verificationCode.delete({ where: { email: email.toLowerCase() } });
      return NextResponse.json({ error: 'Código de verificação expirado. Por favor, solicite um novo.' }, { status: 400 });
    }

    // 4. Verifica se o usuário já existe na tabela final (caso a verificação seja reenviada ou haja algum bug)
    const existingUser = await prisma.user.findUnique({
        where: { email: verificationEntry.email },
    });

    if (existingUser) {
        // Se o usuário já existe, e está verificado, apenas loga ele novamente
        if (existingUser.isVerified) {
            console.warn('Usuário já verificado tentando verificar novamente:', existingUser.email);
            // Gera um novo token para o usuário existente e o loga novamente
            const tokenPayload = {
                id: existingUser.id,
                usuario: existingUser.usuario,
                email: existingUser.email,
            };
            const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: '7d' });

            const response = NextResponse.json({
                message: 'Sua conta já está verificada. Você foi logado novamente!',
                user: {
                    id: existingUser.id,
                    usuario: existingUser.usuario,
                    email: existingUser.email,
                },
            }, { status: 200 });

            response.cookies.set({
                name: 'token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
                sameSite: 'lax',
            });
            // Deleta o código de verificação, pois não é mais necessário
            await prisma.verificationCode.delete({ where: { email: email.toLowerCase() } });
            return response;
        } else {
            // Se o usuário existe mas não está verificado, atualiza para verificado
            const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: { isVerified: true },
            });
            console.log('Usuário existente atualizado para verificado:', updatedUser.email);
            // Prossegue para gerar o token e o cookie
        }
    }

    let userToLogin;

    if (!existingUser || !existingUser.isVerified) {
        // 5. Se não existe ou não está verificado, cria o usuário definitivo no modelo User.
        // Ou atualiza o existente para isVerified: true
        if (!existingUser) {
            userToLogin = await prisma.user.create({
                data: {
                    nome: verificationEntry.nome,
                    usuario: verificationEntry.usuario,
                    email: verificationEntry.email,
                    password: verificationEntry.hashedPassword, // A senha já está hash aqui
                    isVerified: true, // Marcar como verificado na criação
                },
            });
            console.log('Novo usuário criado após verificação:', userToLogin.id);
        } else {
            // Se o usuário existia mas não estava verificado, já foi atualizado acima.
            userToLogin = existingUser; // Usa o usuário que foi atualizado
        }
    } else {
        userToLogin = existingUser; // Já existe e já está verificado
    }


    // 6. Deleta o código de verificação do banco de dados, pois já foi usado.
    await prisma.verificationCode.delete({
      where: { email: email.toLowerCase() },
    });

    // 7. Gera um token JWT e configura um cookie HttpOnly para logar o usuário automaticamente.
    const tokenPayload = {
      id: userToLogin.id,
      usuario: userToLogin.usuario,
      email: userToLogin.email,
      isVerified: userToLogin.isVerified, // Incluir status de verificação no token
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: '7d' }); // Token válido por 7 dias

    const response = NextResponse.json({
      message: 'E-mail verificado e conta criada com sucesso!',
      user: {
        id: userToLogin.id,
        usuario: userToLogin.usuario,
        email: userToLogin.email,
        isVerified: userToLogin.isVerified,
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
    console.error('Erro ao verificar e-mail e criar conta:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao verificar e-mail.' }, { status: 500 });
  }
}