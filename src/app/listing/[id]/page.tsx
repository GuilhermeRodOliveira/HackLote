// app/listing/[id]/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react'; // Adicionado useContext
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthContext } from '@/context/AuthContext'; // IMPORTA SEU AUTH CONTEXT AQUI

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
  sellerId: string; // Este campo é crucial para a verificação
  seller: { // Dados do vendedor incluídos na busca
    id: string; // O ID do vendedor é essencial
    usuario?: string;
    email: string;
    nome?: string;
  };
  createdAt: string;
  updatedAt: string;
  game?: string; // Incluído caso você adicione o campo 'game' na listagem
}

export default function ListingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  // Use seu próprio AuthContext
  const { user: currentUser, loading: authLoading } = useContext(AuthContext); 
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // O ID do usuário logado virá do seu AuthContext
  const currentUserId = currentUser?.id; 

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('ID da listagem não fornecido.');
      toast.error('ID da listagem não fornecido.');
      return;
    }

    const fetchListingDetails = async () => {
      try {
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
  }, [id]);

  // Garanta que isSeller seja sempre um boolean
  const isSeller = Boolean(listing && currentUserId && listing.sellerId === currentUserId);

  const handlePurchaseClick = () => {
    // Verifique se 'listing' não é nulo antes de prosseguir
    if (!listing) { 
        toast.error('Detalhes da listagem ainda não carregados.');
        return;
    }

    // Verifique se o usuário está logado antes de tentar comprar
    if (!currentUserId) {
      toast.error('Você precisa estar logado para comprar.');
      router.push('/login'); // Redireciona para o login
      return;
    }

    if (isSeller) {
      toast.error('Você não pode comprar um item que você mesmo listou.');
      return;
    }
    
    // Lógica para iniciar o processo de compra
    toast.info('Redirecionando para o processo de compra...');
    console.log(`Usuário ${currentUserId} tentando comprar a listagem ${listing.id}`);
    // Exemplo: router.push(`/checkout?listingId=${listing.id}`);
  };

  // Ajuste a condição de carregamento para incluir o carregamento do AuthContext
  if (loading || authLoading) { 
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
      <div className="content-box">
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
                e.currentTarget.src = 'https://placehold.co/600x400/4B5563/FFFFFF?text=Sem+Imagem';
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
          {listing.game && (
            <div>
              <p className="text-gray-400 text-sm">Jogo:</p>
              <p className="text-white text-base font-medium">{listing.game}</p>
            </div>
          )}
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
          <button 
            onClick={handlePurchaseClick}
            disabled={isSeller} 
            className={`font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform ${
              isSeller 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
            }`}
          >
            {isSeller ? 'Você não pode comprar seu próprio anúncio' : 'Comprar Agora'}
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}