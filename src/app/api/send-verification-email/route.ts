import { NextResponse, NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto'; // Importe crypto se for usado para gerar códigos AQUI (mas não é mais necessário neste arquivo)

// Lista de domínios de e-mail permitidos (mesma lista do login e registro)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com',
];

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// REMOVIDO: Função generateVerificationCode() não é mais necessária aqui.
// REMOVIDO: Interação com Prisma (prisma.VerificationCode.upsert) não é mais necessária aqui.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Recebe email, usuario E O CÓDIGO DE VERIFICAÇÃO que já foi gerado e salvo pelo /api/register
    const { email, usuario, verificationCode } = body; 

    // 1. Validação Básica de Campos
    if (!email || !usuario || !verificationCode) {
      return NextResponse.json({ error: 'Email, nome de usuário e código de verificação são obrigatórios.' }, { status: 400 });
    }

    // 2. Validação de Domínio de E-mail (mesma lógica do registro/login)
    const emailDomain = email.split('@')[1];
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Apenas e-mails de domínios permitidos (ex: Gmail, Outlook, Yahoo) são aceitos.' 
      }, { status: 400 });
    }

    // 3. Envia o e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER, // Seu e-mail de envio (do .env)
      to: email,
      subject: 'Código de Verificação para Cadastro Hack Lote',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Olá, ${usuario}!</h2>
          <p>Obrigado por se cadastrar no Hack Lote.</p>
          <p>Seu código de verificação é:</p>
          <h1 style="color: #4CAF50; font-size: 2em; text-align: center; background-color: #f0f0f0; padding: 15px; border-radius: 8px;">${verificationCode}</h1>
          <p>Este código é válido por 10 minutos.</p>
          <p>Se você não solicitou este código, por favor, ignore este e-mail.</p>
          <p>Atenciosamente,</p>
          <p>Equipe Hack Lote</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[E-MAIL ENVIADO] Código de verificação para ${email}: ${verificationCode}`);

    return NextResponse.json({ message: 'E-mail enviado com sucesso!' }, { status: 200 });

  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error);
    if (error instanceof Error) {
        console.error('Detalhes do erro do Nodemailer:', error.message);
    }
    return NextResponse.json({ error: 'Erro interno no servidor ao enviar código de verificação.' }, { status: 500 });
  }
}
