// src/app/settings/page.tsx
'use client'; // Este componente será interativo

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Importe seus componentes de configurações aqui quando criá-los
// import ProfileSettings from '../../components/settings/ProfileSettings';
// import SecuritySettings from '../../components/settings/SecuritySettings';
// import NotificationSettings from '../../components/settings/NotificationSettings';
// import PrivacySettings from '../../components/settings/PrivacySettings';
// import InterfaceSettings from '../../components/settings/InterfaceSettings';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Obtém a aba ativa da URL (ex: /settings?tab=security)
  const activeTab = searchParams.get('tab') || 'profile'; // Padrão para 'profile'

  // Define as opções do menu de navegação das configurações
  const navItems = [
    { id: 'profile', name: 'Perfil', component: null /* ProfileSettings */ },
    { id: 'security', name: 'Segurança', component: null /* SecuritySettings */ },
    { id: 'notifications', name: 'Notificações', component: null /* NotificationSettings */ },
    { id: 'privacy', name: 'Privacidade', component: null /* PrivacySettings */ },
    { id: 'interface', name: 'Interface', component: null /* InterfaceSettings */ },
    // Adicione mais abas conforme necessário (ex: PaymentMethods, SellerSettings)
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0f0f1a] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">Configurações da Conta</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Menu de Navegação Lateral */}
          <nav className="flex-shrink-0 w-full md:w-56 bg-gray-800 rounded-lg p-4 shadow-lg">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/settings?tab=${item.id}`}
                    className={`block py-2 px-4 rounded-md text-sm font-medium transition-colors
                      ${activeTab === item.id
                        ? 'bg-yellow-400 text-black'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Conteúdo Principal das Configurações */}
          <div className="flex-grow bg-gray-800 rounded-lg p-6 shadow-lg">
            {/* Aqui renderizaremos o componente da aba ativa */}
            {activeTab === 'profile' && (
              <h2 className="text-2xl font-bold mb-6 text-white">Configurações de Perfil</h2>
              // <ProfileSettings /> // Substitua por seu componente ProfileSettings
            )}
            {activeTab === 'security' && (
              <h2 className="text-2xl font-bold mb-6 text-white">Configurações de Segurança</h2>
              // <SecuritySettings /> // Substitua por seu componente SecuritySettings
            )}
            {activeTab === 'notifications' && (
              <h2 className="text-2xl font-bold mb-6 text-white">Configurações de Notificações</h2>
              // <NotificationSettings /> // Substitua por seu componente NotificationSettings
            )}
            {activeTab === 'privacy' && (
              <h2 className="text-2xl font-bold mb-6 text-white">Configurações de Privacidade</h2>
              // <PrivacySettings /> // Substitua por seu componente PrivacySettings
            )}
            {activeTab === 'interface' && (
              <h2 className="text-2xl font-bold mb-6 text-white">Preferências de Interface</h2>
              // <InterfaceSettings /> // Substitua por seu componente InterfaceSettings
            )}
            {/* Mensagem padrão se a aba não for encontrada (ou para desenvolvimento) */}
            {!navItems.some(item => item.id === activeTab) && (
              <p className="text-gray-400">Selecione uma categoria de configuração.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}