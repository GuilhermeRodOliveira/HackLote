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
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Função para buscar as listagens
    const fetchListings = async () => {
      try {
        const res = await fetch('/api/listings'); // Chama o endpoint GET
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
  }, []); // Executa apenas uma vez na montagem do componente

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">
        Carregando listagens...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-500 text-xl">
        Erro: {error}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Marketplace</h1>
          <Link href="/create-listing">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
              Postar/Publicar Novo Serviço
            </button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="content-box text-center text-gray-400 text-lg mt-10">
            Nenhuma listagem encontrada. Seja o primeiro a publicar!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              // AQUI: Adicionamos a classe 'content-box' a cada item da listagem
              <div key={listing.id} className="content-box overflow-hidden flex flex-col transform hover:scale-105 transition duration-300 ease-in-out">
                {listing.imageUrl ? (
                  <div className="relative w-full h-48 bg-gray-700 flex items-center justify-center">
                    <Image
                      src={listing.imageUrl}
                      alt={listing.title}
                      layout="fill"
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
