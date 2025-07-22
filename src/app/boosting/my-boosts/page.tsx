// src/app/boosting/my-boosts/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'; // Importe toast do 'react-hot-toast' ou 'react-toastify'

// Interfaces para os dados esperados da API
interface UserInfo {
  id: string;
  usuario?: string;
  nome?: string;
  email: string;
  // profilePictureUrl?: string; // Adicione se quiser usar
}

interface BoostBid {
  id: string;
  amount: number;
  estimatedTime: string;
  booster: UserInfo;
}

interface BoostRequest {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  description?: string;
  createdAt: string;
  user: UserInfo; // O usuário que fez o pedido
  bids: BoostBid[]; // Inclui os lances para exibir quantos foram feitos
  acceptedBidId?: string | null; // Se o pedido já foi aceito
}

export default function MyBoostsPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);

  const [myBoostRequests, setMyBoostRequests] = useState<BoostRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // console.log('useEffect em MyBoostsPage: currentUser:', currentUser, 'authLoading:', authLoading);

    async function fetchMyBoostRequests() {
      if (!currentUser) {
        // console.log('MyBoostsPage: Usuário não logado, pulando busca de pedidos.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      // console.log('MyBoostsPage: Iniciando fetch para /api/user/boost-requests');

      try {
        const res = await fetch('/api/user/boost-requests');
        if (res.ok) {
          const data = await res.json();
          // console.log('MyBoostsPage: Dados da API recebidos:', data);
          setMyBoostRequests(data.myBoostRequests || []);
        } else {
          const errorData = await res.json();
          // console.error('MyBoostsPage: Erro na resposta da API:', errorData);
          setError(errorData.error || 'Falha ao carregar seus pedidos de boost.');
          toast.error(errorData.error || 'Falha ao carregar seus pedidos de boost.');
        }
      } catch (err) {
        // console.error('MyBoostsPage: Erro de rede ao buscar meus pedidos de boost:', err);
        setError('Erro de conexão ao carregar seus pedidos de boost.');
        toast.error('Erro de conexão ao carregar seus pedidos de boost.');
      } finally {
        setLoading(false);
        // console.log('MyBoostsPage: Finalizou o carregamento.');
      }
    }

    if (!authLoading) {
      fetchMyBoostRequests();
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      // console.log('MyBoostsPage: Redirecionando para /login (usuário não autenticado).');
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando seus pedidos de boost...</p>
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

  if (!currentUser) {
    return null; // Redirecionamento já foi acionado pelo useEffect acima
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400 text-center">Meus Boostings</h1>

        {/* NOVOS BOTÕES AQUI */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Link href="/boosting/create" passHref>
            <button
              className="py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition w-full sm:w-auto"
            >
              + Fazer Novo Pedido de Boosting
            </button>
          </Link>
          <Link href="\components\BoostNotificationSettings" passHref>
            <button
              className="py-3 px-6 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition w-full sm:w-auto"
            >
              ⚙️ Configurar Meus Serviços de Boost
            </button>
          </Link>
          <Link href="/boosting/explore-requests" passHref> {/* Assumindo que você terá uma página para boosters verem pedidos */}
            <button
              className="py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
            >
              🔍 Explorar Pedidos de Boosting
            </button>
          </Link>
        </div>

        {/* Lista de Meus Pedidos de Boosting */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white text-center">Meus Pedidos Ativos</h2>
          {myBoostRequests.length === 0 ? (
            <p className="text-gray-400 text-center">Você ainda não criou nenhum pedido de boost.</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myBoostRequests.map((request) => (
                <div key={request.id} className="bg-gray-700 rounded-lg p-6 shadow-md border border-gray-600">
                  <h3 className="text-xl font-bold text-white mb-2">{request.game}</h3>
                  <p className="text-gray-300">De: {request.currentRank} para {request.desiredRank}</p>
                  <p className="text-gray-400 text-sm mt-2">{request.description || 'Sem descrição.'}</p>
                  <p className="text-gray-500 text-xs mt-2">Criado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Lances recebidos: <span className="font-semibold text-white">{request.bids.length}</span>
                  </p>
                  {request.acceptedBidId && (
                    <p className="text-green-400 font-semibold mt-2">✅ Pedido Aceito!</p>
                  )}
                  <div className="mt-4 flex justify-end">
                    <Link 
                      href={`/boosting/matches/${request.id}`}
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
    </div>
  );
}