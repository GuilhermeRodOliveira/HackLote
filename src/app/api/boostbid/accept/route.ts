// src/app/api/boostbid/accept/route.ts
import { NextResponse, NextRequest } from 'next/server'; // Importe NextRequest
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken'; // Adicione a importação de jwt

const JWT_SECRET = process.env.JWT_SECRET; // Garanta que esteja definido

// Interface para o payload do JWT
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

export async function POST(req: NextRequest) { // Mude Request para NextRequest
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    // 1. Autenticar Usuário (quem está aceitando o lance - geralmente o criador do pedido)
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado para aceitar lance.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT para aceitar lance:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado para aceitar lance.' }, { status: 401 });
    }

    const acceptorUserId = decodedToken.id; // ID do usuário que está aceitando o lance

    const { bidId, requestId } = await req.json();

    if (!bidId || !requestId) {
      return NextResponse.json({ error: 'Parâmetros ausentes (bidId ou requestId).' }, { status: 400 });
    }

    // Usar uma transação para garantir atomicidade
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Buscar o pedido e o lance para validações e informações
      const boostRequest = await prisma.boostRequest.findUnique({
        where: { id: requestId },
        select: { userId: true, game: true, acceptedBidId: true }, // Incluir acceptedBidId para verificar se já foi aceito
      });

      if (!boostRequest) {
        throw new Error('Pedido de boost não encontrado.');
      }

      if (boostRequest.userId !== acceptorUserId) {
        throw new Error('Você não tem permissão para aceitar lances neste pedido.');
      }

      if (boostRequest.acceptedBidId) {
        throw new Error('Este pedido já possui um lance aceito.');
      }

      const acceptedBid = await prisma.boostBid.findUnique({
        where: { id: bidId },
        select: { id: true, boosterId: true, amount: true, boostRequestId: true }, // CORRIGIDO: Adicionado boostRequestId aqui
      });

      if (!acceptedBid || acceptedBid.boostRequestId !== requestId) {
        throw new Error('Lance não encontrado ou não pertence a este pedido.');
      }

      // 2. Atualiza o pedido com o bid aceito
      const updatedBoostRequest = await prisma.boostRequest.update({
        where: { id: requestId },
        data: { acceptedBidId: bidId },
      });

      // 3. Criar notificação para o BOOSTER cujo lance foi aceito
      await prisma.notification.create({
        data: {
          userId: acceptedBid.boosterId, // ID do booster
          type: 'BID_ACCEPTED', // Tipo de notificação
          message: `Seu lance de R$${acceptedBid.amount} para o boost de ${boostRequest.game} foi aceito!`,
          relatedBoostRequestId: requestId,
          relatedBidId: bidId,
        },
      });
      console.log(`Notificação de 'BID_ACCEPTED' criada para o booster ${acceptedBid.boosterId}`);

      // 4. Criar notificação para o CRIADOR DO PEDIDO (se ele aceitou seu próprio lance, talvez não precise, mas para clareza)
      // Esta notificação pode ser útil para confirmar a ação ou para um sistema de histórico.
      await prisma.notification.create({
        data: {
          userId: acceptorUserId, // ID do criador do pedido (que aceitou)
          type: 'ORDER_STATUS_UPDATED', // Ou um tipo mais específico como 'BOOST_ORDER_CONFIRMED'
          message: `Você aceitou um lance de R$${acceptedBid.amount} para o seu pedido de ${boostRequest.game}.`,
          relatedBoostRequestId: requestId,
          relatedBidId: bidId,
        },
      });
      console.log(`Notificação de 'ORDER_STATUS_UPDATED' criada para o criador do pedido ${acceptorUserId}`);

      return updatedBoostRequest;
    });

    return NextResponse.json({ message: 'Lance aceito com sucesso!', updated: result });
  } catch (error: any) { // Capture o erro como 'any' para acessar a propriedade 'message'
    console.error('Erro ao aceitar lance:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno ao aceitar lance.' }, { status: 500 });
  }
}