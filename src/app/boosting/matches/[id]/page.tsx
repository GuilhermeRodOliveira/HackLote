// src/app/boosting/matches/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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
  bids: {
    id: string;
    price: number;
    estimatedTime: string;
    user: {
      email: string;
    };
  }[];
}

export default function BoostRequestDetailsPage() {
  const { id } = useParams();
  const [request, setRequest] = useState<BoostRequest | null>(null);
  const [price, setPrice] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/boostrequest/${id}`);
      const data = await res.json();
      setRequest(data);
    };

    if (id) fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Usuário não autenticado');

    const res = await fetch('/api/boostbid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price: parseFloat(price),
        estimatedTime,
        boostRequestId: id,
        userId,
      }),
    });

    if (res.ok) {
      alert('Lance enviado com sucesso!');
      setPrice('');
      setEstimatedTime('');
      location.reload();
    } else {
      alert('Erro ao enviar lance');
    }
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Detalhes do Pedido de Boost</h1>
      {request ? (
        <div>
          <p><strong>Jogo:</strong> {request.game}</p>
          <p><strong>Rank Atual:</strong> {request.currentRank}</p>
          <p><strong>Rank Desejado:</strong> {request.desiredRank}</p>
          <p><strong>Descrição:</strong> {request.description || 'N/A'}</p>
          <p><strong>Solicitado por:</strong> {request.user.email}</p>
          <p><strong>Data:</strong> {new Date(request.createdAt).toLocaleString()}</p>

          <h2 className="text-2xl font-bold mt-6">Enviar Lance</h2>
          <form onSubmit={handleSubmit} className="mt-2 space-y-2 max-w-md">
            <input
              type="number"
              step="0.01"
              placeholder="Preço (R$)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 rounded bg-[#1f1f2e] text-white"
              required
            />
            <input
              type="text"
              placeholder="Tempo estimado (ex: 2 dias)"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full p-2 rounded bg-[#1f1f2e] text-white"
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Enviar Lance
            </button>
          </form>

          <h2 className="text-2xl font-bold mt-6">Lances Recebidos</h2>
          {request.bids.length === 0 ? (
            <p>Nenhum lance recebido ainda.</p>
          ) : (
            <ul className="mt-2 space-y-4">
              {request.bids.map((bid) => (
                <li key={bid.id} className="p-4 border rounded bg-[#1c1c2c]">
                  <p><strong>Proposto por:</strong> {bid.user.email}</p>
                  <p><strong>Preço:</strong> R$ {bid.price}</p>
                  <p><strong>Tempo estimado:</strong> {bid.estimatedTime}</p>
                  <form action="/api/boostbid/accept" method="POST">
                    <input type="hidden" name="bidId" value={bid.id} />
                    <input type="hidden" name="requestId" value={request.id} />
                    <button
                      type="submit"
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Aceitar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
}