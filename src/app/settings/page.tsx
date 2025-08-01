// src/components/settings/GeneralNotificationSettings.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '@/context/AuthContext';

interface UserNotificationPreferences {
  receiveMarketingEmails: boolean;
  receiveOrderUpdates: boolean;
  receiveMessageNotifications: boolean;
  receiveInAppNotifications: boolean;
}

export default function GeneralNotificationSettings() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [preferences, setPreferences] = useState<UserNotificationPreferences>({
    receiveMarketingEmails: true,
    receiveOrderUpdates: true,
    receiveMessageNotifications: true,
    receiveInAppNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (authLoading) return;

      if (!user) {
        setIsLoading(false);
        // O usuário não deveria chegar aqui se não estiver logado, mas é uma segurança.
        // O router.push('/login') pode ser feito no nível do AuthContext ou do layout.
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/user/notification-settings');
        const data = await res.json();

        if (res.ok && data.preferences) {
          setPreferences(data.preferences);
        } else {
          toast.error(data.error || 'Erro ao carregar configurações de notificação.');
        }
      } catch (error) {
        console.error('Erro de rede ao buscar configurações de notificação:', error);
        toast.error('Erro de rede ao carregar configurações de notificação.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user, authLoading]);

  const handleToggleChange = (field: keyof UserNotificationPreferences, isChecked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [field]: isChecked,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Configurações de notificação salvas com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao salvar configurações de notificação.');
      }
    } catch (error) {
      console.error('Erro de rede ao salvar configurações de notificação:', error);
      toast.error('Erro de rede ao salvar configurações de notificação.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-gray-400">Carregando suas preferências de notificação...</p>
      </div>
    );
  }


  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Configurações de Notificações Gerais</h2>
      <p className="text-gray-400 mb-8">
        Controle como você recebe atualizações importantes sobre sua conta, pedidos e atividades.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-700">
          <span className="text-gray-200 text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-blue-400">mail</span>
            Receber E-mails de Marketing
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.receiveMarketingEmails}
              onChange={(e) => handleToggleChange('receiveMarketingEmails', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-700">
          <span className="text-gray-200 text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-green-400">local_shipping</span>
            Receber Atualizações de Pedidos (Compras e Vendas)
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.receiveOrderUpdates}
              onChange={(e) => handleToggleChange('receiveOrderUpdates', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-700">
          <span className="text-gray-200 text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-orange-400">chat</span>
            Receber Notificações de Mensagens
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.receiveMessageNotifications}
              onChange={(e) => handleToggleChange('receiveMessageNotifications', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-gray-200 text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-yellow-400">notifications</span>
            Receber Notificações no Aplicativo (badge, popups)
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.receiveInAppNotifications}
              onChange={(e) => handleToggleChange('receiveInAppNotifications', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

      </div>

      <button
        onClick={handleSave}
        className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        disabled={isSaving}
      >
        {isSaving ? 'Salvando Configurações...' : 'Salvar Configurações'}
      </button>
    </div>
  );
}