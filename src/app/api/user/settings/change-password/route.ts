// src/app/api/user/settings/change-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../utils/prisma';
import bcrypt from 'bcryptjs'; // Certifique-se de que bcryptjs está instalado: npm install bcryptjs

export async function PUT(request: Request) {
  try {
    // TODO: Autenticação - Obter o ID do usuário da sessão
    // const session = await getServerSession();
    // if (!session || !session.user || !session.user.id) {
    //   return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    // }
    // const userId = session.user.id;
    // Por enquanto, para teste, vamos simular um userId. SUBSTITUA PELA LÓGICA DE SESSÃO REAL!
    const userId = 'SEU_ID_DE_USUARIO_DE_TESTE'; // Ex: 'clx0p7z8n0000j2l0v8j4h7c6' - Pegue um ID existente no seu DB

    const { currentPassword, newPassword, confirmNewPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json({ message: 'A nova senha e a confirmação não coincidem.' }, { status: 400 });
    }

    // TODO: Adicionar validação de complexidade da senha (mínimo de caracteres, maiúsculas, números, símbolos)
    if (newPassword.length < 6) { // Exemplo simples
      return NextResponse.json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Verificar a senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Senha atual incorreta.' }, { status: 401 });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 é o saltRounds

    // Atualizar a senha no banco de dados
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao alterar senha.' }, { status: 500 });
  }
}