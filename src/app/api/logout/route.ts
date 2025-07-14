import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout realizado.' });

  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  });

  return response;
}
