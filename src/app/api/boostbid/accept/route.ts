// src/app/api/boostbid/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/utils/prisma'; // Caminho corrigido
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Endpoint GET para buscar um único lance pelo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID do lance não fornecido.' }, { status: 400 });
    }

    const bid = await prisma.boostBid.findUnique({
      where: { id: id },
      include: {
        booster: {
          select: {
            id: true,
            usuario: true,
            nome: true,
            email: true,
          },
        },
        boostRequest: {
          select: {
            id: true,
            game: true,
            userId: true,
          },
        },
      },
    });

    if (!bid) {
      return NextResponse.json({ error: 'Lance não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ bid }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar lance:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao buscar lance.' }, { status: 500 });
  }
}

// Endpoint PUT para atualizar um lance existente
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('API de Lances (PUT): Requisição de atualização recebida.');
  try {
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const { id: bidId } = params;

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado para editar lance.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('ERRO: Erro ao verificar token JWT para editar lance:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado para editar lance.' }, { status: 401 });
    }

    const boosterId = decodedToken.id;

    const body = await req.json();
    const { amount, estimatedTime } = body;

    const existingBid = await prisma.boostBid.findUnique({
      where: { id: bidId },
    });

    if (!existingBid) {
      return NextResponse.json({ error: 'Lance não encontrado para edição.' }, { status: 404 });
    }

    if (existingBid.boosterId !== boosterId) {
      return NextResponse.json({ error: 'Você não tem permissão para editar este lance.' }, { status: 403 });
    }

    if (!amount || !estimatedTime) {
      return NextResponse.json({ error: 'Preço e Tempo Estimado são obrigatórios.' }, { status: 400 });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 });
    }

    const updatedBid = await prisma.boostBid.update({
      where: { id: bidId },
      data: {
        amount: parsedAmount,
        estimatedTime: estimatedTime,
      },
    });

    console.log('Lance atualizado com sucesso:', updatedBid.id);
    return NextResponse.json({ message: 'Lance atualizado com sucesso!', bid: updatedBid }, { status: 200 });

  } catch (error) {
    console.error('ERRO GERAL ao editar lance:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao editar lance.' }, { status: 500 });
  }
}

// Endpoint DELETE para excluir um lance existente
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('API de Lances (DELETE): Requisição de exclusão recebida.');
  try {
    if (!JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente.');
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const { id: bidId } = params;

    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado para excluir lance.' }, { status: 401 });
    }

    let decodedToken: JwtUserPayload;
    try {
      decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      console.error('ERRO: Erro ao verificar token JWT para excluir lance:', jwtError);
      return NextResponse.json({ error: 'Token inválido ou expirado para excluir lance.' }, { status: 401 });
    }

    const boosterId = decodedToken.id;

    const existingBid = await prisma.boostBid.findUnique({
      where: { id: bidId },
      include: {
        boostRequest: {
          select: { acceptedBidId: true }
        }
      }
    });

    if (!existingBid) {
      return NextResponse.json({ error: 'Lance não encontrado para exclusão.' }, { status: 404 });
    }

    if (existingBid.boosterId !== boosterId) {
      return NextResponse.json({ error: 'Você não tem permissão para excluir este lance.' }, { status: 403 });
    }

    if (existingBid.boostRequest?.acceptedBidId === bidId) {
        return NextResponse.json({ error: 'Não é possível excluir um lance que já foi aceito.' }, { status: 400 });
    }

    await prisma.boostBid.delete({
      where: { id: bidId },
    });

    console.log('Lance excluído com sucesso:', bidId);
    return NextResponse.json({ message: 'Lance excluído com sucesso!' }, { status: 200 });

  } catch (error) {
    console.error('ERRO GERAL ao excluir lance:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao excluir lance.' }, { status: 500 });
  }
}
