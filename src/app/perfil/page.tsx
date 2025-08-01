// src/app/perfil/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { AuthContext } from '@/context/AuthContext';
import styles from './Perfil.module.css'; // Para estilos específicos do perfil

// Interface para o objeto UserProfile (deve corresponder ao que a API retorna)
interface UserProfile {
  id: string;
  nome?: string;
  usuario?: string;
  email: string;
  bio?: string;
  profilePictureUrl?: string;
  country?: string; // Adicionado para exibir no perfil
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
const DEFAULT_PROFILE_PICTURE = '/img/avatar.png'; // Usar caminho relativo para public

export default function PerfilPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Para carregamento inicial do perfil

  const [reviewsReceived, setReviewsReceived] = useState<Review[]>([]); // Avaliações recebidas
  const [reviewsGiven, setReviewsGiven] = useState<Review[]>([]);     // Avaliações dadas

  // Efeito para buscar o perfil e as avaliações na montagem
  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      if (authLoading) return;

      if (!user) {
        toast.error('Você precisa estar logado para ver seu perfil.');
        router.push('/login');
        return;
      }

      setLoading(true); // Inicia o carregamento
      try {
        // Busca o perfil do usuário logado
        // A API /api/user/settings já obtém o userId do token, não precisa de query param
        const profileRes = await fetch(`/api/user/settings`); 
        const profileData = await profileRes.json();

        if (profileRes.ok) {
          setProfile(profileData); // A API de settings já retorna o objeto do usuário diretamente
        } else {
          toast.error(profileData.message || 'Erro ao carregar perfil.');
          console.error("Erro ao carregar perfil:", profileData);
        }

        // TODO: Implementar APIs para buscar avaliações (se ainda não existirem)
        // Por enquanto, estas chamadas podem falhar ou retornar vazias se as APIs não estiverem prontas.
        // Exemplo de como as APIs de reviews deveriam ser:
        // /api/users/[userId]/reviews-received
        // /api/users/[userId]/reviews-given

        // Busca avaliações recebidas (ajuste a URL da API conforme necessário)
        const receivedRes = await fetch(`/api/users/${user.id}/reviews-received`);
        const receivedData = await receivedRes.json();
        if (receivedRes.ok) {
          setReviewsReceived(receivedData.reviews || []);
        } else {
          console.error('Erro ao carregar avaliações recebidas:', receivedData.error || receivedRes.statusText);
          // toast.error(receivedData.error || 'Erro ao carregar avaliações recebidas.'); // Evitar muitos toasts
        }

        // Busca avaliações dadas (ajuste a URL da API conforme necessário)
        const givenRes = await fetch(`/api/users/${user.id}/reviews-given`);
        const givenData = await givenRes.json();
        if (givenRes.ok) {
          setReviewsGiven(givenData.reviews || []);
        } else {
          console.error('Erro ao carregar avaliações dadas:', givenData.error || givenRes.statusText);
          // toast.error(givenData.error || 'Erro ao carregar avaliações dadas.'); // Evitar muitos toasts
        }

      } catch (err) {
        console.error('Erro de rede ao buscar perfil e avaliações:', err);
        toast.error('Erro de rede. Verifique sua conexão.');
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    fetchProfileAndReviews();
  }, [user, authLoading, router]); // Dependências

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

  // Função para formatar a data de forma consistente (evita hidratação)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Use toLocaleDateString com opções para garantir consistência entre servidor/cliente
      // ou formate manualmente como DD/MM/YYYY
      return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
      console.error("Erro ao formatar data:", dateString, e);
      return dateString; // Retorna a string original em caso de erro
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] text-white">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  if (!user || !profile) {
    // Se não há usuário ou perfil após o carregamento, redireciona para login
    router.push('/login');
    return null; 
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">Meu Perfil</h1>

      <div className="content-box p-6">
        <div className="flex flex-col items-center mb-6">
          <div className={styles['profile-picture-container']}>
            <Image
              src={profile.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
              alt="Foto de Perfil"
              width={120}
              height={120}
              className="rounded-full object-cover"
              onError={(e) => { // Adicionado onError para fallback de imagem
                e.currentTarget.src = DEFAULT_PROFILE_PICTURE;
              }}
            />
          </div>
          <h2 className="text-2xl font-semibold text-white mt-4">{profile.usuario || profile.nome || 'Usuário'}</h2>
          <p className="text-gray-400 text-sm">{profile.email}</p>
          {profile.country && (
            <p className="text-gray-400 text-sm mt-1">País: {profile.country}</p>
          )}
          {profile.bio && (
            <p className="text-gray-300 text-center mt-4 max-w-prose">{profile.bio}</p>
          )}
          <button
            onClick={() => router.push('/configuracao?tab=profile')}
            className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Editar Perfil
          </button>
        </div>
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
                  <span className="font-semibold text-white">
                    Avaliador: {formatUsername(review.reviewer?.usuario || review.reviewer?.nome)}
                  </span>
                  <span className="text-yellow-400">{renderStars(review.rating)}</span>
                </div>
                {review.comment && (
                  <p className="text-gray-300 text-sm">{review.comment}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Em: {formatDate(review.createdAt)} {/* Usando a nova função formatDate */}
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
                  <span className="font-semibold text-white">
                    Avaliado: {formatUsername(review.reviewed?.usuario || review.reviewed?.nome)}
                  </span>
                  <span className="text-yellow-400">{renderStars(review.rating)}</span>
                </div>
                {review.comment && (
                  <p className="text-gray-300 text-sm">{review.comment}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Em: {formatDate(review.createdAt)} {/* Usando a nova função formatDate */}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
