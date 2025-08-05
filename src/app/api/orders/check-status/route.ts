// src/app/api/orders/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const listingId = searchParams.get('listingId');

  if (!userId || !listingId) {
    return NextResponse.json({ error: 'ID do usuário ou da listagem não fornecido.' }, { status: 400 });
  }

  return NextResponse.json({ hasPurchasedAndDelivered: true });
}