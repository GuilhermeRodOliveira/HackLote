'use client';

import { useEffect, useState } from 'react';

interface BoostRequest {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  description?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function BoostsPage() {
  const [boosts, setBoosts] = useState<BoostRequest[]>([]);

  useEffect(() => {
    const fetchBoosts = async () => {
      const res = await fetch('/api/boostrequest');
      const data = await res.json();
      setBoosts(data);
    };
    fetchBoosts();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Pedidos de Boost</h1>
      {boosts.length === 0 ? (
        <p>Nenhum pedido disponível.</p>
      ) : (
        <ul className="space-y-4">
          {boosts.map((boost) => (
            <li
              key={boost.id}
              className="border border-gray-700 rounded-lg p-4 bg-[#1a1a1a]"
            >
              <p><strong>Jogo:</strong> {boost.game}</p>
              <p><strong>De:</strong> {boost.currentRank} <strong>→</strong> {boost.desiredRank}</p>
              {boost.description && <p><strong>Descrição:</strong> {boost.description}</p>}
              <p className="text-sm text-gray-400 mt-2">
                Criado por: {boost.user.name} ({boost.user.email})
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
