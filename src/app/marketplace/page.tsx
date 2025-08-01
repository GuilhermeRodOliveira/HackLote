// src/app/marketplace/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard/ListingCard'; 

import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface para o objeto Listing (deve corresponder ao seu modelo Prisma)
interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string; 
  imageUrls: string[]; // ALTERADO: Agora espera um array de URLs
  attributes?: Record<string, any> | null;
  sellerId: string;
  seller: {
    id: string;
    usuario?: string;
    email: string;
    nome?: string;
    profilePictureUrl?: string; 
  };
  createdAt: string;
  updatedAt: string;
  game?: string; 
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const categories = ['Contas', 'Skins', 'Gift Cards', 'Itens'];

  const supportedGames = [
    'Valorant', 'League of Legends', 'GTA V', 'CS2', 'Fortnite', 'Rainbow Six', 'Rocket League',
  ];

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (selectedGame) queryParams.append('game', selectedGame);
        if (minPrice) queryParams.append('minPrice', minPrice);
        if (maxPrice) queryParams.append('maxPrice', maxPrice);

        const url = `/api/listings?${queryParams.toString()}`;
        console.log('Buscando listagens com URL:', url);

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setListings(data.listings);
        } else {
          setError(data.error || 'Erro ao carregar listagens.');
          toast.error(data.error || 'Erro ao carregar listagens.');
        }
      } catch (err) {
        console.error('Erro de rede ao buscar listagens:', err);
        setError('Erro de rede. Verifique sua conexão.');
        toast.error('Erro de rede. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [searchTerm, selectedCategory, selectedGame, minPrice, maxPrice]);

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 sm:px-6 lg:px-8
                     bg-backgroundPrimary text-textPrimary transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-accent1">Marketplace</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/minhas-listagens">
              <button className="py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105
                                 bg-accent1 hover:bg-accent1-shade text-backgroundPrimary">
                Minhas Publicações
              </button>
            </Link>
            <Link href="/create-listing">
              <button className="py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105
                                 bg-accent1 hover:bg-accent1-shade text-backgroundPrimary">
                Postar Novo Serviço
              </button>
            </Link>
          </div>
        </div>

        {/* Seção de Filtros - Mais compacta e com cores do tema */}
        <div className="rounded-lg p-4 mb-8 shadow-lg border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3
                         bg-backgroundSecondary border-borderColor">
          {/* Busca por Termo */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-textSecondary mb-1">Buscar</label>
            <input
              type="text"
              id="search"
              placeholder="Título, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 rounded-md focus:border-accent2 focus:ring-accent2 text-sm
                         bg-backgroundPrimary border border-borderColor text-textPrimary placeholder-textSecondary"
            />
          </div>

          {/* Filtro por Categoria */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-textSecondary mb-1">Categoria</label>
            <select
              id="category"
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 rounded-md focus:border-accent2 focus:ring-accent2 text-sm appearance-none
                         bg-backgroundPrimary border border-borderColor text-textPrimary"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Jogo */}
          <div>
            <label htmlFor="gameFilter" className="block text-sm font-medium text-textSecondary mb-1">Jogo</label>
            <select
              id="gameFilter"
              name="gameFilter"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full p-2 rounded-md focus:border-accent2 focus:ring-accent2 text-sm appearance-none
                         bg-backgroundPrimary border border-borderColor text-textPrimary"
            >
              <option value="">Todos os Jogos</option>
              {supportedGames.map((gameOption) => (
                <option key={gameOption} value={gameOption}>{gameOption}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Preço Mínimo */}
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-textSecondary mb-1">Preço Mín.</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-borderColor
                               bg-backgroundPrimary text-textPrimary text-sm">
                R$
              </span>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                placeholder="0.00"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="flex-1 block w-full rounded-r-md sm:text-sm p-2
                           bg-backgroundPrimary border border-borderColor text-textPrimary focus:border-accent2 focus:ring-accent2"
              />
            </div>
          </div>

          {/* Filtro por Preço Máximo */}
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-textSecondary mb-1">Preço Máx.</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-borderColor
                               bg-backgroundPrimary text-textPrimary text-sm">
                R$
              </span>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                placeholder="999.99"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="flex-1 block w-full rounded-r-md sm:text-sm p-2
                           bg-backgroundPrimary border border-borderColor text-textPrimary focus:border-accent2 focus:ring-accent2"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="content-box text-center text-textSecondary text-lg mt-10">
            Carregando listagens com filtros...
          </div>
        ) : error ? (
          <div className="content-box text-center text-statusError text-lg mt-10">
            Erro: {error}
          </div>
        ) : listings.length === 0 ? (
          <div className="content-box text-center text-textSecondary text-lg mt-10">
            Nenhuma listagem encontrada com os filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}