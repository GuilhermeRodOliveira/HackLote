'use client';

import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { AuthContext } from '@/context/AuthContext';

export default function ListingForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attributes, setAttributes] = useState('');

  const [formLoading, setFormLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p>Carregando informações do usuário...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p>Você precisa estar logado para criar uma listagem. Redirecionando...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (!title || !description || !price || !category || !subCategory) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setFormLoading(false);
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('O preço deve ser um número positivo válido.');
      setFormLoading(false);
      return;
    }

    let parsedAttributes = {};
    if (attributes) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (error) {
        toast.error('Atributos devem ser um JSON válido. Ex: {"key": "value"}');
        setFormLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          price: parsedPrice,
          category,
          subCategory,
          imageUrl: imageUrl || null,
          attributes: parsedAttributes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Listagem criada com sucesso!');
        setTitle('');
        setDescription('');
        setPrice('');
        setCategory('');
        setSubCategory('');
        setImageUrl('');
        setAttributes('');
        // ALTERAÇÃO AQUI: Redireciona para a página de minhas listagens
        router.push('/minhas-listagens'); 
      } else {
        toast.error(data.error || 'Erro ao criar listagem.');
      }
    } catch (error) {
      console.error('Erro de rede ao criar listagem:', error);
      toast.error('Erro de rede. Verifique sua conexão.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Criar Nova Listagem</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Título da Listagem</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Elo Job Gold IV -> Platinum IV"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição Detalhada</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva seu serviço ou produto em detalhes..."
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Preço (R$)</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: 99.99"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione uma categoria</option>
                <option value="Contas">Contas</option> {/* Apenas Contas e Itens */}
                <option value="Itens">Itens</option> {/* Apenas Contas e Itens */}
                {/* Removido "Boosting" e "Servicos" para focar em Contas/Itens no Marketplace */}
              </select>
            </div>
            <div>
              <label htmlFor="subCategory" className="block text-sm font-medium text-gray-300 mb-1">Subcategoria</label>
              <input
                type="text"
                id="subCategory"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: League of Legends, CS2, Valorant"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-1">URL da Imagem (Opcional)</label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div>
            <label htmlFor="attributes" className="block text-sm font-medium text-gray-300 mb-1">Atributos Específicos (JSON - Opcional)</label>
            <textarea
              id="attributes"
              value={attributes}
              onChange={(e) => setAttributes(e.target.value)}
              rows={3}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder='Ex: {"rankAtual": "Gold IV", "servidor": "BR"}'
            ></textarea>
            <p className="text-xs text-gray-400 mt-1">Insira um objeto JSON válido para atributos adicionais.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-300"
            disabled={formLoading}
          >
            {formLoading ? 'Criando Listagem...' : 'Criar Listagem'}
          </button>
        </form>
      </div>
    </div>
  );
}
