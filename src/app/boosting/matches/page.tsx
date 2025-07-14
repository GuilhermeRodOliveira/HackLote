'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type BoostRequest = {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  description?: string;
  createdAt: string;
  user: {
    email: string;
  };
};

export default function MatchesPage() {
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoostRequests = async () => {
      try {
        const res = await fetch('/api/boostrequest');
        const data = await res.json();
        setBoostRequests(data);
      } catch (error) {
        console.error('Erro ao buscar os pedidos de boost:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoostRequests();
  }, []);

  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Pedidos de Boost</h1>

      {isLoading ? (
        <p>Carregando...</p>
      ) : boostRequests.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <ul className="space-y-4">
          {boostRequests.map((request) => (
            <li
              key={request.id}
              className="bg-[#1f1f1f] p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition"
            >
              <p><strong>Jogo:</strong> {request.game}</p>
              <p><strong>Rank Atual:</strong> {request.currentRank}</p>
              <p><strong>Rank Desejado:</strong> {request.desiredRank}</p>
              <p><strong>Usuário:</strong> {request.user.email}</p>
              <p><strong>Data:</strong> {new Date(request.createdAt).toLocaleString()}</p>

              <div className="mt-3">
                <Link
                  href={`/boosting/matches/${request.id}`}
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  Ver Detalhes
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
