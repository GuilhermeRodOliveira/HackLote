// src/app/listing/[id]/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthContext } from '@/context/AuthContext';
import FeedbackSection from '@/components/FeedbackSection/FeedbackSection';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    subCategory?: string;
    imageUrls?: string;
    attributes?: Record<string, any> | null;
    sellerId: string;
    seller: {
        id: string;
        usuario?: string;
        email: string;
        nome?: string;
    };
    createdAt: string;
    updatedAt: string;
    game?: string;
    stock: number;
}

const ListingDetailsPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useContext(AuthContext);
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const currentUserId = currentUser?.id;

    const imageUrlsArray = listing?.imageUrls ? listing.imageUrls.split(',').filter(Boolean) : [];

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
                    setListing(data);
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

    const isSeller = Boolean(listing && currentUserId && listing.sellerId === currentUserId);

    const handlePrevImage = () => {
        if (imageUrlsArray.length > 1) {
            setCurrentImageIndex(prevIndex => 
                prevIndex === 0 ? imageUrlsArray.length - 1 : prevIndex - 1
            );
        }
    };

    const handleNextImage = () => {
        if (imageUrlsArray.length > 1) {
            setCurrentImageIndex(prevIndex => 
                prevIndex === imageUrlsArray.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const handlePurchaseClick = () => {
        if (!listing) {
            toast.error('Detalhes da listagem ainda não carregados.');
            return;
        }
        if (!currentUserId) {
            toast.error('Você precisa estar logado para comprar.');
            router.push('/login');
            return;
        }
        if (isSeller) {
            toast.error('Você não pode comprar um item que você mesmo listou.');
            return;
        }
        if (listing.stock <= 0) {
            toast.error('Este item está fora de estoque.');
            return;
        }

        toast.info('Redirecionando para o processo de compra...');
        console.log(`Usuário ${currentUserId} tentando comprar a listagem ${listing.id}`);
    };

    const handleDelete = async () => {
        if (!listing || !currentUserId || listing.sellerId !== currentUserId) {
            toast.error('Você não tem permissão para excluir este anúncio.');
            return;
        }

        const deletePromise = fetch(`/api/listings/${id}`, {
            method: 'DELETE',
        }).then(async res => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Falha ao excluir o anúncio.');
            }
            router.push('/marketplace');
            return 'Anúncio excluído com sucesso!';
        });

        toast.promise(
            deletePromise,
            {
                pending: 'Excluindo anúncio...',
                success: 'Anúncio excluído com sucesso!',
                error: 'Erro ao excluir o anúncio.'
            },
            {
                style: {
                    backgroundColor: '#1E293B',
                    color: '#E2E8F0',
                }
            }
        );
    };

    const handleEdit = () => {
        router.push(`/listing/edit/${id}`);
    };

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
        <div className="container mx-auto py-8 px-4 md:px-8">
            <div className="content-box">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-bold text-blue-400">{listing.title}</h1>
                    {isSeller && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleEdit}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Editar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
                            >
                                Excluir
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/2">
                        {imageUrlsArray.length > 0 ? (
                            <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
                                <Image
                                    src={imageUrlsArray[currentImageIndex]}
                                    alt={`${listing.title} - imagem ${currentImageIndex + 1}`}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                                {imageUrlsArray.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10 hover:bg-opacity-75 transition"
                                        >
                                            &lt;
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10 hover:bg-opacity-75 transition"
                                        >
                                            &gt;
                                        </button>
                                    </>
                                )}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {imageUrlsArray.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`w-3 h-3 rounded-full transition ${currentImageIndex === index ? 'bg-white' : 'bg-gray-400'}`}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-lg">
                                Sem Imagens Disponíveis
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-1/2">
                        <div className="mb-6">
                            <p className="text-gray-300 text-lg leading-relaxed">{listing.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-gray-400 text-sm">Categoria:</p>
                                <p className="text-white text-base font-medium">{listing.category}</p>
                            </div>
                            {listing.subCategory && (
                                <div>
                                    <p className="text-gray-400 text-sm">Subcategoria:</p>
                                    <p className="text-white text-base font-medium">{listing.subCategory}</p>
                                </div>
                            )}
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
                            <div>
                                <p className="text-gray-400 text-sm">Estoque:</p>
                                <p className={`text-white text-base font-bold ${listing.stock <= 0 ? 'text-red-500' : 'text-green-400'}`}>
                                    {listing.stock > 0 ? listing.stock : 'Fora de Estoque'}
                                </p>
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
                                disabled={isSeller || listing.stock <= 0}
                                className={`font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform ${isSeller || listing.stock <= 0
                                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                                    }`}
                            >
                                {isSeller ? 'Você não pode comprar seu próprio anúncio' : (listing.stock > 0 ? 'Comprar Agora' : 'Fora de Estoque')}
                            </button>
                        </div>
                        
                        <FeedbackSection listingId={listing.id} />
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default ListingDetailsPage;