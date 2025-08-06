// src/app/api/register/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Importar para gerar códigos aleatórios


const JWT_SECRET = process.env.JWT_SECRET; // JWT_SECRET deve ser carregado do .env

// Lista de domínios de e-mail temporários conhecidos
const TEMPORARY_EMAIL_DOMAINS = [
  'mailinator.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'mail.tm', 'yopmail.com', 'disposablemail.com', 'trash-mail.com',
  'fakemail.com', 'tempmail.com', 'tempmail.dev',
  'signinid.com', 'jxbav.com', 'uorak.com', 'letterprotect.net',
  'vugitublo.com', 'mailshan.com', 'nesopf.com',
];

// Lista de domínios de e-mail permitidos (mesma lista do login)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com',
];

// Função para gerar um código de verificação numérico
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: NextRequest) {
  try {
    console.log('--- Início da requisição de REGISTRO ---');

    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const body = await req.json();
    let { nome, usuario, email, password } = body;

    // NOVO: Converter o e-mail para minúsculas para garantir case-insensitivity em todo o processo
    email = email.toLowerCase();

    // NOVO LOG: Para verificar os dados recebidos
    console.log('Dados recebidos para registro:', { nome, usuario, email });

    // 1. Validação Básica de Campos
    if (!nome || !usuario || !email || !password) {
      console.error('Erro de validação: Campos obrigatórios faltando.');
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    // 2. Validação de Domínio de E-mail (Temporário e Permitido)
    const emailDomain = email.split('@')[1];
    if (emailDomain && TEMPORARY_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())) {
      console.error('Erro de validação: E-mail temporário não permitido.');
      return NextResponse.json({ error: 'E-mails temporários não são permitidos.' }, { status: 400 });
    }
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())) {
      console.error('Erro de validação: Domínio de e-mail não permitido.');
      return NextResponse.json({
        error: `Não é possível criar conta com esse domínio ${emailDomain}.`
      }, { status: 400 });
    }

    // 3. Validação de Complexidade da Senha
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|`~-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      console.error('Erro de validação: Senha não atende aos requisitos de complexidade.');
      return NextResponse.json({
        error: 'A senha deve conter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.'
      }, { status: 400 });
    }

    // 4. Verifica se o nome de usuário já está em uso na tabela FINAL de usuários
    const existingUserByUsername = await prisma.user.findUnique({ where: { usuario: usuario } });
    if (existingUserByUsername) {
      console.error('Erro de validação: Nome de usuário já em uso.');
      return NextResponse.json({ error: 'Nome de usuário já em uso.' }, { status: 409 });
    }

    // 5. Verifica se o e-mail já está em uso por um usuário VERIFICADO
    const existingVerifiedUser = await prisma.user.findUnique({ where: { email: email } });
    if (existingVerifiedUser) {
        console.error('Erro de validação: E-mail já cadastrado e verificado.');
        return NextResponse.json({ error: 'Este e-mail já está cadastrado e verificado.' }, { status: 409 });
    }

    // 6. Hash da senha
    console.log('Fazendo hash da senha...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Senha hashed com sucesso.');

    // 7. Gera e Salva o Código de Verificação e os Dados Temporários (upsert)
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Código expira em 10 minutos

    console.log('Dados para upsert em VerificationCode:', { email, verificationCode, expiresAt, nome, usuario, hashedPassword: '[HASHED_PASSWORD]' }); // Não logar a senha hashed completa

    try {
      const upsertResult = await prisma.verificationCode.upsert({
        where: { email: email },
        update: {
          code: verificationCode,
          expiresAt: expiresAt,
          nome: nome,
          usuario: usuario,
          hashedPassword: hashedPassword,
        },
        create: {
          email: email, // O e-mail já está em minúsculas aqui
          code: verificationCode,
          expiresAt: expiresAt,
          nome: nome,
          usuario: usuario,
          hashedPassword: hashedPassword,
        },
      });
      console.log('Resultado do upsert em VerificationCode:', upsertResult.id ? 'Sucesso' : 'Falha'); // Log mais conciso

    } catch (dbError: any) {
      console.error('Erro no Prisma ao salvar VerificationCode:', dbError);
      return NextResponse.json({ error: `Erro ao salvar dados de verificação: ${dbError.message || 'Erro de banco de dados.'}` }, { status: 500 });
    }

    // 8. Envia o e-mail de verificação (chamando o endpoint send-verification-email)
    console.log('Chamando endpoint de envio de e-mail de verificação...');
    const sendEmailRes = await fetch(`${req.nextUrl.origin}/api/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, usuario, verificationCode }),
    });

    if (!sendEmailRes.ok) {
        const errorDetails = await sendEmailRes.text();
        console.error('Falha ao chamar o endpoint de envio de e-mail. Detalhes:', errorDetails);
        return NextResponse.json({ error: 'Erro ao enviar o código de verificação. Tente novamente.' }, { status: 500 });
    }
    console.log('Endpoint de envio de e-mail chamado com sucesso.');

    // Retorna sucesso, informando que o código foi enviado para verificação
    return NextResponse.json({
      message: 'Cadastro iniciado! Um código de verificação foi enviado para o seu e-mail.',
      email: email, // Retorna o email para preencher o campo na página de verificação
    }, { status: 200 });

  } catch (error) {
    console.error('Erro geral no processo de registro (enviar código):', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao iniciar o registro.' }, { status: 500 });
  } finally {
    console.log('--- Fim da requisição de REGISTRO ---');
  }
}