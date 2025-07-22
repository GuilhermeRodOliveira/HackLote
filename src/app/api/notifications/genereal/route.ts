// src/app/api/notifications/general/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma'; // Ajuste o caminho conforme necessário para o seu Prisma Client
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Interface para o payload do JWT
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor: JWT_SECRET ausente.' }, { status: 500 });
    }

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado: Token ausente.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('ERRO: Erro ao verificar token JWT para notificações gerais:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    const userId = decodedToken.id;

    // Buscar todas as notificações para o usuário logado
    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }, // Ordenar pelas mais recentes
      take: 50, // Limitar o número de resultados para evitar sobrecarga na página
      include: {
        relatedBoostRequest: {
          select: { id: true, game: true, currentRank: true, desiredRank: true, userId: true },
        },
        relatedBid: {
          select: { id: true, amount: true, boosterId: true },
        },
        // Você pode incluir outras relações se precisar de dados de Listing, Order, ChatSession, etc.
        // Por exemplo, se uma notificação de 'LISTING_BOUGHT' tiver um relatedOrderId
        // relatedOrder: {
        //   select: { id: true, listing: { select: { title: true } } }
        // }
      },
    });

    // Mapear as notificações para o formato esperado pelo frontend (GeneralNotification)
    const formattedNotifications = notifications.map(notif => {
      let title = '';
      let message = notif.message; // Use a mensagem padrão do banco
      let link = ''; // Inicialize o link vazio

      // Certifique-se de que o tipo é compatível com o enum NotificationType do Prisma
      let type: 'order_status' | 'boost_request_match' | 'message' | 'system_alert' | 'bid_update' | 'sale_confirmation' | 'purchase_confirmation';

      switch (notif.type) { // notif.type é um enum NotificationType do Prisma
        case 'NEW_BID':
          title = 'Novo Lance Recebido!';
          if (notif.relatedBoostRequest && notif.relatedBid) {
            message = `Você recebeu um novo lance de R$${notif.relatedBid.amount} para seu pedido de boost de ${notif.relatedBoostRequest.game}.`;
            link = `/boosting/matches/${notif.relatedBoostRequest.id}`;
          } else {
            message = 'Você recebeu um novo lance em um dos seus pedidos.';
          }
          type = 'bid_update';
          break;
        case 'BID_ACCEPTED':
          title = 'Lance Aceito!';
          if (notif.relatedBoostRequest) {
            message = `Seu lance para o boost de ${notif.relatedBoostRequest.game} foi aceito!`;
            link = `/boosting/matches/${notif.relatedBoostRequest.id}`;
          } else {
            message = 'Um dos seus lances de boost foi aceito.';
          }
          type = 'order_status'; // Pode ser 'boost_accepted' se criar um tipo específico no frontend
          break;
        case 'MESSAGE':
          title = 'Nova Mensagem!';
          type = 'message';
          // Se tiver um relatedChatSessionId, link para a página do chat
          // if (notif.relatedChatSessionId) {
          //   link = `/chat/${notif.relatedChatSessionId}`;
          // }
          break;
        case 'BOOST_REQUEST_CREATED':
            title = 'Novo Pedido de Boost Disponível!';
            if (notif.relatedBoostRequest) {
                message = `Um novo pedido de boost para ${notif.relatedBoostRequest.game} foi criado: de ${notif.relatedBoostRequest.currentRank} para ${notif.relatedBoostRequest.desiredRank}.`;
                link = `/boosting/matches/${notif.relatedBoostRequest.id}`;
            } else {
                message = 'Um novo pedido de boost correspondente às suas preferências foi criado.';
            }
            type = 'boost_request_match';
            break;
        case 'LISTING_BOUGHT':
          title = 'Sua Listagem Foi Comprada!';
          // Adapte a mensagem e o link com base nos dados relacionados da Order/Listing
          // if (notif.relatedOrderId && notif.relatedOrder?.listing?.title) {
          //   message = `Sua listagem "${notif.relatedOrder.listing.title}" foi comprada.`;
          //   link = `/orders/${notif.relatedOrderId}`;
          // } else {
            message = 'Parabéns! Uma de suas listagens foi comprada.';
            // link = `/sales/${notif.relatedOrderId}`; // Exemplo
          // }
          type = 'sale_confirmation';
          break;
        case 'ORDER_STATUS_UPDATED':
          title = 'Status do Pedido Atualizado!';
          // Adapte a mensagem e o link com base nos dados relacionados da Order
          // if (notif.relatedOrderId && notif.relatedOrder?.status) {
          //   message = `O status do seu pedido foi atualizado para "${notif.relatedOrder.status}".`;
          //   link = `/orders/${notif.relatedOrderId}`;
          // } else {
            message = 'O status de um dos seus pedidos foi atualizado.';
            // link = `/orders/${notif.relatedOrderId}`; // Exemplo
          // }
          type = 'order_status';
          break;
        default:
          title = 'Notificação Geral';
          type = 'system_alert'; // Fallback para tipos não mapeados
          break;
      }

      return {
        id: notif.id,
        type: type, // O tipo do frontend
        title: title,
        message: message,
        link: link, // Use apenas o 'link' gerado, não 'notif.link'
        createdAt: notif.createdAt.toISOString(),
        isRead: notif.isRead,
        metadata: {
          relatedBoostRequestId: notif.relatedBoostRequestId,
          relatedBidId: notif.relatedBidId,
          // Outros IDs relacionados...
        }
      };
    });

    return NextResponse.json({ notifications: formattedNotifications }, { status: 200 });

  } catch (error) {
    console.error('ERRO GERAL: Erro ao buscar notificações gerais:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar notificações.' }, { status: 500 });
  }
}
