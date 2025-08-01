// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import ListingCard from '@/components/ListingCard/ListingCard'; 
import { Listing } from '@/types/listing';
import CategoryCard from '@/components/CategoryCard/CategoryCard';


interface CategoryItem {
  title: string;
  icon: string;
}

interface Section {
  title: string;
  description?: string;
  items: CategoryItem[];
}


export default function HomePage() {
  const [latestListings, setLatestListings] = useState<Listing[]>([]); 
  const [loadingListings, setLoadingListings] = useState(true);
  const [errorListings, setErrorListings] = useState<string | null>(null);

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

  useEffect(() => {
    async function fetchLatestListings() {
      setLoadingListings(true);
      setErrorListings(null);
      try {
        const res = await fetch('/api/listings');
        if (res.ok) {
          const data = await res.json();
          // Certifique-se de que a API /api/listings retorna um array de 'Listing' completo
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
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-textDark">
        Bem-vindo à <span className="text-primary">Hack Lote</span>!
      </h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-textDark">Explorar Categorias</h2> 
        <div className="flex flex-wrap justify-center gap-6">
          {sections.map((section, index) => (
            <CategoryCard key={index} title={section.title} items={section.items} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-textDark">✨ Últimas Listagens</h2> 
        {loadingListings ? (
          <p className="text-textMuted text-center">Carregando listagens...</p> 
        ) : errorListings ? (
          <p className="text-statusError text-center">Erro: {errorListings}</p> 
        ) : latestListings.length === 0 ? (
          <p className="text-textMuted text-center">Nenhuma listagem encontrada. Crie a primeira!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {latestListings.map((listing) => (
    
              <ListingCard key={listing.id} listing={listing} /> 
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-textDark">📢 Últimas Atualizações</h2>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-textMuted">
          <p className="text-textDark">
            Nada novo por enquanto... mas grandes coisas estão chegando! 🚀
          </p>
        </div>
      </section>

      <div className="h-[200px] bg-textMuted mt-10 flex items-center justify-center text-xl text-white rounded-lg">
        Espaço Extra (Remover futuramente)
      </div>
    </div>
  );
}