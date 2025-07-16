import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken'; // Importe a biblioteca jsonwebtoken

// Defina uma interface para o payload do seu JWT
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number; // Issued At
  exp: number; // Expiration Time
}

// É crucial que esta JWT_SECRET seja a mesma usada para assinar o token no login
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; 

export async function GET(req: NextRequest) {
  try {
    // Obtenha o cookie 'token' da requisição
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Não autenticado: Token não encontrado.' }, { status: 401 });
    }

    const token = tokenCookie.value;

    let decodedToken: JwtUserPayload; // Tipando decodedToken com a interface
    try {
      // Verifica e decodifica o token usando a mesma chave secreta
      // Fazendo um cast para JwtUserPayload, pois sabemos o formato do nosso payload
      decodedToken = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    } catch (jwtError) {
      // Se o token for inválido (expirado, modificado, etc.)
      console.error('Erro ao verificar token JWT:', jwtError);
      return NextResponse.json({ error: 'Não autenticado: Token inválido ou expirado.' }, { status: 401 });
    }

    // O token decodificado contém o payload que você definiu no login
    const userPayload = {
      id: decodedToken.id,
      usuario: decodedToken.usuario,
      email: decodedToken.email,
      // Adicione outras propriedades se você as incluiu no payload do JWT
    };

    return NextResponse.json({ user: userPayload });

  } catch (error) {
    console.error('Erro no endpoint /api/me:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
