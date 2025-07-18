// src/app/boosting/create/page.tsx
'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext'; // Importe o AuthContext

import BoostForm from '@/components/BoostRequestForm/BoostForm'; // Seu componente de formulário

export default function CreateBoostPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext); // Pega o usuário e o estado de carregamento do AuthContext

  // Redireciona para a página de login se o usuário não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Exibe um estado de carregamento enquanto a autenticação é verificada
  if (authLoading) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  // Se o usuário não estiver logado, não renderiza nada (redirecionamento já foi acionado)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white">
      <div className="max-w-xl mx-auto bg-gray-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400 text-center">Criar Pedido de Boosting</h1>
        <p className="text-gray-300 text-center mb-6">
          Descreva o serviço de boosting que você precisa.
        </p>
        <BoostForm /> {/* Renderiza o formulário de boost */}
      </div>
    </div>
  );
}