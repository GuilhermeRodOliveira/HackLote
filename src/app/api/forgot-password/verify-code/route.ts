import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken'; // Para gerar um token temporário se necessário (não usado aqui para simplificar)


const JWT_SECRET = process.env.JWT_SECRET; // Carregar JWT_SECRET do .env

export async function POST(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const body = await req.json();
    const { email, code } = body;

    // 1. Validação Básica de Campos
    if (!email || !code) {
      return NextResponse.json({ error: 'E-mail e código de verificação são obrigatórios.' }, { status: 400 });
    }

    // 2. Busca o código de verificação no banco de dados
    const verificationEntry = await prisma.verificationCode.findUnique({
      where: { email: email },
    });

    // 3. Valida o código e a expiração
    if (!verificationEntry) {
      return NextResponse.json({ error: 'Código de verificação não encontrado para este e-mail.' }, { status: 400 });
    }

    if (verificationEntry.code !== code) {
      return NextResponse.json({ error: 'Código de verificação inválido.' }, { status: 400 });
    }

    if (new Date() > verificationEntry.expiresAt) {
      // Opcional: deletar o código expirado aqui para limpeza
      await prisma.verificationCode.delete({ where: { email: email } });
      return NextResponse.json({ error: 'Código de verificação expirado. Por favor, solicite um novo.' }, { status: 400 });
    }

    // Se o código é válido e não expirado, o usuário pode prosseguir para redefinir a senha.
    // Não criamos o usuário aqui, apenas confirmamos que ele está autorizado a redefinir.
    // Os dados do usuário (nome, usuario, hashedPassword) ainda estão no verificationEntry
    // e serão usados na próxima etapa (reset-password/new-password).

    return NextResponse.json({ message: 'Código verificado com sucesso! Prossiga para redefinir sua senha.' }, { status: 200 });

  } catch (error) {
    console.error('Erro ao verificar código de redefinição de senha:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao verificar código.' }, { status: 500 });
  }
}
