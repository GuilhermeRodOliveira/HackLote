'use client';

import { useEffect, useState } from 'react';
import GameSelect from './GameSelect';
import RankSelect from './RankSelect';

export default function BoostForm() {
  const [game, setGame] = useState('');
  const [currentRank, setCurrentRank] = useState('');
  const [desiredRank, setDesiredRank] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Carrega o userId do localStorage após montagem do componente
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) setUserId(parsed.id);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !game || !currentRank || !desiredRank) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/boostrequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, game, currentRank, desiredRank, description }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Pedido de boost criado com sucesso!');
        setGame('');
        setCurrentRank('');
        setDesiredRank('');
        setDescription('');
      } else {
        alert(data.error || 'Erro ao criar pedido.');
      }
    } catch (err) {
      alert('Erro de rede. Tente novamente.');
      console.error('Erro ao enviar pedido de boost:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="boost-form">
      <h2 className="text-xl font-bold mb-4 text-white">Criar Pedido de Boost</h2>

      <GameSelect value={game} onChange={(e) => setGame(e.target.value)} />

      <RankSelect
        label="Rank atual"
        value={currentRank}
        onChange={(e) => setCurrentRank(e.target.value)}
      />

      <RankSelect
        label="Rank desejado"
        value={desiredRank}
        onChange={(e) => setDesiredRank(e.target.value)}
      />

      <textarea
        className="input"
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Publicar Pedido'}
      </button>
    </form>
  );
}
