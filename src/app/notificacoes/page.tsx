'use client';

import React, { useState, useEffect, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '@/context/AuthContext'; // Importe seu AuthContext
import Link from 'next/link'; // Para o link de detalhes do pedido

// Interface para um pedido de boost (deve corresponder ao que a API retorna)
interface BoostRequestNotification {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    usuario?: string;
    email: string;
    nome?: string;
  };
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<BoostRequestNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (authLoading) return; // Espera a autenticação carregar

      if (!user) {
        // Se não houver usuário logado, não há notificações para buscar
        setIsLoading(false);
        setError('Você precisa estar logado para ver suas notificações.');
        toast.error('Você precisa estar logado para ver suas notificações.');
        return;
      }

      try {
        const res = await fetch('/api/notifications/boost-requests');
        const data = await res.json();

        if (res.ok) {
          setNotifications(data.boostRequests);
        } else {
          setError(data.error || 'Erro ao carregar notificações.');
          toast.error(data.error || 'Erro ao carregar notificações.');
        }
      } catch (err) {
        console.error('Erro de rede ao buscar notificações:', err);
        setError('Erro de rede. Verifique sua conexão.');
        toast.error('Erro de rede. Verifique sua conexão.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user, authLoading]); // Dependências: user e authLoading do contexto

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Carregando notificações...
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

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-6">🔔 Notificações de Boost</h1>
      <p className="text-gray-400 mb-8">
        Aqui você verá os novos pedidos de boost que correspondem às suas preferências de notificação.
      </p>

      {notifications.length === 0 ? (
        <div className="content-box text-center text-gray-400 text-lg py-8">
          Nenhuma notificação encontrada.
          <p className="mt-2">Verifique suas <Link href="/boosting/settings" className="text-blue-400 hover:underline">Configurações de Notificação de Boost</Link>.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notification) => (
            <li key={notification.id} className="content-box">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-blue-400">{notification.game}</h2>
                <span className="text-sm text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-300">
                De <span className="font-medium">{notification.currentRank}</span> para <span className="font-medium">{notification.desiredRank}</span>
              </p>
              {notification.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                  Descrição: {notification.description}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-2">
                Pedido por: <span className="font-medium">{notification.user.usuario || notification.user.email}</span>
              </p>
              <div className="mt-4 text-right">
                <Link href={`/boosting/matches/${notification.id}`} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                  Ver Detalhes do Pedido
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ToastContainer />
    </div>
  );
}
