// src/components/settings/security/SecuritySettings.tsx
'use client';

import React, { useState, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext'; // Para autenticação e redirecionamento
import { toast } from 'react-hot-toast'; // Para notificações ao usuário
import { useRouter } from 'next/navigation';

export default function SecuritySettings() {
  const { user } = useContext(AuthContext); // Precisamos do usuário logado para algumas validações
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para lidar com a submissão do formulário de alteração de senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Alterando senha...');

    try {
      const res = await fetch('/api/user/settings/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Adicionar token de autenticação se você usar um (ex: 'Authorization': `Bearer ${user.token}`)
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.dismiss();
        toast.success(result.message || 'Senha alterada com sucesso!');
        // Limpa os campos após sucesso
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.message || 'Falha ao alterar senha.');
      }
    } catch (error) {
      console.error('Erro de rede ao alterar senha:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao alterar senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se o usuário não estiver logado, redirecione ou mostre uma mensagem
  if (!user) {
    router.push('/login'); // Redireciona para login se não estiver logado
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Seção de Alterar Senha */}
      <section>
        <h3 className="text-xl font-semibold mb-4 text-white">Alterar Senha</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300">Senha Atual</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">Nova Senha</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-300">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </section>

      {/* Futuro: Seção de Autenticação de Dois Fatores (2FA) */}
      <section className="border-t border-gray-700 pt-8 mt-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Autenticação de Dois Fatores (2FA)</h3>
        <p className="text-gray-400">
          Adicione uma camada extra de segurança à sua conta.
        </p>
        <button
          type="button"
          disabled // Desabilitado por enquanto
          className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Habilitar 2FA (Em Breve)
        </button>
      </section>

      {/* Futuro: Seção de Sessões Ativas */}
      <section className="border-t border-gray-700 pt-8 mt-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Sessões Ativas</h3>
        <p className="text-gray-400">
          Gerencie os dispositivos onde sua conta está logada.
        </p>
        <button
          type="button"
          disabled // Desabilitado por enquanto
          className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ver Sessões (Em Breve)
        </button>
      </section>
    </div>
  );
}