// src/app/listing/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    // Adicione todos os outros campos do seu formulário aqui
}

const EditListingPage = () => {
    const router = useRouter();
    const { id } = useParams();
    const [formData, setFormData] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            toast.error('ID da listagem não fornecido.');
            return;
        }

        const fetchListingData = async () => {
            try {
                const res = await fetch(`/api/listings/${id}`);
                const data = await res.json();
                
                if (res.ok) {
                    setFormData(data);
                } else {
                    toast.error(data.error || 'Falha ao carregar a listagem.');
                }
            } catch (err) {
                console.error('Erro de rede:', err);
                toast.error('Erro de rede ao carregar a listagem.');
            } finally {
                setLoading(false);
            }
        };

        fetchListingData();
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        toast.promise(
            fetch(`/api/listings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            }).then(async res => {
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Falha ao atualizar a listagem.');
                }
                return res.json();
            }),
            {
                pending: 'Salvando alterações...',
                success: 'Listagem atualizada com sucesso!',
                error: 'Erro ao atualizar a listagem. Tente novamente.'
            },
            {
                style: {
                    backgroundColor: '#1E293B',
                    color: '#E2E8F0',
                }
            }
        ).then(() => {
            router.push(`/listing/${id}`);
        });
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white text-xl">Carregando dados para edição...</div>;
    }

    if (!formData) {
        return <div className="min-h-screen flex items-center justify-center text-red-500 text-xl">Listagem não encontrada ou erro ao carregar.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Editar Anúncio: {formData.title}</h1>
            <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded-lg shadow-lg">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Título</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full p-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full p-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="w-full p-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:ring-blue-500 focus:border-blue-500"
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                </div>
                
                <div className="flex justify-end gap-4 mt-8">
                    <button
                        type="button"
                        onClick={() => router.push(`/listing/${id}`)}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </form>
            <ToastContainer />
        </div>
    );
};

export default EditListingPage;