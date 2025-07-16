import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Lista de domínios de e-mail permitidos (mesma lista do login e registro)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com',
];

// Configuração do Nodemailer (use suas credenciais reais do .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Função para gerar um código numérico de 6 dígitos
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Log para depuração
    console.log('Requisição para send-code recebida para o email:', email);

    if (!email) {
      console.error('Erro: E-mail não fornecido na requisição.');
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    // 1. Validação de Domínio de E-mail
    const emailDomain = email.split('@')[1];
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())) {
      // Retorna uma mensagem genérica para não revelar se o e-mail existe ou não
      console.warn(`Tentativa de redefinição de senha com domínio não permitido: ${email}`);
      return NextResponse.json({ message: 'Se um e-mail correspondente for encontrado, um código de redefinição de senha foi enviado.' }, { status: 200 });
    }

    // 2. Verifica se o e-mail existe no modelo User (apenas usuários existentes podem redefinir senha)
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      // Retorna uma mensagem genérica para não revelar se o e-mail existe ou não
      console.warn(`Tentativa de redefinição de senha para e-mail inexistente: ${email}`);
      return NextResponse.json({ message: 'Se um e-mail correspondente for encontrado, um código de redefinição de senha foi enviado.' }, { status: 200 });
    }

    // 3. Gera e Salva o Código de Redefinição no VerificationCode
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Código expira em 15 minutos

    try {
      await prisma.verificationCode.upsert({
        where: { email: email },
        update: {
          code: verificationCode,
          expiresAt: expiresAt,
          nome: user.nome,
          usuario: user.usuario,
          hashedPassword: user.password,
        },
        create: {
          email: email,
          code: verificationCode,
          expiresAt: expiresAt,
          nome: user.nome,
          usuario: user.usuario,
          hashedPassword: user.password,
        },
      });
      console.log(`Código de verificação salvo no DB para ${email}: ${verificationCode}`);
    } catch (dbError: any) {
      console.error('Erro no Prisma ao salvar VerificationCode para redefinição:', dbError);
      return NextResponse.json({ error: 'Erro de banco de dados ao gerar código de redefinição.' }, { status: 500 });
    }

    // 4. Envia o e-mail com o código de redefinição
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Redefinição de Senha - Hack Lote',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Olá!</h2>
          <p>Você solicitou uma redefinição de senha para a sua conta no Hack Lote.</p>
          <p>Seu código de redefinição de senha é:</p>
          <h1 style="color: #FF6347; font-size: 2em; text-align: center; background-color: #f0f0f0; padding: 15px; border-radius: 8px;">${verificationCode}</h1>
          <p>Este código é válido por 15 minutos.</p>
          <p>Se você não solicitou esta redefinição, por favor, ignore este e-mail.</p>
          <p>Atenciosamente,</p>
          <p>Equipe Hack Lote</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[E-MAIL REDEFINIÇÃO ENVIADO] Código para ${email}: ${verificationCode}`);
    } catch (mailError: any) {
      console.error('Erro ao enviar e-mail de redefinição:', mailError);
      if (mailError.responseCode) {
        console.error(`Nodemailer Response Code: ${mailError.responseCode}`);
        console.error(`Nodemailer Response: ${mailError.response}`);
      }
      return NextResponse.json({ error: 'Erro ao enviar o e-mail de redefinição. Verifique suas configurações de e-mail.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Se um e-mail correspondente for encontrado, um código de redefinição de senha foi enviado.' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro geral no endpoint send-code:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao solicitar redefinição.' }, { status: 500 });
  }
}
