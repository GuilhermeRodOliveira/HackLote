// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: JWT_SECRET });

  // Redireciona para login se não autenticado e tentar acessar /dashboard
  if (!token && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Token válido ou rota pública
  return NextResponse.next();
}

// Define as rotas protegidas
export const config = {
  matcher: ['/dashboard/:path*'], // aplique para mais rotas se quiser
};
