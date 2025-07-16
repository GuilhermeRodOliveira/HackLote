'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
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
  createdAt: string;
  updatedAt: string;
}

export default function ListingDetailsPage() {
  const { id } = useParams(); // Hook do Next.js para obter parâmetros da URL (o ID da listagem)
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('ID da listagem não fornecido.');
      toast.error('ID da listagem não fornecido.');
      return;
    }

    const fetchListingDetails = async () => {
      try {
        // Chama o novo endpoint GET para uma única listagem pelo ID
        const res = await fetch(`/api/listings/${id}`); 
        const data = await res.json();

        if (res.ok) {
          setListing(data.listing);
        } else {
          setError(data.error || 'Listagem não encontrada.');
          toast.error(data.error || 'Listagem não encontrada.');
        }
      } catch (err) {
        console.error('Erro de rede ao buscar detalhes da listagem:', err);
        setError('Erro de rede. Verifique sua conexão.');
        toast.error('Erro de rede. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    };

    fetchListingDetails();
  }, [id]); // Dependência: refaz a busca se o ID da URL mudar

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Carregando detalhes da listagem...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-xl">
        Erro: {error}
        <ToastContainer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">
        Listagem não encontrada.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="content-box"> {/* Aplica a classe content-box para o contêiner principal */}
        <h1 className="text-3xl font-bold text-blue-400 mb-4">{listing.title}</h1>
        
        {listing.imageUrl ? (
          <div className="relative w-full h-64 mb-6 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/600x400/4B5563/FFFFFF?text=Sem+Imagem'; // Fallback
              }}
            />
          </div>
        ) : (
          <div className="w-full h-64 mb-6 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-lg">
            Sem Imagem Disponível
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-300 text-lg leading-relaxed">{listing.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-400 text-sm">Categoria:</p>
            <p className="text-white text-base font-medium">{listing.category}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Subcategoria:</p>
            <p className="text-white text-base font-medium">{listing.subCategory}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Vendedor:</p>
            <p className="text-white text-base font-medium">{listing.seller.usuario || listing.seller.email}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Publicado em:</p>
            <p className="text-white text-base font-medium">{new Date(listing.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {listing.attributes && Object.keys(listing.attributes).length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-3">Atributos Específicos:</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              {Object.entries(listing.attributes).map(([key, value]) => (
                <li key={key}>
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 p-4 bg-gray-700 rounded-lg">
          <span className="text-4xl font-bold text-green-400">R$ {listing.price.toFixed(2)}</span>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
            Comprar Agora
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
