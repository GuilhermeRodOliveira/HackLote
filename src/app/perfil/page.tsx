'use client';

import React, { useState, useEffect, useContext, useRef } from 'react';
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

// Interface para o objeto Review (deve corresponder ao que a API retorna)
interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewerId: string;
  reviewedId: string;
  createdAt: string;
  reviewer?: { // Dados do avaliador (se incluído)
    id: string;
    usuario?: string;
    nome?: string;
    profilePictureUrl?: string;
  };
  reviewed?: { // Dados do avaliado (se incluído)
    id: string;
    usuario?: string;
    nome?: string;
    profilePictureUrl?: string;
  };
}

// URL da imagem de perfil padrão
const DEFAULT_PROFILE_PICTURE = 'https://cdn-icons-png.flaticon.com/512/1695/1695213.png';

export default function PerfilPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Para carregamento inicial do perfil
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Flag para a carga inicial
  
  const [editedNome, setEditedNome] = useState('');
  const [editedUsuario, setEditedUsuario] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  const [reviewsReceived, setReviewsReceived] = useState<Review[]>([]); // NOVO: Avaliações recebidas
  const [reviewsGiven, setReviewsGiven] = useState<Review[]>([]);     // NOVO: Avaliações dadas

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efeito para buscar o perfil e as avaliações na montagem
  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      if (authLoading) return;

      if (!user) {
        toast.error('Você precisa estar logado para ver seu perfil.');
        router.push('/login');
        return;
      }

      try {
        // Busca o perfil
        const profileRes = await fetch(`/api/users/${user.id}/profile`);
        const profileData = await profileRes.json();

        if (profileRes.ok) {
          const fetchedProfile = profileData.profile;
          setProfile(fetchedProfile);
          setEditedNome(fetchedProfile.nome || '');
          setEditedUsuario(fetchedProfile.usuario || '');
          setEditedBio(fetchedProfile.bio || '');
          setProfilePicturePreview(fetchedProfile.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
          setInitialLoad(false); // Desativa a flag de carga inicial após carregar o perfil
        } else {
          toast.error(profileData.error || 'Erro ao carregar perfil.');
        }

        // Busca avaliações recebidas
        const receivedRes = await fetch(`/api/users/${user.id}/reviews-received`);
        const receivedData = await receivedRes.json();
        if (receivedRes.ok) {
          setReviewsReceived(receivedData.reviews);
        } else {
          toast.error(receivedData.error || 'Erro ao carregar avaliações recebidas.');
        }

        // Busca avaliações dadas
        const givenRes = await fetch(`/api/users/${user.id}/reviews-given`);
        const givenData = await givenRes.json();
        if (givenRes.ok) {
          setReviewsGiven(givenData.reviews);
        } else {
          toast.error(givenData.error || 'Erro ao carregar avaliações dadas.');
        }

      } catch (err) {
        console.error('Erro de rede ao buscar perfil e avaliações:', err);
        toast.error('Erro de rede. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndReviews();
  }, [user, authLoading, router]);

  // Efeito para auto-salvar as alterações
  useEffect(() => {
    if (loading || authLoading || !user || !profile || initialLoad || isSaving) {
        return;
    }

    const handler = setTimeout(async () => {
      const hasChanges = 
        (editedNome || '') !== (profile.nome || '') ||
        (editedUsuario || '') !== (profile.usuario || '') ||
        (editedBio || '') !== (profile.bio || '') ||
        profilePictureFile !== null ||
        (profilePicturePreview === null && profile.profilePictureUrl !== null) ||
        (profilePicturePreview === DEFAULT_PROFILE_PICTURE && profile.profilePictureUrl !== DEFAULT_PROFILE_PICTURE && profile.profilePictureUrl !== null);

      if (hasChanges) {
        await handleSaveProfile();
      }
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [editedNome, editedUsuario, editedBio, profilePictureFile, profilePicturePreview, user, profile, loading, authLoading, initialLoad, isSaving]);

  // Função centralizada para enviar as alterações para o backend
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setLoading(true);

    const dataToSend: {
      nome?: string;
      usuario?: string;
      bio?: string;
      profilePictureBase64?: string | null;
    } = {};

    if (editedNome !== (profile?.nome || '')) dataToSend.nome = editedNome;
    if (editedUsuario !== (profile?.usuario || '')) dataToSend.usuario = editedUsuario;
    if (editedBio !== (profile?.bio || '')) dataToSend.bio = editedBio;

    let profilePictureBase64: string | null | undefined = undefined;
    if (profilePictureFile) {
      profilePictureBase64 = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(profilePictureFile);
      });

      if (!profilePictureBase64) {
        toast.error('Erro ao ler a imagem. Tente novamente.');
        setIsSaving(false);
        setLoading(false);
        return;
      }
      dataToSend.profilePictureBase64 = profilePictureBase64;
    } else if (profilePicturePreview === null && profile?.profilePictureUrl) {
        profilePictureBase64 = null;
        dataToSend.profilePictureBase64 = profilePictureBase64;
    } else if (profilePicturePreview === DEFAULT_PROFILE_PICTURE && profile?.profilePictureUrl !== DEFAULT_PROFILE_PICTURE && profile?.profilePictureUrl !== null) {
        profilePictureBase64 = null;
        dataToSend.profilePictureBase64 = profilePictureBase64;
    } else if (profilePicturePreview === profile?.profilePictureUrl) {
        // Se o preview é igual à URL original, não envia o campo para o backend
        // dataToSend.profilePictureBase64 permanece undefined
    }

    if (Object.keys(dataToSend).length === 0) {
        setIsSaving(false);
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`/api/users/${user?.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (res.ok) {
        const updatedProfileData = data.profile;
        setProfile(updatedProfileData);
        setProfilePictureFile(null);
        setProfilePicturePreview(updatedProfileData.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
        
        // Atualiza o estado original após um salvamento bem-sucedido
        setOriginalProfileState({
            nome: updatedProfileData.nome || '',
            usuario: updatedProfileData.usuario || '',
            bio: updatedProfileData.bio || '',
            profilePictureUrl: updatedProfileData.profilePictureUrl || DEFAULT_PROFILE_PICTURE,
        });

        toast.success(data.message || 'Perfil atualizado automaticamente!');
      } else {
        toast.error(data.error || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar perfil:', err);
      toast.error('Erro de rede. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  // Função para lidar com a seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione um arquivo de imagem válido.');
        setProfilePictureFile(null);
        setProfilePicturePreview(profile?.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
        toast.error('A imagem deve ter no máximo 2MB.');
        setProfilePictureFile(null);
        setProfilePicturePreview(profile?.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
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
      setProfilePicturePreview(profile?.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
    }
  };

  // Função para remover a imagem (clicando no botão)
  const handleRemoveImage = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null); // Define o preview como null para indicar remoção
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para abrir o seletor de arquivos ao clicar na imagem
  const handleProfilePictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Função para renderizar estrelas
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
    ));
  };

  // Função para formatar o nome de usuário (últimas 3 letras)
  const formatUsername = (username: string | undefined | null) => {
    if (!username) return 'Anônimo';
    if (username.length <= 3) return username;
    return '...' + username.slice(-3);
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
              src={profilePicturePreview || DEFAULT_PROFILE_PICTURE}
              alt="Foto de Perfil"
              width={120}
              height={120}
              className="rounded-full object-cover cursor-pointer"
              onClick={handleProfilePictureClick}
            />
          </div>
          <h2 className="text-2xl font-semibold text-white mt-4">{profile.usuario || profile.nome || 'Usuário'}</h2>
          <p className="text-gray-400 text-sm">{profile.email}</p>
        </div>

        {/* Formulário de Edição - Sempre visível, sem modo de edição explícito */}
        <form className="space-y-4">
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
          <input
            type="file"
            id="profilePictureFile"
            accept="image/*" // Aceita apenas arquivos de imagem
            onChange={handleFileChange}
            ref={fileInputRef} // Atribui a referência
            style={{ display: 'none' }} // Oculta o input
          />
          {profilePicturePreview && profilePicturePreview !== DEFAULT_PROFILE_PICTURE && ( // Mostra o botão remover apenas se não for a imagem padrão
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-red-400 hover:text-red-500 text-sm py-2 px-4 rounded-md border border-red-400"
              >
                Remover Imagem
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Seção de Avaliações Recebidas */}
      <div className="content-box mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Avaliações Recebidas</h2>
        {reviewsReceived.length === 0 ? (
          <p className="text-gray-400">Nenhuma avaliação recebida ainda.</p>
        ) : (
          <div className="space-y-4">
            {reviewsReceived.map(review => (
              <div key={review.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  {/* NOVO: Exibindo apenas as 3 últimas letras do nome de usuário do avaliador */}
                  <span className="font-semibold text-white">
                    Avaliador: {formatUsername(review.reviewer?.usuario || review.reviewer?.nome)}
                  </span>
                  <span className="text-yellow-400">{renderStars(review.rating)}</span>
                </div>
                {review.comment && (
                  <p className="text-gray-300 text-sm">{review.comment}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Em: {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção de Avaliações Dadas */}
      <div className="content-box mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Avaliações Dadas</h2>
        {reviewsGiven.length === 0 ? (
          <p className="text-gray-400">Nenhuma avaliação dada ainda.</p>
        ) : (
          <div className="space-y-4">
            {reviewsGiven.map(review => (
              <div key={review.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  {/* NOVO: Exibindo apenas as 3 últimas letras do nome de usuário do avaliado */}
                  <span className="font-semibold text-white">
                    Avaliado: {formatUsername(review.reviewed?.usuario || review.reviewed?.nome)}
                  </span>
                  <span className="text-yellow-400">{renderStars(review.rating)}</span>
                </div>
                {review.comment && (
                  <p className="text-gray-300 text-sm">{review.comment}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Em: {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function setOriginalProfileState(arg0: { nome: any; usuario: any; bio: any; profilePictureUrl: any; }) {
  throw new Error('Function not implemented.');
}
