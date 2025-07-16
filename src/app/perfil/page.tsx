'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { AuthContext } from '@/context/AuthContext';
import '@/app/login/styles.css'; // Reutilizar estilos para inputs e botões
import styles from './Perfil.module.css'; // Para estilos específicos do perfil

// Interface para o objeto UserProfile (deve corresponder ao que a API retorna)
interface UserProfile {
  id: string;
  nome?: string;
  usuario?: string;
  email: string;
  bio?: string;
  profilePictureUrl?: string;
  createdAt: string;
}

// URL da imagem de perfil padrão
const DEFAULT_PROFILE_PICTURE = 'https://cdn-icons-png.flaticon.com/512/1695/1695213.png';

export default function PerfilPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNome, setEditedNome] = useState('');
  const [editedUsuario, setEditedUsuario] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;

      if (!user) {
        toast.error('Você precisa estar logado para ver seu perfil.');
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`/api/users/${user.id}/profile`);
        const data = await res.json();

        if (res.ok) {
          setProfile(data.profile);
          setEditedNome(data.profile.nome || '');
          setEditedUsuario(data.profile.usuario || '');
          setEditedBio(data.profile.bio || '');
          // Define a pré-visualização inicial com a URL existente do perfil ou a padrão
          setProfilePicturePreview(data.profile.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
        } else {
          toast.error(data.error || 'Erro ao carregar perfil.');
        }
      } catch (err) {
        console.error('Erro de rede ao buscar perfil:', err);
        toast.error('Erro de rede. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione um arquivo de imagem válido.');
        setProfilePictureFile(null);
        setProfilePicturePreview(profile?.profilePictureUrl || DEFAULT_PROFILE_PICTURE); // Volta para a original ou padrão
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
        toast.error('A imagem deve ter no máximo 2MB.');
        setProfilePictureFile(null);
        setProfilePicturePreview(profile?.profilePictureUrl || DEFAULT_PROFILE_PICTURE); // Volta para a original ou padrão
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePictureFile(null);
      // Se nenhum arquivo for selecionado, volta para a URL original do perfil ou padrão
      setProfilePicturePreview(profile?.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      toast.error('Você precisa estar logado para atualizar seu perfil.');
      setLoading(false);
      return;
    }

    let profilePictureBase64: string | null | undefined = undefined; // Pode ser string, null ou undefined
    if (profilePictureFile) {
      // Se um novo arquivo foi selecionado, converte para Base64
      profilePictureBase64 = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(profilePictureFile);
      });

      if (!profilePictureBase64) {
        toast.error('Erro ao ler a imagem. Tente novamente.');
        setLoading(false);
        return;
      }
    } else if (profilePicturePreview === null && profile?.profilePictureUrl) {
        // Se o usuário clicou em "Remover Imagem" e havia uma imagem original, envia null para remover no DB
        profilePictureBase64 = null;
    } else if (profilePicturePreview === DEFAULT_PROFILE_PICTURE && profile?.profilePictureUrl) {
        // Se o preview voltou para a imagem padrão E havia uma URL original no perfil,
        // significa que o usuário "removeu" a imagem ou não colocou uma nova.
        // Neste caso, também enviamos null para o backend para limpar o campo.
        profilePictureBase64 = null;
    } else if (profilePicturePreview === profile?.profilePictureUrl) {
        // Se o preview é igual à URL original (e não é a padrão), significa que o usuário não alterou a imagem.
        // Neste caso, não envia o campo para o backend (undefined).
        profilePictureBase64 = undefined;
    }


    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editedNome,
          usuario: editedUsuario,
          bio: editedBio,
          profilePictureBase64: profilePictureBase64, // Envia a imagem em Base64, null ou undefined
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(data.profile);
        // Atualiza a pré-visualização com a nova URL retornada pelo backend ou a padrão
        setProfilePicturePreview(data.profile.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
        setIsEditing(false);
        toast.success(data.message || 'Perfil atualizado com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar perfil:', err);
      toast.error('Erro de rede. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">Meu Perfil</h1>

      <div className="content-box p-6">
        <div className="flex flex-col items-center mb-6">
          <div className={styles['profile-picture-container']}>
            <Image
              // ALTERADO: Garante que o src seja sempre uma string válida
              src={profilePicturePreview || DEFAULT_PROFILE_PICTURE}
              alt="Foto de Perfil"
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-semibold text-white mt-4">{profile.usuario || profile.nome || 'Usuário'}</h2>
          <p className="text-gray-400 text-sm">{profile.email}</p>
        </div>

        {isEditing ? (
          // Formulário de Edição
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="input-box">
              <label htmlFor="nome" className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
              <input
                type="text"
                id="nome"
                value={editedNome}
                onChange={(e) => setEditedNome(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="input-box">
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-400 mb-1">Nome de Usuário</label>
              <input
                type="text"
                id="usuario"
                value={editedUsuario}
                onChange={(e) => setEditedUsuario(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="input-box">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-1">Biografia</label>
              <textarea
                id="bio"
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                rows={4}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Fale um pouco sobre você..."
              />
            </div>
            {/* Input de arquivo para foto de perfil */}
            <div className="input-box">
              <label htmlFor="profilePictureFile" className="block text-sm font-medium text-gray-400 mb-1">Upload Foto de Perfil (Max 2MB)</label>
              <input
                type="file"
                id="profilePictureFile"
                accept="image/*" // Aceita apenas arquivos de imagem
                onChange={handleFileChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {profilePicturePreview && (
                <div className="mt-4 flex items-center gap-2">
                  <Image
                    src={profilePicturePreview}
                    alt="Pré-visualização"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setProfilePictureFile(null); setProfilePicturePreview(null); }}
                    className="text-red-400 hover:text-red-500 text-sm"
                  >
                    Remover Imagem
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => { setIsEditing(false); /* Resetar estados de edição se necessário */ }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        ) : (
          // Visualização do Perfil
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Nome Completo:</p>
              <p className="text-white text-base font-medium">{profile.nome || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Nome de Usuário:</p>
              <p className="text-white text-base font-medium">{profile.usuario || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Biografia:</p>
              <p className="text-white text-base leading-relaxed">{profile.bio || 'Nenhuma biografia ainda.'}</p>
            </div>
            <div className="text-right mt-6">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seção de Avaliações Recebidas */}
      <div className="content-box mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Avaliações Recebidas</h2>
        <p className="text-gray-400">Nenhuma avaliação recebida ainda.</p>
      </div>
    </div>
  );
}
