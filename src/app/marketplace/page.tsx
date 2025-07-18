'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  subCategory: string;
  imageUrl?: string | null;
  attributes?: Record<string, any> | null; // Objeto JSON para atributos
  sellerId: string;
  seller: { // Dados do vendedor incluídos na busca
    id: string;
    usuario?: string;
    email: string;
    nome?: string;
  };
  createdAt: string; // Ou Date, dependendo de como você o manipula
  updatedAt: string; // Ou Date
  game?: string; // Adicionado 'game' para exibição e filtro
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Estados para os filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGame, setSelectedGame] = useState(''); // NOVO: Estado para o filtro de jogo
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Opções de categorias para o Marketplace (REMOVIDO 'Boosting')
  const categories = ['Contas', 'Skins', 'Gift Cards', 'Itens']; // Exemplo: Apenas categorias de marketplace

  // Lista de jogos suportados (pode ser a mesma do CreateListingPage)
  const supportedGames = [
    'Valorant', 'League of Legends', 'GTA V', 'CS2', 'Fortnite', 'Rainbow Six', 'Rocket League',
  ];

  useEffect(() => {
    // Função para buscar as listagens com filtros
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Constrói a URL da API com base nos filtros
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (selectedGame) queryParams.append('game', selectedGame); // NOVO: Adiciona filtro de jogo
        if (minPrice) queryParams.append('minPrice', minPrice);
        if (maxPrice) queryParams.append('maxPrice', maxPrice);

        const url = `/api/listings?${queryParams.toString()}`;
        console.log('Buscando listagens com URL:', url); // Para depuração

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
  }, [searchTerm, selectedCategory, selectedGame, minPrice, maxPrice]); // Refaz a busca quando qualquer filtro muda

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-4xl font-bold text-yellow-400">Marketplace</h1>
          <Link href="/create-listing">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
              Postar/Publicar Novo Serviço
            </button>
          </Link>
        </div>

        {/* Seção de Filtros */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg border border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca por Termo */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">Buscar</label>
            <input
              type="text"
              id="search"
              placeholder="Título, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
            />
          </div>

          {/* Filtro por Categoria */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* NOVO: Filtro por Jogo */}
          <div>
            <label htmlFor="gameFilter" className="block text-sm font-medium text-gray-300 mb-1">Jogo</label>
            <select
              id="gameFilter"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
            >
              <option value="">Todos os Jogos</option>
              {supportedGames.map((gameOption) => (
                <option key={gameOption} value={gameOption}>{gameOption}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Preço Mínimo */}
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-300 mb-1">Preço Mín.</label>
            <input
              type="number"
              id="minPrice"
              placeholder="R$ 0.00"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
            />
          </div>

          {/* Filtro por Preço Máximo */}
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-300 mb-1">Preço Máx.</label>
            <input
              type="number"
              id="maxPrice"
              placeholder="R$ 999.99"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="content-box text-center text-gray-400 text-lg mt-10">
            Carregando listagens com filtros...
          </div>
        ) : error ? (
          <div className="content-box text-center text-red-500 text-lg mt-10">
            Erro: {error}
          </div>
        ) : listings.length === 0 ? (
          <div className="content-box text-center text-gray-400 text-lg mt-10">
            Nenhuma listagem encontrada com os filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="content-box overflow-hidden flex flex-col transform hover:scale-105 transition duration-300 ease-in-out">
                {listing.imageUrl ? (
                  <div className="relative w-full h-48 bg-gray-700 flex items-center justify-center">
                    <Image
                      src={listing.imageUrl}
                      alt={listing.title}
                      layout="fill" // Use layout="fill" para preencher o div pai
                      objectFit="cover"
                      className="rounded-t-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/400x200/4B5563/FFFFFF?text=Sem+Imagem'; // Fallback
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400 rounded-t-lg">
                    Sem Imagem
                  </div>
                )}
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-xl font-semibold text-blue-400 mb-2">{listing.title}</h2>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-3">{listing.description}</p>
                  <div className="flex justify-between items-center text-lg font-bold text-green-400 mb-3 mt-auto">
                    <span>R$ {listing.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-400">
                      {listing.category} / {listing.subCategory}
                      {listing.game && ` (${listing.game})`} {/* Exibe o jogo se existir */}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm mb-3">
                    Vendedor: <span className="font-medium text-blue-300">{listing.seller.usuario || listing.seller.email}</span>
                  </div>
                  {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p className="font-semibold mb-1">Atributos:</p>
                      <ul className="list-disc list-inside">
                        {Object.entries(listing.attributes).map(([key, value]) => (
                          <li key={key}>
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/listing/${listing.id}`)} // Exemplo de navegação para detalhes
                    className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
