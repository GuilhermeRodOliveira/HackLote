// src/app/minhas-listagens/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthContext } from '@/context/AuthContext'; // Importa seu AuthContext

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
  createdAt: string;
  updatedAt: string;
  game?: string; // Adicionado 'game' para exibição
}

export default function MyListingsPage() {
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyListings = async () => {
      setLoading(true);
      setError(null);

      // Só tenta buscar se o AuthContext não estiver mais carregando
      // e se houver um usuário logado (currentUser.id)
      if (!authLoading) {
        if (currentUser && currentUser.id) {
          try {
            const res = await fetch('/api/my-listings'); // Chama seu novo endpoint de API
            const data = await res.json();

            if (res.ok) {
              setListings(data.listings);
            } else {
              setError(data.error || 'Erro ao carregar suas publicações.');
              toast.error(data.error || 'Erro ao carregar suas publicações.');
              // Se não autorizado, redirecionar para o login
              if (res.status === 401) {
                router.push('/login');
              }
            }
          } catch (err) {
            console.error('Erro de rede ao buscar minhas publicações:', err);
            setError('Erro de rede. Verifique sua conexão.');
            toast.error('Erro de rede. Verifique sua conexão.');
          } finally {
            setLoading(false);
          }
        } else {
          // Se não estiver autenticado, defina o estado de carregamento como falso e mostre mensagem de erro
          setLoading(false);
          setError('Você precisa estar logado para ver suas publicações.');
          toast.error('Faça login para acessar esta página.');
        }
      }
    };

    fetchMyListings();
  }, [authLoading, currentUser, router]); // Depende do estado de carregamento do AuthContext e do usuário

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-xl">
        Carregando suas publicações...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500 text-xl flex-col">
        {error}
        {!currentUser && ( // Mostra o botão de login apenas se não houver um usuário logado
          <Link href="/login">
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Ir para Login
            </button>
          </Link>
        )}
        <ToastContainer />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-400 text-xl p-4">
        <p className="mb-4">Você ainda não tem publicações ativas.</p>
        <Link href="/create-listing">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
            Publicar Novo Serviço
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Minhas Publicações</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
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
                      e.currentTarget.src = 'https://placehold.co/400x200/4B5563/FFFFFF?text=Sem+Imagem';
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
                    {listing.game && ` (${listing.game})`}
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
                {/* Você pode adicionar botões de Editar/Excluir aqui para suas próprias listagens */}
                <button
                  onClick={() => router.push(`/listing/${listing.id}`)}
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}