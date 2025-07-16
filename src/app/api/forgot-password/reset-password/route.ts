import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    // 1. Validação Básica de Campos
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'E-mail, código e nova senha são obrigatórios.' }, { status: 400 });
    }

    // 2. Valida o código de verificação novamente (segurança extra)
    const verificationEntry = await prisma.verificationCode.findUnique({
      where: { email: email },
    });

    if (!verificationEntry || verificationEntry.code !== code || new Date() > verificationEntry.expiresAt) {
      // Se o código não for encontrado, for inválido ou expirado, retorna erro.
      // Pode-se deletar o código expirado aqui também.
      if (verificationEntry && new Date() > verificationEntry.expiresAt) {
        await prisma.verificationCode.delete({ where: { email: email } });
      }
      return NextResponse.json({ error: 'Código de verificação inválido ou expirado.' }, { status: 400 });
    }

    // 3. Validação de complexidade da nova senha
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|`~-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({ 
        error: 'A nova senha deve conter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.' 
      }, { status: 400 });
    }

    // 4. Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. Atualiza a senha do usuário no banco de dados
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { password: hashedNewPassword },
    });

    // 6. Deleta o código de verificação, pois a senha foi redefinida com sucesso
    await prisma.verificationCode.delete({
      where: { email: email },
    });

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao redefinir senha.' }, { status: 500 });
  }
}
