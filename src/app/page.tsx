// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import CategoryCard from '@/components/CategoryCard/CategoryCard'; // Certifique-se de que o alias está correto
import ProductCard from '@/components/ProductCard/ProductCard';     // << NOVO: Importa o ProductCard

// Definir interfaces para os dados (opcional, mas boa prática com TypeScript)
interface CategoryItem {
  title: string;
  icon: string;
}

interface Section {
  title: string;
  description?: string;
  items: CategoryItem[];
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  seller: {
    id: string;
    usuario?: string;
    nome?: string;
  };
  createdAt: string;
}

export default function HomePage() {
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [errorListings, setErrorListings] = useState<string | null>(null);

  // Seções de categorias (mantidas do seu código anterior)
  const sections: Section[] = [
    {
      title: '🛡️ Boosting',
      description: 'Suba de elo com segurança',
      items: [
        { title: 'Valorant', icon: '/img/valorant.png' },
        { title: 'League of Legends', icon: '/img/lol.png' },
        { title: 'GTA V', icon: '/img/gta.png' },
        { title: 'CS2', icon: '/img/cs2.png' },
        { title: 'Fortnite', icon: '/img/fortnite.png' },
        { title: 'Rainbow Six', icon: '/img/r6.png' },
      ],
    },
    {
      title: '🛒 Marketplace',
      items: [
        { title: 'Skins', icon: '/img/cs2.png' },
        { title: 'Contas de Jogo', icon: '/img/gta.png' },
        { title: 'Boosts', icon: '/img/valorant.png' },
        { title: 'Gift Cards', icon: '/img/fortnite.png' },
      ],
    },
  ];

  // Efeito para buscar as últimas listagens da API
  useEffect(() => {
    async function fetchLatestListings() {
      setLoadingListings(true);
      setErrorListings(null);
      try {
        const res = await fetch('/api/listings'); // Chama sua nova API Route
        if (res.ok) {
          const data = await res.json();
          setLatestListings(data.listings);
        } else {
          const errorData = await res.json();
          setErrorListings(errorData.error || 'Falha ao carregar listagens.');
        }
      } catch (error) {
        console.error('Erro de rede ao buscar listagens:', error);
        setErrorListings('Erro de conexão ao carregar listagens.');
      } finally {
        setLoadingListings(false);
      }
    }

    fetchLatestListings();
  }, []); // Array vazio para executar apenas uma vez na montagem

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">
        Bem-vindo à <span className="text-orange-400">Hack Lote</span>!
      </h1>

      {/* Seção de Categorias */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-purple-400">Explorar Categorias</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {sections.map((section, index) => (
            <CategoryCard key={index} title={section.title} items={section.items} />
          ))}
        </div>
      </section>

      {/* Seção de Últimas Listagens */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-yellow-400">✨ Últimas Listagens</h2>
        {loadingListings ? (
          <p className="text-gray-400 text-center">Carregando listagens...</p>
        ) : errorListings ? (
          <p className="text-red-500 text-center">Erro: {errorListings}</p>
        ) : latestListings.length === 0 ? (
          <p className="text-gray-400 text-center">Nenhuma listagem encontrada. Crie a primeira!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {latestListings.map((listing) => (
              <ProductCard
                key={listing.id}
                product={{
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  imageUrl: listing.imageUrl || '/img/default-product.png', // Imagem padrão
                  sellerName: listing.seller.usuario || listing.seller.nome || 'Vendedor Anônimo',
                  // Adicione outras props que seu ProductCard espera
                  // Ex: rating: 4.5, reviews: 10,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Últimas Atualizações (mantido do seu código anterior) */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-purple-400">📢 Últimas Atualizações</h2>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <p className="text-gray-300">
            Nada novo por enquanto... mas grandes coisas estão chegando! 🚀
          </p>
        </div>
      </section>

      {/* Conteúdo de Teste para Empurrar o Rodapé (Remova se não precisar mais) */}
      <div className="h-[200px] bg-gray-700 mt-10 flex items-center justify-center text-xl text-gray-300 rounded-lg">
        Espaço Extra
      </div>
    </div>
  );
}