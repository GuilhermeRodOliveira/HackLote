// src/app/configuracao/page.tsx
'use client'; 

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Importe seus componentes de configurações aqui
import ProfileSettings from '../../components/settings/ProfileSettings/ProfileSettings'; 
import SecuritySettings from '../../components/settings/security/SecuritySettings'; 
import GeneralNotificationSettings from '../../components/settings/GeneralNotificationSettings/GeneralNotificationSettings'; 


export default function ConfiguracaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile'; 

  const navItems = [
    { id: 'profile', name: 'Perfil', component: ProfileSettings },
    { id: 'security', name: 'Segurança', component: SecuritySettings }, 
    // AGORA, a aba 'Notificações' aponta para as configurações GERAIS
    { id: 'notifications', name: 'Notificações', component: GeneralNotificationSettings }, 
    { id: 'privacy', name: 'Privacidade', component: null /* PrivacySettings */ },
    { id: 'interface', name: 'Interface', component: null /* InterfaceSettings */ },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0f0f1a] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400 text-center">Configurações da Conta</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Menu de Navegação Lateral */}
          <nav className="flex-shrink-0 w-full md:w-56 bg-gray-800 rounded-lg p-4 shadow-lg">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/configuracao?tab=${item.id}`} 
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
            {navItems.map((item) => (
              activeTab === item.id && item.component && (
                <React.Fragment key={item.id}>
                  <h2 className="text-2xl font-bold mb-6 text-white">{item.name}</h2>
                  <item.component /> 
                </React.Fragment>
              )
            ))}
            {!navItems.some(item => activeTab === item.id) && (
              <p className="text-gray-400">Selecione uma categoria de configuração para começar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
