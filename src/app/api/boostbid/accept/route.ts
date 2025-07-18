// src/app/api/boostbid/accept/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/prisma'; // Adicione esta linha
// Certifique-se de que o caminho relativo esteja correto para cada rota!

export async function POST(req: Request) {
  try {
    const { bidId, requestId } = await req.json();

    if (!bidId || !requestId) {
      return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
    }

    // Atualiza o pedido com o bid aceito
    const updated = await prisma.boostRequest.update({
      where: { id: requestId },
      data: { acceptedBidId: bidId },
    });

    return NextResponse.json({ message: 'Lance aceito com sucesso!', updated });
  } catch (error) {
    console.error('Erro ao aceitar lance:', error);
    return NextResponse.json({ error: 'Erro interno ao aceitar lance.' }, { status: 500 });
  }
}
