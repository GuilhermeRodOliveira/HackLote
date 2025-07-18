import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const body = await req.json();
    let { email, password } = body; // Usar 'let' para poder reatribuir

    // NOVO: Converter o e-mail para minúsculas para garantir case-insensitivity
    email = email.toLowerCase();

    // 1. Validação de domínio de e-mail
    const emailDomain = email.split('@')[1];
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Email ou senha inválidos.' // Mensagem genérica
      }, { status: 400 });
    }

    // 2. Validação de complexidade da senha (aplicada apenas se a senha for nova ou alterada, mas aqui é para login)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|`~-]).{8,}$/;
    
    if (!passwordRegex.test(password)) {
      return NextResponse.json({ 
        error: 'Email ou senha inválidos.' // Mensagem genérica
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email } }); // A busca agora é feita com o email em minúsculas

    if (!user) {
      return NextResponse.json({ error: 'Email ou senha inválidos.' }, { status: 401 }); // Mensagem genérica
    }

    // 3. Verificar status de bloqueio
    if (user.lockoutUntil && new Date() < user.lockoutUntil) {
      const remainingTime = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / (1000 * 60));
      return NextResponse.json({ 
        error: `Sua conta está temporariamente bloqueada. Tente novamente em ${remainingTime} minutos.` 
      }, { status: 429 }); // 429 Too Many Requests
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
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
      // 5. Login bem-sucedido - Resetar tentativas falhas e desbloquear
      if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: null,
          },
        });
      }

      // Cria payload com dados mínimos para o token
      const tokenPayload = {
        id: user.id,
        usuario: user.usuario,
        email: user.email,
      };

      // Gera o JWT com validade, ex: 7 dias
      const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: '7d' });

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
        httpOnly: true, // Importante para segurança (não acessível via JavaScript no navegador)
        secure: process.env.NODE_ENV === 'production', // Apenas em HTTPS em produção
        path: '/', // O cookie estará disponível em todas as rotas
        maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
        sameSite: 'lax', // Proteção contra CSRF
      });

      return response;
    }

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
