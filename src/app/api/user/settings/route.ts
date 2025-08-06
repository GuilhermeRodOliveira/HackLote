// src/app/api/user/settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/prisma';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import fs from 'fs/promises'; // Para operações de sistema de arquivos
import path from 'path'; // Para lidar com caminhos de arquivo
import { v4 as uuidv4 } from 'uuid'; // Para gerar nomes de arquivo únicos

const JWT_SECRET = process.env.JWT_SECRET;

// Interface para o payload do token JWT
interface JwtUserPayload {
  id: string;
  usuario?: string;
  email: string;
  iat: number;
  exp: number;
}

// Função auxiliar para obter o userId do token
function getUserIdFromRequest(request: NextRequest): string | null {
  const tokenCookie = request.cookies.get('token');
  if (!tokenCookie || !tokenCookie.value) {
    console.warn('getUserIdFromRequest: Token cookie não encontrado.');
    return null;
  }

  try {
    if (!JWT_SECRET) {
      console.error('getUserIdFromRequest: JWT_SECRET não está definido.');
      return null;
    }
    const decodedToken = jwt.verify(tokenCookie.value, JWT_SECRET) as JwtUserPayload;
    return decodedToken.id;
  } catch (error) {
    console.error('getUserIdFromRequest: Erro ao decodificar token JWT:', error);
    return null;
  }
}

// Função para obter as configurações do usuário (GET)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ message: 'Não autenticado ou token inválido.' }, { status: 401 });
    }

    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        nome: true,
        usuario: true,
        email: true,
        bio: true,
        profilePictureUrl: true,
        country: true,
        receiveMarketingEmails: true,
        receiveOrderUpdates: true,
        receiveMessageNotifications: true,
        // receiveInAppNotifications: true, // Removido: Campo não existe no modelo Prisma
        isProfilePublic: true,
        isActivityPublic: true,
        preferredLanguage: true,
        theme: true,
        preferredCurrency: true,
        hasChangedUsername: true,
        usernameLastChangedAt: true,
      },
    });

    if (!userSettings) {
      return NextResponse.json({ message: 'Configurações do usuário não encontradas' }, { status: 404 });
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error('API GET /api/user/settings: Erro ao obter configurações do usuário:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para atualizar as configurações do usuário (PUT/PATCH)
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      console.error('API PUT /api/user/settings: Usuário não autenticado ou token inválido.');
      return NextResponse.json({ message: 'Não autenticado ou token inválido.' }, { status: 401 });
    }

    const body = await request.json();
    console.log('API PUT /api/user/settings: Corpo da requisição recebido:', body);

    const updatableFields = [
      'nome', 'bio', 'country', // 'usuario' será tratado separadamente
      'receiveMarketingEmails', 'receiveOrderUpdates', 'receiveMessageNotifications',
      // 'receiveInAppNotifications', // Removido: Campo não existe no modelo Prisma
      'isProfilePublic', 'isActivityPublic',
      'preferredLanguage', 'theme', 'preferredCurrency'
    ];

    const dataToUpdate: { [key: string]: any } = {};
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field];
      }
    }

    // --- Lógica para upload e remoção da imagem de perfil ---
    if (body.profilePictureBase64 !== undefined) {
      console.log('API PUT /api/user/settings: profilePictureBase64 detectado.');
      if (body.profilePictureBase64 === null) {
        // Se profilePictureBase64 é explicitamente null, o frontend quer remover a imagem
        console.log('API PUT /api/user/settings: Requisição para remover imagem de perfil.');
        dataToUpdate.profilePictureUrl = null;

        const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { profilePictureUrl: true } });
        if (currentUser?.profilePictureUrl && currentUser.profilePictureUrl.startsWith('/uploads/')) {
          const oldImagePath = path.join(process.cwd(), 'public', currentUser.profilePictureUrl);
          try {
            await fs.unlink(oldImagePath);
            console.log(`API PUT /api/user/settings: Imagem antiga removida: ${oldImagePath}`);
          } catch (unlinkError: any) {
            if (unlinkError.code !== 'ENOENT') { // ENOENT = No such file or directory (ignorar se o arquivo já não existe)
              console.error(`API PUT /api/user/settings: Erro ao remover imagem antiga ${oldImagePath}:`, unlinkError);
            }
          }
        }
      } else {
        // Processar nova imagem Base64
        console.log('API PUT /api/user/settings: Processando nova imagem Base64.');
        const base64Parts = body.profilePictureBase64.split(';base64,');
        if (base64Parts.length !== 2) {
            console.error('API PUT /api/user/settings: Formato de imagem Base64 inválido (não contém ";base64,").');
            return NextResponse.json({ message: 'Formato de imagem Base64 inválido.' }, { status: 400 });
        }
        const base64Data = base64Parts[1];
        const mimeType = base64Parts[0].substring(base64Parts[0].indexOf(':') + 1);
        const extension = mimeType.split('/')[1];

        if (!base64Data || !mimeType || !extension) {
            console.error('API PUT /api/user/settings: Dados de imagem Base64 incompletos (base64Data, mimeType ou extension ausentes).');
            return NextResponse.json({ message: 'Formato de imagem Base64 inválido.' }, { status: 400 });
        }

        const filename = `profile-${userId}-${uuidv4()}.${extension}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadDir, filename);
        const publicPath = `/uploads/${filename}`; // Caminho que será salvo no DB e usado no frontend

        try {
          // Cria o diretório de uploads se não existir
          await fs.mkdir(uploadDir, { recursive: true });
          console.log(`API PUT /api/user/settings: Diretório de uploads verificado/criado: ${uploadDir}`);

          // Salva o arquivo
          await fs.writeFile(filePath, base64Data, { encoding: 'base64' });
          console.log(`API PUT /api/user/settings: Imagem salva em: ${filePath}`);

          dataToUpdate.profilePictureUrl = publicPath;

          // Opcional: Remover imagem antiga antes de salvar a nova
          const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { profilePictureUrl: true } });
          if (currentUser?.profilePictureUrl && currentUser.profilePictureUrl.startsWith('/uploads/')) {
            const oldImagePath = path.join(process.cwd(), 'public', currentUser.profilePictureUrl);
            try {
              await fs.unlink(oldImagePath);
              console.log(`API PUT /api/user/settings: Imagem antiga removida: ${oldImagePath}`);
            } catch (unlinkError: any) {
              if (unlinkError.code !== 'ENOENT') {
                console.error(`API PUT /api/user/settings: Erro ao remover imagem antiga ${oldImagePath}:`, unlinkError);
              }
            }
          }
        } catch (fileError: any) {
          console.error('API PUT /api/user/settings: Erro ao manipular arquivo de imagem:', fileError);
          return NextResponse.json({ message: `Erro ao salvar imagem: ${fileError.message}` }, { status: 500 });
        }
      }
    } else {
      console.log('API PUT /api/user/settings: profilePictureBase64 não presente no body.');
    }

    // --- Lógica para alteração de nome de usuário (ATUALIZADO) ---
    if (body.usuario !== undefined) {
      console.log(`API PUT /api/user/settings: Verificando nome de usuário: ${body.usuario}`);

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { usuario: true, hasChangedUsername: true }
      });

      if (!currentUser) {
        return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
      }

      // Se o usuário está tentando mudar o nome de usuário E o novo nome é diferente do atual
      if (body.usuario !== currentUser.usuario) {
        if (currentUser.hasChangedUsername) {
          console.error('API PUT /api/user/settings: Usuário já alterou o nome de usuário.');
          return NextResponse.json({ message: 'Você só pode alterar seu nome de usuário uma vez.' }, { status: 403 });
        }

        const existingUserWithNewUsername = await prisma.user.findUnique({
          where: { usuario: body.usuario },
        });

        if (existingUserWithNewUsername && existingUserWithNewUsername.id !== userId) {
          console.error('API PUT /api/user/settings: Nome de usuário já está em uso.');
          return NextResponse.json({ message: 'Nome de usuário já está em uso.' }, { status: 409 });
        }

        // Se tudo estiver ok, adicionar o novo nome de usuário e marcar como alterado
        dataToUpdate.usuario = body.usuario;
        dataToUpdate.hasChangedUsername = true;
        dataToUpdate.usernameLastChangedAt = new Date(); // Registrar a data e hora da alteração
        console.log('API PUT /api/user/settings: Nome de usuário válido e será atualizado.');
      } else {
        console.log('API PUT /api/user/settings: Nome de usuário enviado é o mesmo que o atual. Nenhuma alteração de username será processada.');
      }
    }

    // Realiza a atualização no banco de dados
    console.log('API PUT /api/user/settings: Dados a serem atualizados no Prisma:', dataToUpdate);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { // Retorna apenas os campos atualizados (e outros relevantes)
        nome: true,
        usuario: true,
        email: true,
        bio: true,
        profilePictureUrl: true,
        country: true,
        receiveMarketingEmails: true,
        receiveOrderUpdates: true,
        receiveMessageNotifications: true,
        // receiveInAppNotifications: true, // Removido: Campo não existe no modelo Prisma
        isProfilePublic: true,
        isActivityPublic: true,
        preferredLanguage: true,
        theme: true,
        preferredCurrency: true,
        hasChangedUsername: true,
        usernameLastChangedAt: true,
      },
    });
    console.log('API PUT /api/user/settings: Usuário atualizado com sucesso no Prisma.');

    return NextResponse.json({ message: 'Configurações atualizadas com sucesso!', user: updatedUser });
  } catch (error: any) {
    console.error('API PUT /api/user/settings: Erro geral no processo de atualização:', error);
    if (error.code === 'ENOENT' && error.path && error.path.includes('uploads')) {
        console.error('API PUT /api/user/settings: Erro: Diretório de uploads não encontrado ou permissão negada. Caminho:', error.path);
        return NextResponse.json({ message: `Erro ao salvar imagem: Diretório de uploads inacessível. Verifique as permissões ou se a pasta 'public/uploads' existe.` }, { status: 500 });
    }
    return NextResponse.json({ message: `Erro interno do servidor ao atualizar configurações: ${error.message || 'Erro desconhecido.'}` }, { status: 500 });
  }
}
