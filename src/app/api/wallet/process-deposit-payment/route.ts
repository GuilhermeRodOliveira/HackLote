// src/app/api/wallet/process-deposit-payment/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken';

// SDK do Mercado Pago para Node.js
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Suas credenciais do Mercado Pago
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// Configurar o SDK do Mercado Pago
let client: MercadoPagoConfig | null = null;
let paymentClient: Payment | null = null;

if (MP_ACCESS_TOKEN) {
  client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN, locale: 'pt-BR' } as any);
  paymentClient = new Payment(client);
} else {
  console.error('MP_ACCESS_TOKEN não está definido nas variáveis de ambiente.');
}

// Interface para o payload do token JWT (reutilizada)
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Função auxiliar para obter o userId do token (reutilizada)
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
    console.log('API /api/wallet/process-deposit-payment: Requisição recebida.');

    if (!client || !paymentClient) {
      console.error('API /api/wallet/process-deposit-payment: Mercado Pago não inicializado.');
      return NextResponse.json({ message: 'Erro de configuração do servidor: Mercado Pago não inicializado.' }, { status: 500 });
    }

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      console.warn('API /api/wallet/process-deposit-payment: Usuário não autenticado.');
      return NextResponse.json({ message: 'Não autenticado ou token inválido.' }, { status: 401 });
    }
    console.log('API /api/wallet/process-deposit-payment: userId obtido:', userId);


    const body = await request.json();
    console.log('API /api/wallet/process-deposit-payment: Corpo da requisição:', body);

    const { amount, paymentMethod, cardToken, payer } = body;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      console.warn('API /api/wallet/process-deposit-payment: Valor de depósito inválido.');
      return NextResponse.json({ message: 'Valor de depósito inválido. Deve ser um número positivo.' }, { status: 400 });
    }

    let paymentResult: any;
    let transactionStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED' = 'PENDING';
    let transactionDescription = `Depósito de ${depositAmount.toFixed(2)} via ${paymentMethod}`;
    let externalPaymentId: string | null = null;
    let qrCodeBase64: string | null = null;
    let copyPasteCode: string | null = null;
    let barcodeUrl: string | null = null;
    let barcodeNumber: string | null = null;

    const notificationUrl = process.env.NEXT_PUBLIC_NGROK_URL
      ? `${process.env.NEXT_PUBLIC_NGROK_URL}/api/webhooks/mercadopago`
      : `${request.nextUrl.origin}/api/webhooks/mercadopago`;
    console.log('API /api/wallet/process-deposit-payment: notification_url:', notificationUrl);


    const payerData = {
      email: payer.email,
      first_name: payer.first_name,
      last_name: payer.last_name,
      identification: {
        type: payer.identification.type,
        number: String(payer.identification.number),
      },
    };
    console.log('API /api/wallet/process-deposit-payment: Dados do pagador para MP:', payerData);

    // Lógica para cada método de pagamento
    if (paymentMethod === 'pix') {
      const paymentData = {
        transaction_amount: depositAmount,
        description: `Depósito para carteira - Usuário ${userId}`,
        payment_method_id: 'pix',
        payer: payerData,
        notification_url: notificationUrl,
        external_reference: `deposit-${userId}-${Date.now()}`,
      };
      console.log('API /api/wallet/process-deposit-payment: Dados para criar pagamento Pix:', paymentData);

      paymentResult = await paymentClient.create({ body: paymentData });
      console.log('API /api/wallet/process-deposit-payment: Resposta do Mercado Pago (Pix):', paymentResult);

      if (paymentResult.status === 'pending') {
        qrCodeBase64 = paymentResult.point_of_interaction.transaction_data.qr_code_base64;
        copyPasteCode = paymentResult.point_of_interaction.transaction_data.qr_code;
        externalPaymentId = paymentResult.id.toString();
        transactionDescription = `Depósito Pix - Aguardando pagamento`;
      } else {
        transactionStatus = 'FAILED';
        transactionDescription = `Depósito Pix - Falha na criação do pagamento`;
        console.error('API /api/wallet/process-deposit-payment: Erro na criação do pagamento Pix:', paymentResult.status_detail);
        return NextResponse.json({ message: paymentResult.status_detail || 'Falha ao gerar Pix.' }, { status: 400 });
      }

    } else if (paymentMethod === 'boleto') {
      const paymentData = {
        transaction_amount: depositAmount,
        description: `Depósito para carteira - Usuário ${userId}`,
        payment_method_id: 'bolbradesco',
        payer: payerData,
        notification_url: notificationUrl,
        external_reference: `deposit-${userId}-${Date.now()}`,
      };
      console.log('API /api/wallet/process-deposit-payment: Dados para criar pagamento Boleto:', paymentData);

      paymentResult = await paymentClient.create({ body: paymentData });
      console.log('API /api/wallet/process-deposit-payment: Resposta do Mercado Pago (Boleto):', paymentResult);

      if (paymentResult.status === 'pending') {
        barcodeUrl = paymentResult.barcode.content;
        barcodeNumber = paymentResult.barcode.content;
        externalPaymentId = paymentResult.id.toString();
        transactionDescription = `Depósito Boleto - Aguardando pagamento`;
      } else {
        transactionStatus = 'FAILED';
        transactionDescription = `Depósito Boleto - Falha na criação do pagamento`;
        console.error('API /api/wallet/process-deposit-payment: Erro na criação do pagamento Boleto:', paymentResult.status_detail);
        return NextResponse.json({ message: paymentResult.status_detail || 'Falha ao gerar Boleto.' }, { status: 400 });
      }

    } else if (paymentMethod === 'credit_card') {
      if (!cardToken) {
        console.warn('API /api/wallet/process-deposit-payment: Token do cartão ausente para cartão de crédito.');
        return NextResponse.json({ message: 'Token do cartão é obrigatório para cartão de crédito.' }, { status: 400 });
      }

      const paymentData = {
        transaction_amount: depositAmount,
        token: cardToken,
        description: `Depósito para carteira - Usuário ${userId}`,
        installments: 1,
        payer: payerData,
        notification_url: notificationUrl,
        external_reference: `deposit-${userId}-${Date.now()}`,
      };
      console.log('API /api/wallet/process-deposit-payment: Dados para criar pagamento Cartão:', paymentData);

      paymentResult = await paymentClient.create({ body: paymentData });
      console.log('API /api/wallet/process-deposit-payment: Resposta do Mercado Pago (Cartão):', paymentResult);

      if (paymentResult.status === 'approved') {
        transactionStatus = 'COMPLETED';
        transactionDescription = `Depósito Cartão de Crédito - Aprovado`;
        externalPaymentId = paymentResult.id.toString();
        // O saldo será atualizado via transação no final, para garantir atomicidade
      } else if (paymentResult.status === 'pending') {
        transactionStatus = 'PENDING';
        transactionDescription = `Depósito Cartão de Crédito - Pendente`;
        externalPaymentId = paymentResult.id.toString();
      } else {
        transactionStatus = 'FAILED';
        transactionDescription = `Depósito Cartão de Crédito - ${paymentResult.status_detail || 'Recusado'}`;
        console.error('API /api/wallet/process-deposit-payment: Erro na criação do pagamento Cartão:', paymentResult.status_detail);
        return NextResponse.json({ message: paymentResult.status_detail || 'Falha ao processar cartão.' }, { status: 400 });
      }

    } else {
      console.warn('API /api/wallet/process-deposit-payment: Método de pagamento não suportado.');
      return NextResponse.json({ message: 'Método de pagamento não suportado.' }, { status: 400 });
    }

    // Usar uma transação de banco de dados para garantir atomicidade:
    // 1. Encontrar/Criar a carteira
    // 2. Atualizar o saldo (se o pagamento for aprovado instantaneamente, como alguns cartões)
    // 3. Criar a transação
    const result = await prisma.$transaction(async (tx) => {
      // Encontrar ou criar a carteira do usuário DENTRO da transação
      const userWallet = await tx.wallet.upsert({
        where: { userId: userId },
        update: {},
        create: {
          userId: userId,
          balance: 0.00,
        },
        select: {
          id: true,
          balance: true, // Selecionar o saldo para verificar
        },
      });
      console.log('API /api/wallet/process-deposit-payment: Carteira encontrada/criada DENTRO da transação:', userWallet.id);
      console.log('API /api/wallet/process-deposit-payment: ID da carteira para transação:', userWallet.id); // NOVO LOG

      // CORREÇÃO: Verificar explicitamente se userWallet e userWallet.id são válidos
      if (!userWallet || !userWallet.id) {
          console.error('API /api/wallet/process-deposit-payment: Erro: userWallet ou userWallet.id é inválido dentro da transação. Abortando transação.');
          // Lançar um erro para que a transação do Prisma seja revertida
          throw new Error('Erro interno: Carteira do usuário não pôde ser criada ou encontrada.');
      }

      // Se o pagamento foi aprovado instantaneamente pelo MP (cartão de crédito),
      // atualiza o saldo AGORA dentro da transação do Prisma.
      if (transactionStatus === 'COMPLETED') {
        await tx.wallet.update({
          where: { id: userWallet.id },
          data: { balance: { increment: depositAmount } },
        });
        console.log('API /api/wallet/process-deposit-payment: Saldo da carteira atualizado DENTRO da transação.');
      }

      // Crie a transação no seu banco de dados, associada à carteira encontrada/criada
      const newTransaction = await tx.transaction.create({
        data: {
          walletId: userWallet.id, // Usar o ID da carteira obtido DENTRO da transação
          type: 'DEPOSIT',
          amount: depositAmount,
          status: transactionStatus,
          description: transactionDescription,
          relatedOrderId: externalPaymentId,
        },
      });
      console.log('API /api/wallet/process-deposit-payment: Transação criada no DB DENTRO da transação:', newTransaction.id);

      return { newTransaction, newBalance: userWallet.balance + (transactionStatus === 'COMPLETED' ? depositAmount : 0) };
    });

    // Retorna a resposta para o frontend
    const responseData: any = {
      message: `Pagamento ${paymentMethod} iniciado com sucesso!`,
      transactionId: result.newTransaction.id,
      status: result.newTransaction.status,
      newBalance: result.newBalance, // Retorna o novo saldo para o frontend
    };

    if (qrCodeBase64) responseData.qrCodeBase64 = qrCodeBase64;
    if (copyPasteCode) responseData.copyPasteCode = copyPasteCode;
    if (barcodeUrl) responseData.barcodeUrl = barcodeUrl;
    if (barcodeNumber) responseData.barcodeNumber = barcodeNumber;

    console.log('API /api/wallet/process-deposit-payment: Resposta final para o frontend:', responseData);
    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('API /api/wallet/process-deposit-payment: Erro geral ao processar depósito com Mercado Pago:', error);
    let errorMessage = 'Erro interno do servidor ao processar depósito.';
    if (error.status_code && error.message) {
        errorMessage = `Erro do Mercado Pago (${error.status_code}): ${error.message}`;
    } else if (error.cause && Array.isArray(error.cause) && error.cause.length > 0 && error.cause[0].description) {
        errorMessage = `Erro de validação do Mercado Pago: ${error.cause[0].description}`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: error.status_code || 500 });
  }
}
