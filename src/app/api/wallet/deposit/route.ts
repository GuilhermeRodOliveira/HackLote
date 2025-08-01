// src/app/api/wallet/deposit/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Interface para o payload do token JWT (reutilizada)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Função auxiliar para obter o userId do token (reutilizada de outras rotas)
function getUserIdFromRequest(request: NextRequest): string | null {
  const tokenCookie = request.cookies.get('token');
  if (!tokenCookie || !tokenCookie.value) {
    console.warn('getUserIdFromRequest: Token cookie não encontrado.');
    return null;
  }

  try {
    if (!JWT_SECRET) {
      console.error('getUserIdFromRequest: JWT_SECRET não está definido.');
      return null;
    }
    const decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    return decodedToken.id;
  } catch (error) {
    console.error('getUserIdFromRequest: Erro ao decodificar token JWT:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ message: 'Não autenticado ou token inválido.' }, { status: 401 });
    }

    const { amount } = await request.json();

    // 1. Validação do valor do depósito
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ message: 'Valor de depósito inválido. Deve ser um número positivo.' }, { status: 400 });
    }

    // 2. Encontrar ou criar a carteira do usuário
    // Usamos upsert para garantir que a carteira exista.
    const wallet = await prisma.wallet.upsert({
      where: { userId: userId },
      update: {}, // Não atualiza nada se já existe, apenas garante que existe
      create: {
        userId: userId,
        balance: 0.00, // Saldo inicial se for criada agora
      },
      select: {
        id: true,
        balance: true,
      },
    });

    // 3. Iniciar uma transação de banco de dados para garantir atomicidade
    // Isso é crucial para operações financeiras: ou tudo acontece, ou nada acontece.
    const result = await prisma.$transaction(async (prisma) => {
      // Atualizar o saldo da carteira
      const updatedWallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: depositAmount, // Adiciona o valor ao saldo existente
          },
        },
        select: {
          balance: true, // Retorna o novo saldo
        },
      });

      // Criar um registro de transação
      const newTransaction = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount: depositAmount,
          status: 'COMPLETED', // Marcamos como COMPLETED para este fluxo direto
          description: `Depósito de ${depositAmount.toFixed(2)} via API direta.`,
        },
      });

      return { updatedWallet, newTransaction };
    });

    // Retorna o novo saldo e uma mensagem de sucesso
    return NextResponse.json({
      message: 'Depósito realizado com sucesso!',
      newBalance: result.updatedWallet.balance,
      transactionId: result.newTransaction.id,
    }, { status: 200 });

  } catch (error) {
    console.error('API POST /api/wallet/deposit: Erro ao processar depósito:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao processar depósito.' }, { status: 500 });
  }
}
