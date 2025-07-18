// src/app/api/user/settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/prisma';// Certifique-se de que este caminho está correto para sua instância do Prisma Client
// import { getServerSession } from 'next-auth'; // Se você estiver usando NextAuth.js para autenticação

// Função para obter as configurações do usuário (GET)
export async function GET(request: Request) {
  try {
    // TODO: Autenticação - Obter o ID do usuário da sessão
    // const session = await getServerSession();
    // if (!session || !session.user || !session.user.id) {
    //   return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    // }
    // const userId = session.user.id;
    // Por enquanto, para teste, vamos simular um userId. SUBSTITUA PELA LÓGICA DE SESSÃO REAL!
    const userId = 'SEU_ID_DE_USUARIO_DE_TESTE'; // Ex: 'clx0p7z8n0000j2l0v8j4h7c6' - Pegue um ID existente no seu DB

    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        nome: true,
        usuario: true,
        email: true, // Email pode ser útil para exibição, mas não alteração direta aqui
        bio: true,
        profilePictureUrl: true,
        country: true,
        receiveMarketingEmails: true,
        receiveOrderUpdates: true,
        receiveMessageNotifications: true,
        receiveInAppNotifications: true,
        isProfilePublic: true,
        isActivityPublic: true,
        preferredLanguage: true,
        theme: true,
        preferredCurrency: true,
      },
    });

    if (!userSettings) {
      return NextResponse.json({ message: 'Configurações do usuário não encontradas' }, { status: 404 });
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error('Erro ao obter configurações do usuário:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para atualizar as configurações do usuário (PUT/PATCH)
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

    const body = await request.json();

    // Filtra os campos que podem ser atualizados
    const updatableFields = [
      'nome', 'usuario', 'bio', 'profilePictureUrl', 'country',
      'receiveMarketingEmails', 'receiveOrderUpdates', 'receiveMessageNotifications', 'receiveInAppNotifications',
      'isProfilePublic', 'isActivityPublic',
      'preferredLanguage', 'theme', 'preferredCurrency'
    ];

    const dataToUpdate: { [key: string]: any } = {};
    for (const field of updatableFields) {
      if (body[field] !== undefined) { // Garante que apenas campos presentes no body sejam atualizados
        dataToUpdate[field] = body[field];
      }
    }

    // Validação básica para o nome de usuário (se existir e for alterado)
    if (dataToUpdate.usuario !== undefined) {
      const existingUserWithUsername = await prisma.user.findUnique({
        where: { usuario: dataToUpdate.usuario },
      });
      // Permite que o próprio usuário mantenha seu username, mas impede que outro o utilize
      if (existingUserWithUsername && existingUserWithUsername.id !== userId) {
        return NextResponse.json({ message: 'Nome de usuário já está em uso.' }, { status: 409 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { // Retorna apenas os campos atualizados (e outros relevantes)
        nome: true,
        usuario: true,
        bio: true,
        profilePictureUrl: true,
        country: true,
        receiveMarketingEmails: true,
        receiveOrderUpdates: true,
        receiveMessageNotifications: true,
        receiveInAppNotifications: true,
        isProfilePublic: true,
        isActivityPublic: true,
        preferredLanguage: true,
        theme: true,
        preferredCurrency: true,
      },
    });

    return NextResponse.json({ message: 'Configurações atualizadas com sucesso!', user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar configurações do usuário:', error);
    // Erros específicos do Prisma podem ser tratados aqui para mensagens mais amigáveis
    // Por exemplo, se houver um erro de validação de tipo de dado ou unique constraint
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar configurações' }, { status: 500 });
  }
}