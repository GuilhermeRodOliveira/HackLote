'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Certifique-se de que Link está importado

interface BoostRequest {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  description?: string;
  createdAt: string;
  user: {
    email: string;
  };
}

export default function MatchesPage() {
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoostRequests = async () => {
      try {
        const res = await fetch('/api/boostrequest'); // Assumindo que este endpoint existe
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
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6"> {/* Adicionado um div para alinhar título e botão */}
        <h1 className="text-3xl font-bold">Pedidos de Boost</h1> {/* Aumentado o tamanho do título */}
        {/* NOVO BOTÃO AQUI */}
        <Link href="/boosting/settings">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
            Inscrição para ser Booster
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="content-box text-center text-gray-400 text-lg py-8">
          Carregando pedidos...
        </div>
      ) : boostRequests.length === 0 ? (
        <div className="content-box text-center text-gray-400 text-lg py-8">
          Nenhum pedido de boost disponível.
        </div>
      ) : (
        <ul className="space-y-4">
          {boostRequests.map((request) => (
            <li
              key={request.id}
              className="content-box"
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
    </div>
  );
}
