// src/app/api/webhooks/mercadopago/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import { MercadoPagoConfig, Payment } from 'mercadopago'; // Importar classes específicas

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET; // Chave secreta para validação do webhook (opcional, mas recomendado)

// Configure o SDK do Mercado Pago
let paymentClient: Payment | null = null;
if (MP_ACCESS_TOKEN) {
  const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
  paymentClient = new Payment(client);
} else {
  console.error('MP_ACCESS_TOKEN não está definido para o webhook.');
}

export async function POST(request: NextRequest) {
  try {
    // Para validação de webhook (opcional, mas recomendado para segurança)
    // const signature = request.headers.get('x-signature');
    // if (MP_WEBHOOK_SECRET && !isValidWebhookSignature(request.body, signature, MP_WEBHOOK_SECRET)) {
    //   return NextResponse.json({ message: 'Assinatura de webhook inválida.' }, { status: 403 });
    // }

    const body = await request.json();
    console.log('Webhook do Mercado Pago recebido:', body);

    if (body.type === 'payment') {
      const paymentId = body.data.id; // ID do pagamento no Mercado Pago

      if (!paymentId) {
        console.warn('Webhook de pagamento recebido sem ID de pagamento.');
        return NextResponse.json({ message: 'ID de pagamento não fornecido.' }, { status: 400 });
      }

      if (!paymentClient) {
        console.error('Cliente de pagamento do Mercado Pago não inicializado para webhook.');
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
      }

      let paymentDetails: any;
      try {
        // Busca os detalhes completos do pagamento no Mercado Pago
        paymentDetails = await paymentClient.get({ id: paymentId });
        console.log('Detalhes do pagamento do Mercado Pago:', paymentDetails);
      } catch (mpError: any) {
        // CORREÇÃO: Lidar com o erro 'Payment not found' diretamente aqui
        if (mpError.status_code === 404 && mpError.message === 'Payment not found') {
          console.warn(`Webhook: Pagamento ${paymentId} não encontrado no Mercado Pago. Possivelmente ID de teste ou pagamento inválido.`);
          // Retorna 200 OK para o Mercado Pago para que ele não tente reenviar infinitamente
          return NextResponse.json({ message: 'Pagamento não encontrado no Mercado Pago, notificação ignorada.' }, { status: 200 });
        }
        // Se for outro tipo de erro do MP, relança
        throw mpError;
      }


      // CORREÇÃO: Verificar se paymentDetails.id e paymentDetails.transaction_amount existem
      if (!paymentDetails.id || typeof paymentDetails.transaction_amount === 'undefined') {
        console.error('Detalhes do pagamento do Mercado Pago incompletos:', paymentDetails);
        return NextResponse.json({ message: 'Detalhes do pagamento incompletos do Mercado Pago.' }, { status: 400 });
      }

      const externalPaymentId = paymentDetails.id.toString();
      const paymentStatus = paymentDetails.status;
      const transactionAmount = paymentDetails.transaction_amount;
      const userIdFromExternalReference = paymentDetails.external_reference?.split('-')[1]; // Extrai o userId da external_reference

      if (!userIdFromExternalReference) {
        console.error('ID do usuário não encontrado na referência externa do pagamento:', externalPaymentId);
        return NextResponse.json({ message: 'Referência externa inválida.' }, { status: 400 });
      }

      // Encontre a transação correspondente no seu banco de dados
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          relatedOrderId: externalPaymentId, // Usamos relatedOrderId para armazenar o ID do MP
        },
        include: {
          wallet: true, // Inclui a carteira para poder atualizar o saldo
        },
      });

      if (!existingTransaction) {
        console.warn('Transação não encontrada no DB para o ID do Mercado Pago:', externalPaymentId);
        // Isso pode acontecer se o webhook for mais rápido que o registro inicial da transação.
        // Você pode optar por criar a transação aqui se for o caso, ou retornar 200 para o MP.
        // Por agora, retornamos 200 para evitar reenvios e logamos o aviso.
        return NextResponse.json({ message: 'Transação não encontrada no sistema, notificação ignorada.' }, { status: 200 });
      }

      // Lógica para atualizar o status da transação e o saldo da carteira
      let newTransactionStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED' = existingTransaction.status;
      let updateWalletBalance = false;

      switch (paymentStatus) {
        case 'approved':
          if (existingTransaction.status !== 'COMPLETED') { // Evita processar múltiplas vezes
            newTransactionStatus = 'COMPLETED';
            updateWalletBalance = true; // Sinaliza para atualizar o saldo
          }
          break;
        case 'pending':
          newTransactionStatus = 'PENDING'; // Mantém como pendente
          break;
        case 'rejected':
        case 'cancelled': // Mercado Pago usa 'cancelled' para alguns casos de cancelamento
          if (existingTransaction.status !== 'FAILED' && existingTransaction.status !== 'CANCELED') {
            newTransactionStatus = 'FAILED'; // Ou 'CANCELED' se preferir
            // Se o saldo já foi incrementado (ex: cartão aprovado na hora),
            // você precisaria estornar aqui. Para Pix/Boleto, o saldo não foi incrementado ainda.
            // Isso depende da sua lógica de negócio.
          }
          break;
        default:
          console.warn(`Status de pagamento desconhecido do Mercado Pago: ${paymentStatus}`);
          break;
      }

      // Atualize a transação no seu banco de dados
      const updatedTransaction = await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: {
          status: newTransactionStatus,
          // Você pode querer atualizar a descrição também
          description: `Depósito ${existingTransaction.type} - Status: ${newTransactionStatus}`,
        },
      });
      console.log(`Transação ${updatedTransaction.id} atualizada para status: ${updatedTransaction.status}`);

      // Se o pagamento foi aprovado e o saldo ainda não foi atualizado (ex: Pix/Boleto)
      if (updateWalletBalance && existingTransaction.wallet && existingTransaction.wallet.balance !== (existingTransaction.wallet.balance + transactionAmount)) {
        await prisma.wallet.update({
          where: { id: existingTransaction.wallet.id },
          data: { balance: { increment: transactionAmount } },
        });
        console.log(`Saldo da carteira ${existingTransaction.wallet.id} atualizado. Novo saldo: ${existingTransaction.wallet.balance + transactionAmount}`);
      }

      // Retorna 200 OK para o Mercado Pago para indicar que a notificação foi recebida
      return NextResponse.json({ message: 'Webhook de pagamento processado com sucesso.' }, { status: 200 });

    } else if (body.type === 'test') {
      // Notificação de teste do Mercado Pago
      console.log('Webhook de teste do Mercado Pago recebido. Tudo OK.');
      return NextResponse.json({ message: 'Webhook de teste recebido.' }, { status: 200 });
    } else {
      console.warn('Tipo de webhook desconhecido recebido:', body.type);
      return NextResponse.json({ message: 'Tipo de webhook não suportado.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    // Retorna 500 para o Mercado Pago, que pode tentar reenviar a notificação
    return NextResponse.json({ message: 'Erro interno do servidor ao processar webhook.' }, { status: 500 });
  }
}

// Função para validar a assinatura do webhook (implementação mais complexa, para produção)
// function isValidWebhookSignature(body: any, signature: string | null, secret: string): boolean {
//   // Implementação da validação da assinatura conforme a documentação do Mercado Pago
//   // Geralmente envolve hashing do body com o secret e comparação com a assinatura.
//   // Exemplo: https://www.mercadopago.com.br/developers/pt/guides/resources/webhooks/signature
//   return true; // Placeholder
// }
