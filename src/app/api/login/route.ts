// src/app/api/login/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers'; // Certifique-se de importar 'cookies' aqui

const JWT_SECRET = process.env.JWT_SECRET; 

// Lista de domínios de e-mail permitidos (mesma lista do registro)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com',
];

// Configurações de segurança para login
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MINUTES = 15; // Duração do bloqueio em minutos

export async function POST(req: Request) {
  try {
    console.log('--- Início da requisição de LOGIN ---');

    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const body = await req.json();
    let { email, password } = body; 
    email = email.toLowerCase();

    console.log(`Tentativa de login para o email: ${email}`);

    // 1. Validação de domínio de e-mail
    const emailDomain = email.split('@')[1];
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())) {
      console.log('Validação de domínio de e-mail falhou.');
      return NextResponse.json({ 
        error: 'Email ou senha inválidos.' 
      }, { status: 400 });
    }

    // 2. Validação de complexidade da senha (no login, isso geralmente não é feito, mas está no seu código)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|`~-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('Validação de complexidade da senha falhou (no login).');
      return NextResponse.json({ 
        error: 'Email ou senha inválidos.' 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email } }); 

    if (!user) {
      console.log('Usuário não encontrado no banco de dados.');
      return NextResponse.json({ error: 'Email ou senha inválidos.' }, { status: 401 });
    }

    // 3. Verificar status de bloqueio
    if (user.lockoutUntil && new Date() < user.lockoutUntil) {
      const remainingTime = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / (1000 * 60));
      console.log(`Conta bloqueada para ${email}. Tempo restante: ${remainingTime} minutos.`);
      return NextResponse.json({ 
        error: `Sua conta está temporariamente bloqueada. Tente novamente em ${remainingTime} minutos.` 
      }, { status: 429 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('Senha incorreta.');
      // 4. Senha incorreta - Incrementar tentativas falhas
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: {
            increment: 1,
          },
        },
      });

      let errorMessage = 'Email ou senha inválidos.'; // Mensagem genérica
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - updatedUser.failedLoginAttempts;

      if (attemptsLeft <= 0) {
        // Bloquear a conta
        const lockoutTime = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockoutUntil: lockoutTime,
            failedLoginAttempts: 0, // Resetar tentativas após bloqueio
          },
        });
        errorMessage = `Você excedeu o número de tentativas. Sua conta foi bloqueada por ${LOCKOUT_DURATION_MINUTES} minutos.`;
        return NextResponse.json({ error: errorMessage }, { status: 401 });
      } else if (updatedUser.failedLoginAttempts >= 1) { // Após a primeira falha, começar a mostrar tentativas restantes
        errorMessage += ` Você tem mais ${attemptsLeft} tentativa(s).`;
        if (attemptsLeft <= (MAX_LOGIN_ATTEMPTS - 1)) { // Se já errou pelo menos uma vez
          errorMessage += ` Se esquecer a senha, clique em "Esqueci senha".`;
        }
      }

      return NextResponse.json({ error: errorMessage }, { status: 401 });

    } else {
      console.log('Senha correta. Login bem-sucedido.');
      // 5. Login bem-sucedido - Resetar tentativas falhas e desbloquear
      if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: null,
          },
        });
        console.log('Tentativas de login resetadas e conta desbloqueada (se aplicável).');
      }

      // Cria payload com dados mínimos para o token
      const tokenPayload = {
        id: user.id,
        usuario: user.usuario,
        email: user.email,
      };

      console.log('Gerando JWT...');
      const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: '7d' });
      console.log('JWT gerado com sucesso. Definindo cookie...');

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
        httpOnly: true, // Importante para segurança (não acessível via JavaScript no navegador)
        secure: process.env.NODE_ENV === 'production', // Apenas em HTTPS em produção
        path: '/', // O cookie estará disponível em todas as rotas
        maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
        sameSite: 'lax', // Proteção contra CSRF
      });

      console.log('Cookie de token definido na resposta.');
      return response;
    }

  } catch (error) {
    console.error('ERRO GERAL no login:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  } finally {
    console.log('--- Fim da requisição de LOGIN ---');
  }
}