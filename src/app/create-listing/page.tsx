// src/app/create-listing/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '', // Manter category para marketplace (Contas, Skins, etc.)
    subCategory: '',
    game: '', // NOVO: Estado para o jogo
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista de jogos suportados (pode ser a mesma do BoostForm)
  const supportedGames = [
    'Valorant',
    'League of Legends',
    'GTA V',
    'CS2',
    'Fortnite',
    'Rainbow Six',
    'Rocket League',
    // Adicione todos os jogos relevantes para listagens
  ];

  // Opções de categorias para listagens (REMOVIDO 'Boosting')
  const listingCategories = ['Contas', 'Skins', 'Gift Cards', 'Itens']; // Exemplo: Apenas categorias de marketplace

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Você precisa estar logado para criar uma listagem.');
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar logado para criar uma listagem.');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Criando listagem...');

    // Validação
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.game || !selectedFile) {
      toast.dismiss();
      toast.error('Por favor, preencha todos os campos obrigatórios (incluindo Jogo e Imagem).');
      setIsSubmitting(false);
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append('title', formData.title);
    dataToSend.append('description', formData.description);
    dataToSend.append('price', parseFloat(formData.price).toString());
    dataToSend.append('category', formData.category);
    dataToSend.append('subCategory', formData.subCategory);
    dataToSend.append('game', formData.game); // NOVO: Adiciona o jogo ao FormData
    if (selectedFile) {
      dataToSend.append('image', selectedFile);
    }

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        body: dataToSend, 
      });

      if (res.ok) {
        const result = await res.json();
        toast.dismiss();
        toast.success(result.message || 'Listagem criada com sucesso!');
        router.push('/marketplace'); // Redireciona para o marketplace após criar
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.error || 'Falha ao criar listagem.');
      }
    } catch (error) {
      console.error('Erro de rede ao criar listagem:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao criar listagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="text-gray-400 text-center py-8">Carregando autenticação...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white">
      <div className="max-w-xl mx-auto bg-gray-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400 text-center">Criar Nova Listagem</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título da Listagem */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Título</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descrição</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
            ></textarea>
          </div>

          {/* Preço */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-300">Preço (R$)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
            />
          </div>

          {/* Categoria (apenas categorias de marketplace) */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300">Categoria</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
            >
              <option value="">Selecione uma categoria...</option>
              {listingCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* NOVO: Campo Jogo (para a listagem) */}
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
              <option value="">Selecione o jogo...</option>
              {supportedGames.map((gameOption) => (
                <option key={gameOption} value={gameOption}>
                  {gameOption}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategoria (Opcional) */}
          <div>
            <label htmlFor="subCategory" className="block text-sm font-medium text-gray-300">Subcategoria (Opcional)</label>
            <input
              type="text"
              id="subCategory"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
            />
          </div>

          {/* Campo de Upload de Imagem */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300">Imagem da Listagem</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="mt-1 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0 file:text-sm file:font-semibold
                         file:bg-yellow-400 file:text-black hover:file:bg-yellow-500 cursor-pointer"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-400">Arquivo selecionado: {selectedFile.name}</p>
            )}
          </div>

          {/* Botão de Criação */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Criando...' : 'Criar Listagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
