// src/app/api/feedback/[listingId]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  const listingId = params.listingId;

  if (!listingId) {
    return NextResponse.json({ error: 'ID da listagem não fornecido.' }, { status: 400 });
  }

  // LÓGICA DE SIMULAÇÃO (substitua esta parte pela sua lógica do banco de dados)
  const mockFeedbacks = [
    {
      id: 'feedback1',
      text: 'Excelente produto, entrega super rápida!',
      author: { id: 'user1', usuario: 'Comprador_1', email: 'comprador1@example.com' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'feedback2',
      text: 'Funcionalidade como descrita, recomendo!',
      author: { id: 'user2', usuario: 'Comprador_2', email: 'comprador2@example.com' },
      createdAt: new Date().toISOString(),
    },
  ];
  
  return NextResponse.json(mockFeedbacks);
}