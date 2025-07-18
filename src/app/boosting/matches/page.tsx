// src/app/boosting/matches/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext'; // Importa o AuthContext para verificar autenticação
import { useRouter } from 'next/navigation'; // Para redirecionamento

// Interfaces para os dados esperados da API
interface UserInfo {
  id: string;
  usuario?: string;
  nome?: string;
  email: string;
  // profilePictureUrl?: string; // Opcional: se quiser exibir o avatar do criador do pedido
}

interface BoostRequest {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  description?: string;
  createdAt: string;
  user: UserInfo; // O usuário que fez o pedido
  acceptedBidId?: string | null; // Se o pedido já foi aceito
}

export default function BoostMatchesPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);

  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([]); // Estado para armazenar a lista de pedidos de boost
  const [loading, setLoading] = useState(true); // Estado para controlar o carregamento dos pedidos
  const [error, setError] = useState<string | null>(null); // Estado para armazenar mensagens de erro

  // Efeito para buscar os pedidos de boost da API
  useEffect(() => {
    async function fetchBoostRequests() {
      // Opcional: Redirecionar se o usuário não estiver logado.
      // Se você quer que a lista de pedidos seja pública, remova esta condição.
      // if (!currentUser && !authLoading) {
      //   router.push('/login');
      //   return;
      // }
      
      setLoading(true); // Inicia o carregamento
      setError(null); // Limpa erros anteriores

      try {
        const res = await fetch('/api/boostrequest'); // Chama a API que busca todos os pedidos de boost
        if (res.ok) {
          const data = await res.json();
          // A API GET /api/boostrequest retorna um array de pedidos diretamente.
          // Certifique-se de que 'data' é um array.
          if (Array.isArray(data)) {
            setBoostRequests(data);
          } else if (data && Array.isArray(data.requests)) { // Caso a API retorne um objeto com uma propriedade 'requests'
            setBoostRequests(data.requests);
          } else {
            setError('Formato de dados da API inesperado.');
            setBoostRequests([]);
          }
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Falha ao carregar pedidos de boost.');
        }
      } catch (err) {
        console.error('Erro de rede ao buscar pedidos de boost:', err);
        setError('Erro de conexão ao carregar pedidos de boost.');
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    }

    // Busca os pedidos apenas após o AuthContext terminar de carregar
    if (!authLoading) {
      fetchBoostRequests();
    }
  }, [authLoading]); // Dependência: authLoading (para re-buscar se o estado de autenticação mudar)

  // Filtra os pedidos para mostrar apenas os de outros usuários
  const filteredBoostRequests = boostRequests.filter(
    (request) => !currentUser || request.user.id !== currentUser.id
  );

  // Exibe estados de carregamento e erro
  if (loading || authLoading) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando pedidos de boost...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white flex items-center justify-center">
        <p className="text-red-500">Erro: {error}</p>
        <button onClick={() => router.back()} className="ml-4 py-2 px-4 bg-yellow-400 text-black rounded-md hover:bg-yellow-500">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400 text-center">Pedidos de Boosting Ativos</h1>

        {/* Exibe mensagem se não houver pedidos de outros usuários */}
        {filteredBoostRequests.length === 0 ? (
          <p className="text-gray-400 text-center">Nenhum pedido de boost de outros usuários encontrado.</p>
        ) : (
          // Grade para exibir os pedidos de boost filtrados
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBoostRequests.map((request) => (
              <div key={request.id} className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-2">{request.game}</h2>
                <p className="text-gray-300">De: {request.currentRank} para {request.desiredRank}</p>
                <p className="text-gray-400 text-sm mt-2">{request.description || 'Sem descrição.'}</p>
                {/* ALTERADO: toLocaleString para incluir data e hora */}
                <p className="text-gray-500 text-xs mt-2">Criado em: {new Date(request.createdAt).toLocaleString('pt-BR')}</p>
                <p className="text-gray-400 text-sm mt-1">
                  Solicitado por: 
                  <Link href={`/perfil/${request.user.id}`} className="text-yellow-400 hover:underline ml-1">
                    {request.user.usuario || request.user.nome || request.user.email}
                  </Link>
                </p>
                {request.acceptedBidId && (
                  <p className="text-green-400 font-semibold mt-2">✅ Pedido Aceito!</p>
                )}
                <div className="mt-4 flex justify-end">
                  <Link 
                    href={`/boosting/matches/${request.id}`} // Link para a página de detalhes do pedido
                    className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold transition"
                  >
                    Ver Detalhes e Lances
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
