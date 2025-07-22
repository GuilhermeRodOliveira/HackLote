// src/app/api/orders/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken';

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_ONLY'; // Use uma chave forte em produção!

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET não está definido nas variáveis de ambiente do servidor.');
    return NextResponse.json({ error: 'Erro de configuração interna.' }, { status: 500 });
  }

  let userId: string; // O usuário que está fazendo a requisição (o vendedor, neste caso)
  try {
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado: Token não encontrado.' }, { status: 401 });
    }

    const token = tokenCookie.value;
    try {
      const decodedToken = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
      userId = decodedToken.id;
    } catch (jwtError) {
      console.error('Erro ao verificar token JWT em /api/orders/[id]:', jwtError);
      return NextResponse.json({ error: 'Não autenticado: Token inválido ou expirado.' }, { status: 401 });
    }

  } catch (error) {
    console.error("Erro na verificação de autenticação:", error);
    return NextResponse.json({ error: 'Não autorizado. Falha na autenticação.' }, { status: 401 });
  }

  const orderId = params.id;
  const { status, notes } = await req.json();

  if (!orderId) {
    return NextResponse.json({ error: 'ID do pedido não fornecido.' }, { status: 400 });
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        sellerId: true,
        buyerId: true,
        status: true, // Adicionar status para verificar a mudança
        listing: {
          select: { title: true } // Para incluir na mensagem da notificação
        }
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    if (existingOrder.sellerId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para editar este pedido.' }, { status: 403 });
    }

    const dataToUpdate: { status?: string; notes?: string | null } = {};
    const oldStatus = existingOrder.status; // Salva o status antigo

    if (status !== undefined && status !== oldStatus) { // Apenas se o status mudou
      dataToUpdate.status = status;
    }
    if (notes !== undefined) {
      dataToUpdate.notes = notes;
    } else if (notes === null) {
      dataToUpdate.notes = null;
    }

    // Se não há atualização de status ou notas, retorne sem fazer nada
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: 'Nenhuma alteração detectada no pedido.' }, { status: 200 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: dataToUpdate,
    });

    // ====================================================================================
    // NOVO: Lógica para criar notificações após a atualização do status
    if (status && status !== oldStatus) {
      const listingTitle = existingOrder.listing?.title || 'um item';

      // Notificar o COMPRADOR sobre a mudança de status
      await prisma.notification.create({
        data: {
          userId: existingOrder.buyerId,
          type: 'ORDER_STATUS_UPDATED',
          message: `O status do seu pedido "${listingTitle}" foi atualizado para: ${status}.`,
          // Se você tiver um relatedOrderId no modelo Notification
          // relatedOrderId: orderId,
          // Se não, o link terá que ser construído no frontend com base no ID
        },
      });
      console.log(`Notificação 'ORDER_STATUS_UPDATED' criada para o comprador ${existingOrder.buyerId}`);

      // Notificar o VENDEDOR (se o status for um marco importante, ou se ele for diferente de 'userId')
      // Se o 'userId' (quem fez a requisição) é o vendedor e ele atualizou, talvez a notificação seja redundante
      // Mas pode ser útil para log ou para que a notificação apareça no feed.
      if (existingOrder.sellerId !== userId) { // Evita notificar o próprio vendedor que acabou de fazer a ação
           await prisma.notification.create({
            data: {
              userId: existingOrder.sellerId,
              type: 'ORDER_STATUS_UPDATED',
              message: `O status do pedido "${listingTitle}" foi atualizado para: ${status}.`,
              // relatedOrderId: orderId,
            },
          });
          console.log(`Notificação 'ORDER_STATUS_UPDATED' criada para o vendedor ${existingOrder.sellerId}`);
      }
    }
    // ====================================================================================

    return NextResponse.json({ message: 'Pedido atualizado com sucesso!', order: updatedOrder }, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao atualizar pedido.' }, { status: 500 });
  }
}