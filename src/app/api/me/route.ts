import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecrethy';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: JWT_SECRET });

  if (!token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Retorna os dados do token
  return NextResponse.json({ token });
}
