// src/components/settings/GeneralNotificationSettings/GeneralNotificationSettings.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function GeneralNotificationSettings() {
  // Estados para as configurações gerais de notificação
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Novo estado para indicar salvamento

  // Função para simular o salvamento das configurações no backend
  const saveSettingsToBackend = async (settings: { emailEnabled: boolean; pushEnabled: boolean; marketingEmails: boolean }) => {
    setIsSaving(true);
    try {
      // Aqui você faria a chamada REAL para a API para salvar as configurações
      // Exemplo:
      // const res = await fetch('/api/user/settings/notifications', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(settings),
      // });
      // const data = await res.json();

      // Simulação de delay da API
      await new Promise(resolve => setTimeout(resolve, 800));

      // if (res.ok) {
        toast.success('Configurações salvas automaticamente!');
        console.log('Configurações gerais salvas automaticamente:', settings);
      // } else {
      //   toast.error(data.error || 'Erro ao salvar configurações automaticamente.');
      // }
    } catch (error) {
      console.error('Erro de rede ao salvar configurações automaticamente:', error);
      toast.error('Erro de rede. Não foi possível salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  // Efeito para salvar automaticamente as configurações quando elas mudam
  useEffect(() => {
    // Evita o salvamento inicial quando o componente é montado
    // ou quando os estados são inicializados pela primeira vez.
    // Você pode adicionar uma flag para controlar isso se precisar carregar do backend.
    
    const handler = setTimeout(() => {
      saveSettingsToBackend({ emailEnabled, pushEnabled, marketingEmails });
    }, 500); // Debounce de 500ms para evitar muitas chamadas à API

    // Limpa o timeout se os estados mudarem novamente antes do tempo
    return () => {
      clearTimeout(handler);
    };
  }, [emailEnabled, pushEnabled, marketingEmails]); // Dependências: salva quando qualquer um desses estados muda

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Configurações de Notificação</h2>
      <p className="text-gray-400 mb-6">Gerencie como você deseja receber nossas atualizações e alertas.</p>

      {/* Seção de Notificações por E-mail */}
      <div className="bg-gray-700 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-white mb-4">Notificações por E-mail</h3>
        <div className="flex items-center justify-between">
          <label htmlFor="email-toggle" className="text-gray-300 cursor-pointer">
            Receber notificações por e-mail
          </label>
          <input
            type="checkbox"
            id="email-toggle"
            checked={emailEnabled}
            onChange={() => setEmailEnabled(!emailEnabled)}
            className="toggle-switch"
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <label htmlFor="marketing-toggle" className="text-gray-300 cursor-pointer">
            Receber novidades e promoções (e-mail)
          </label>
          <input
            type="checkbox"
            id="marketing-toggle"
            checked={marketingEmails}
            onChange={() => setMarketingEmails(!marketingEmails)}
            className="toggle-switch"
          />
        </div>
      </div>

      {/* Seção de Notificações no Aplicativo (Push/In-app) */}
      <div className="bg-gray-700 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-white mb-4">Notificações no Aplicativo</h3>
        <div className="flex items-center justify-between">
          <label htmlFor="push-toggle" className="text-gray-300 cursor-pointer">
            Receber notificações in-app (push)
          </label>
          <input
            type="checkbox"
            id="push-toggle"
            checked={pushEnabled}
            onChange={() => setPushEnabled(!pushEnabled)}
            className="toggle-switch"
          />
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Alertas importantes sobre sua conta, pedidos e mensagens serão exibidos diretamente no site.
        </p>
      </div>

      {/* Indicador de Salvamento */}
      {isSaving && (
        <p className="text-center text-yellow-400 text-sm mt-4">
          Salvando automaticamente...
        </p>
      )}

      {/* O botão "Salvar Alterações" foi removido para implementar o auto-save */}
      {/* <div className="mt-8 text-right">
        <button
          onClick={handleSaveSettings}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-md transition duration-300 shadow-lg"
        >
          Salvar Alterações
        </button>
      </div> */}

      {/* Estilos para o toggle switch (Tailwind CSS customizado) */}
      <style jsx>{`
        .toggle-switch {
          appearance: none;
          width: 48px;
          height: 24px;
          border-radius: 9999px;
          background-color: #4b5563; /* gray-600 */
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .toggle-switch:checked {
          background-color: #fcd34d; /* yellow-300 */
        }
        .toggle-switch::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #e5e7eb; /* gray-200 */
          top: 2px;
          left: 2px;
          transition: transform 0.3s ease, background-color 0.3s ease;
        }
        .toggle-switch:checked::before {
          transform: translateX(24px);
          background-color: #1f2937; /* gray-800 */
        }
      `}</style>
    </div>
  );
}
