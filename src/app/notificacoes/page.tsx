'use client';

import React, { useState, useEffect, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '@/context/AuthContext';
import Link from 'next/link';

// Interface genérica para uma notificação
interface GeneralNotification {
  id: string;
  type: 'order_status' | 'boost_request_match' | 'message' | 'system_alert' | 'bid_update' | 'sale_confirmation' | 'purchase_confirmation'; // Adicione mais tipos conforme necessário
  title: string;
  message: string;
  link?: string; // Link para detalhes da notificação
  createdAt: string;
  isRead: boolean; // Adicione um campo para status de lido
  metadata?: any; // Para dados adicionais específicos do tipo de notificação
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<GeneralNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => { // Função assíncrona declarada aqui
      if (authLoading) return;

      if (!user) {
        setIsLoading(false);
        setError('Você precisa estar logado para ver suas notificações.');
        toast.error('Você precisa estar logado para ver suas notificações.');
        return;
      }

      try {
        // TODO: Mudar esta API para uma que retorne NOTIFICAÇÕES GERAIS
        // Por enquanto, vou manter a sua API de boost-requests como um exemplo,
        // mas idealmente você teria uma rota /api/notifications/general
        const res = await fetch('/api/notifications/boost-requests'); // ATENÇÃO: Substitua esta URL pela sua API de notificações GERAIS
        const data = await res.json();

        if (res.ok) {
          // Mapear os dados da API de boost-requests para o formato de GeneralNotification
          // Esta é uma adaptação TEMPORÁRIA para usar sua API existente como exemplo.
          // O ideal é que sua API de notificações gerais já retorne no formato GeneralNotification.
          const fetchedBoostNotifications: any[] = data.boostRequests || [];
          const mappedNotifications: GeneralNotification[] = fetchedBoostNotifications.map(
            (boostReq: any) => ({ // 'boostReq' agora tem tipo 'any' para evitar erro de tipagem implícita
              id: boostReq.id,
              type: 'boost_request_match', // Exemplo de tipo
              title: `Novo Pedido de Boost para ${boostReq.game}`,
              message: `De ${boostReq.currentRank} para ${boostReq.desiredRank}. Pedido por: ${boostReq.user.usuario || boostReq.user.email}. ${boostReq.description ? `Descrição: ${boostReq.description}` : ''}`,
              link: `/boosting/matches/${boostReq.id}`,
              createdAt: boostReq.createdAt,
              isRead: false, // Assumindo false por padrão ou vindo da API
              metadata: {
                game: boostReq.game,
                currentRank: boostReq.currentRank,
                desiredRank: boostReq.desiredRank,
                userRequester: boostReq.user.usuario || boostReq.user.email,
              },
            })
          );
          setNotifications(mappedNotifications);
        } else {
          setError(data.error || 'Erro ao carregar notificações.');
          toast.error(data.error || 'Erro ao carregar notificações.');
        }
      } catch (err) {
        console.error('Erro de rede ao buscar notificações:', err);
        setError('Erro de rede. Verifique sua conexão.');
        toast.error('Erro de rede. Verifique sua conexão.');
      } finally { // O bloco finally deve fechar o try/catch
        setIsLoading(false);
      }
    }; // Fim da declaração da função fetchNotifications

    fetchNotifications(); // Chama a função aqui dentro do useEffect
  }, [user, authLoading]);

  // Função para determinar o ícone e a cor baseados no tipo de notificação
  const getNotificationIconAndColor = (type: GeneralNotification['type']) => {
    switch (type) {
      case 'order_status':
        return { icon: 'shopping_cart', color: 'text-green-400' };
      case 'boost_request_match':
        return { icon: 'rocket_launch', color: 'text-purple-400' };
      case 'message':
        return { icon: 'chat', color: 'text-blue-400' };
      case 'system_alert':
        return { icon: 'info', color: 'text-yellow-400' };
      case 'bid_update':
        return { icon: 'gavel', color: 'text-orange-400' };
      case 'sale_confirmation':
        return { icon: 'paid', color: 'text-green-500' };
      case 'purchase_confirmation':
        return { icon: 'receipt_long', color: 'text-blue-500' };
      default:
        return { icon: 'notifications', color: 'text-gray-400' };
    }
  };

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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-4xl text-yellow-400">notifications</span>
        Minhas Notificações
      </h1>
      <p className="text-gray-400 mb-8">
        Aqui você verá todas as notificações importantes relacionadas à sua conta e atividades, incluindo status de pedidos, mensagens e outras atualizações.
      </p>

      {notifications.length === 0 ? (
        <div className="content-box text-center text-gray-400 text-lg py-8">
          Nenhuma notificação encontrada no momento.
          <p className="mt-4 text-base">
            Encontre mais oportunidades de boost em sua área de Booster.
          </p>
          {/* Este link deve levar para a página principal do booster ou para o botão "Seja um Booster" */}
          <Link href="/seja-um-booster" className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
            Acessar Área de Booster
            <span className="material-symbols-outlined ml-2 text-lg">arrow_forward</span>
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notification: GeneralNotification) => { // 'notification' agora tem tipo explícito
            const { icon, color } = getNotificationIconAndColor(notification.type);
            return (
              <li key={notification.id} className="content-box flex items-start gap-4 p-4">
                <span className={`material-symbols-outlined text-3xl ${color}`}>
                  {icon}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className={`text-xl font-semibold ${color}`}>{notification.title}</h2>
                    <span className="text-sm text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-300 text-base mb-2">{notification.message}</p>
                  {notification.link && (
                    <div className="mt-2 text-right">
                      <Link href={notification.link} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                        Ver Detalhes
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ToastContainer />
    </div>
  );
}