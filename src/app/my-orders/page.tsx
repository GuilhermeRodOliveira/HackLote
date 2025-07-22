// app/my-orders/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react'; // Adicionado useContext
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { AuthContext } from '@/context/AuthContext'; // IMPORTA SEU AUTH CONTEXT AQUI

// Interfaces para os dados do pedido e suas relações
interface ListingData {
  id: string;
  title: string;
  imageUrl?: string | null;
  price: number;
}

interface UserData {
  id: string;
  usuario?: string;
  email: string;
}

interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number; // Preço do pedido no momento da compra
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  listing: ListingData;
  buyer: UserData;
  seller: UserData;
}

export default function MyOrdersPage() {
  // Use seu próprio AuthContext
  const { user: currentUser, loading: authLoading } = useContext(AuthContext); 
  const router = useRouter(); // Para redirecionar para o login
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editedStatus, setEditedStatus] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState<string>('');

  // O ID do usuário logado virá do seu AuthContext
  const currentUserId = currentUser?.id;

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Erro ao carregar pedidos.');
        toast.error(errorData.error || 'Erro ao carregar pedidos.');
        // Se o erro for de não autorizado, redirecionar para o login
        if (res.status === 401) {
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Erro de rede ao buscar pedidos:', err);
      setError('Erro de rede. Verifique sua conexão.');
      toast.error('Erro de rede. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só tenta buscar pedidos se o AuthContext não estiver mais carregando
    // e se houver um usuário logado (currentUser.id)
    if (!authLoading) {
      if (currentUserId) {
        fetchOrders();
      } else {
        // Se não estiver autenticado, defina o estado de carregamento como falso e mostre mensagem de erro
        setLoading(false);
        setError('Você precisa estar logado para ver seus pedidos.');
        toast.error('Faça login para acessar esta página.');
      }
    }
  }, [authLoading, currentUserId]); // Depende do estado de carregamento e do ID do usuário do AuthContext

  const handleEditClick = (order: Order) => {
    setEditingOrderId(order.id);
    setEditedStatus(order.status);
    setEditedNotes(order.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditedStatus('');
    setEditedNotes('');
  };

  const handleSaveEdit = async (orderId: string) => {
    if (!currentUserId) {
      toast.error('Você não está logado. Faça login novamente.');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editedStatus,
          notes: editedNotes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Pedido atualizado com sucesso!');
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, status: editedStatus, notes: editedNotes }
              : order
          )
        );
        handleCancelEdit();
      } else {
        toast.error(data.error || 'Falha ao atualizar o pedido.');
      }
    } catch (err) {
      console.error('Erro de rede ao salvar edição:', err);
      toast.error('Erro de rede ao salvar edição. Tente novamente.');
    }
  };

  // Ajuste a condição de carregamento para incluir o carregamento do AuthContext
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-xl">
        Carregando pedidos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500 text-xl flex-col">
        {error}
        {currentUserId === undefined && ( // Mostra o botão de login apenas se não houver um usuário ou se a sessão não foi carregada
          <Link href="/login" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Ir para Login
          </Link>
        )}
        <ToastContainer />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-400 text-xl p-4">
        <p className="mb-4">Você não tem nenhum pedido (compra ou venda) ainda.</p>
        <Link href="/marketplace">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
            Explorar Marketplace
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Meus Pedidos</h1>

        <div className="space-y-6">
          {orders.map((order) => {
            const isBuyer = order.buyerId === currentUserId;
            const isSeller = order.sellerId === currentUserId;
            const isCurrentlyEditing = editingOrderId === order.id;

            return (
              <div key={order.id} className="content-box flex flex-col md:flex-row items-center p-6 gap-6">
                <div className="flex-shrink-0 w-32 h-32 relative rounded-md overflow-hidden">
                  {order.listing.imageUrl ? (
                    <Image
                      src={order.listing.imageUrl}
                      alt={order.listing.title}
                      layout="fill"
                      objectFit="cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/128x128/4B5563/FFFFFF?text=Sem+Imagem';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs text-center">
                      Sem Imagem
                    </div>
                  )}
                </div>

                <div className="flex-grow text-center md:text-left">
                  <h2 className="text-2xl font-semibold text-blue-400 mb-2">{order.listing.title}</h2>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">Tipo: </span>
                    {isBuyer && isSeller ? (
                      <span className="text-yellow-300">Meu Anúncio (Teste)</span>
                    ) : isBuyer ? (
                      <span className="text-purple-300">Compra</span>
                    ) : (
                      <span className="text-green-300">Venda</span>
                    )}
                  </p>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">Preço do Pedido:</span> R$ {order.price.toFixed(2)}
                  </p>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">Comprador:</span> {order.buyer.usuario || order.buyer.email}
                  </p>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">Vendedor:</span> {order.seller.usuario || order.seller.email}
                  </p>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">Data do Pedido:</span>{' '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  
                  {isCurrentlyEditing ? (
                    <div className="mt-4 p-3 bg-gray-700 rounded-md">
                      <div className="mb-2">
                        <label htmlFor={`status-${order.id}`} className="block text-sm font-medium text-gray-300 mb-1">
                          Status:
                        </label>
                        <select
                          id={`status-${order.id}`}
                          value={editedStatus}
                          onChange={(e) => setEditedStatus(e.target.value)}
                          className="w-full p-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500"
                        >
                          {/* Opções de status que o VENDEDOR pode mudar */}
                          <option value="Pendente">Pendente</option>
                          <option value="Processando">Processando</option>
                          <option value="Entregue">Entregue</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>
                      <div className="mb-2">
                        <label htmlFor={`notes-${order.id}`} className="block text-sm font-medium text-gray-300 mb-1">
                          Notas:
                        </label>
                        <textarea
                          id={`notes-${order.id}`}
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                          rows={3}
                          placeholder="Adicione notas sobre o pedido..."
                          className="w-full p-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSaveEdit(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-300 mt-2 text-lg">
                        <span className="font-semibold">Status:</span>{' '}
                        <span className={`font-bold ${order.status === 'Concluído' ? 'text-green-500' : order.status === 'Cancelado' ? 'text-red-500' : 'text-orange-400'}`}>
                          {order.status}
                        </span>
                      </p>
                      {order.notes && (
                        <p className="text-gray-400 text-sm mt-1">
                          <span className="font-semibold">Notas:</span> {order.notes}
                        </p>
                      )}
                      
                      {/* Botão de Editar visível apenas para o VENDEDOR */}
                      {isSeller && (
                        <button
                          onClick={() => handleEditClick(order)}
                          className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
                        >
                          Editar Pedido
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}