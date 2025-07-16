import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout realizado com sucesso!' });

  // Remove o cookie 'token' definindo seu maxAge para 0 (expira imediatamente)
  response.cookies.set({
    name: 'token',
    value: '', // Limpa o valor
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0, // Expira o cookie imediatamente
    sameSite: 'lax',
  });

  return response;
}
