'use client';

import { useEffect, useState } from 'react';

type BoostRequest = {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  description: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
};

export default function BoostMatchesPage() {
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/boostrequest')
      .then((res) => res.json())
      .then((data) => {
        setRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar pedidos:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Pedidos de Boost</h2>

      {loading ? (
        <p>Carregando...</p>
      ) : requests.length === 0 ? (
        <p>Nenhum pedido disponível no momento.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li key={req.id} className="bg-[#1b1b1b] p-4 rounded shadow-md">
              <p><strong>Jogo:</strong> {req.game}</p>
              <p><strong>De:</strong> {req.currentRank} → <strong>Para:</strong> {req.desiredRank}</p>
              <p><strong>Descrição:</strong> {req.description || 'Não informada'}</p>
              <p><strong>Cliente:</strong> {req.user?.name || req.user?.email}</p>
              <p><strong>Data:</strong> {new Date(req.createdAt).toLocaleString()}</p>

              <button
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                onClick={() => alert(`Você quer oferecer lance no pedido ${req.id}`)}
              >
                Oferecer Lance
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
