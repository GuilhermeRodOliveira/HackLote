// src/components/BoostRequestForm/BoostForm.tsx
'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function BoostForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    game: '', // Este campo agora virá do select
    currentRank: '',
    desiredRank: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista de jogos suportados para Boosting
  const supportedGames = [
    'Valorant',
    'League of Legends',
    'GTA V',
    'CS2',
    'Fortnite',
    'Rainbow Six',
    'Rocket League', // Exemplo: adicione o Rocket League aqui
    // Adicione todos os jogos que você suporta para boosting
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.loading('Enviando pedido de boost...');

    if (!formData.game || !formData.currentRank || !formData.desiredRank) {
      toast.dismiss();
      toast.error('Por favor, selecione um Jogo, e preencha o Rank Atual e Rank Desejado.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/boostrequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        toast.dismiss();
        toast.success(result.message || 'Pedido de boost criado com sucesso!');
        setFormData({
          game: '',
          currentRank: '',
          desiredRank: '',
          description: '',
        });
        router.push('/boosting/matches');
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.error || 'Falha ao criar pedido de boost.');
      }
    } catch (error) {
      console.error('Erro de rede ao criar pedido de boost:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao criar pedido de boost.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campo Jogo - AGORA É UM SELECT */}
      <div>
        <label htmlFor="game" className="block text-sm font-medium text-gray-300">Jogo</label>
        <select
          id="game"
          name="game"
          value={formData.game}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
        >
          <option value="">Selecione um jogo...</option>
          {supportedGames.map((gameOption) => (
            <option key={gameOption} value={gameOption}>
              {gameOption}
            </option>
          ))}
        </select>
      </div>

      {/* Campo Rank Atual */}
      <div>
        <label htmlFor="currentRank" className="block text-sm font-medium text-gray-300">Seu Rank Atual</label>
        <input
          type="text"
          id="currentRank"
          name="currentRank"
          value={formData.currentRank}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
          placeholder="Ex: Prata 3, Ouro IV"
        />
      </div>

      {/* Campo Rank Desejado */}
      <div>
        <label htmlFor="desiredRank" className="block text-sm font-medium text-gray-300">Rank Desejado</label>
        <input
          type="text"
          id="desiredRank"
          name="desiredRank"
          value={formData.desiredRank}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
          placeholder="Ex: Platina 1, Diamante"
        />
      </div>

      {/* Campo Descrição (Opcional) */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descrição (Opcional)</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
          placeholder="Detalhes adicionais sobre o boost, horários preferidos, etc."
        ></textarea>
      </div>

      {/* Botão de Envio */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Fazer Pedido de Boost'}
        </button>
      </div>
    </form>
  );
}