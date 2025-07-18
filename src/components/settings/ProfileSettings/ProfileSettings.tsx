// src/components/settings/ProfileSettings/ProfileSettings.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext'; // Importe seu AuthContext
import { toast } from 'react-hot-toast'; // Se você usa react-hot-toast para notificações
import Image from 'next/image'; // Para exibir o avatar
import { useRouter } from 'next/navigation'; // Para redirecionamento

interface UserProfileSettings {
  nome?: string | null;
  usuario?: string | null;
  email: string; // Email não será editável diretamente aqui, mas é bom ter
  bio?: string | null;
  profilePictureUrl?: string | null;
  country?: string | null;
}

export default function ProfileSettings() {
  const { user, loading: authLoading, refreshUser } = useContext(AuthContext);
  const router = useRouter(); // Inicialize o router
  const [formData, setFormData] = useState<UserProfileSettings>({
    nome: '',
    usuario: '',
    email: '',
    bio: '',
    profilePictureUrl: '/img/default-avatar.png', // Avatar padrão
    country: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para carregar os dados do usuário ao montar o componente
  useEffect(() => {
    async function fetchUserSettings() {
      // Se o usuário não estiver logado, não deve tentar buscar configurações
      if (!user) {
        setLoading(false);
        // O redirecionamento acontece no final do componente
        return;
      }
      
      setLoading(true);
      try {
        // TODO: Ajustar para pegar o userId da sessão real
        // Por enquanto, para teste, use um ID de usuário válido do seu DB que corresponda ao usuário logado
        const testUserId = user.id; // Usando o ID do usuário do contexto para teste

        const res = await fetch(`/api/user/settings?userId=${testUserId}`); // Passando userId como query param para teste
        
        if (res.ok) {
          const data: UserProfileSettings = await res.json();
          setFormData({
            nome: data.nome || '',
            usuario: data.usuario || '',
            email: data.email || '',
            bio: data.bio || '',
            profilePictureUrl: data.profilePictureUrl || '/img/default-avatar.png',
            country: data.country || '',
          });
        } else {
          const errorData = await res.json();
          toast.error(errorData.message || 'Erro ao carregar configurações do perfil.');
        }
      } catch (error) {
        console.error('Erro de rede ao carregar configurações:', error);
        toast.error('Erro de conexão ao carregar perfil.');
      } finally {
        setLoading(false);
      }
    }
    
    // Buscar configurações apenas se o user estiver disponível e não estiver carregando a autenticação
    if (user && !authLoading) {
      fetchUserSettings();
    }
  }, [user, authLoading]); // Dependências: user e authLoading para rebuscar quando o login/logout ocorrer

  // Função para lidar com a mudança nos inputs do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.loading('Salvando configurações...');

    try {
      // TODO: Ajustar para pegar o userId da sessão real
      const testUserId = user?.id; // Usando o ID do usuário do contexto para teste

      const res = await fetch(`/api/user/settings?userId=${testUserId}`, { // Passando userId como query param para teste
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Adicionar token de autenticação se você usar um (ex: 'Authorization': `Bearer ${user.token}`)
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        toast.dismiss(); // Remove o toast de loading
        toast.success(result.message || 'Perfil atualizado com sucesso!');
        // Atualiza os dados do usuário no contexto AuthContext se o nome/username mudou
        if (refreshUser) {
          await refreshUser(); 
        }
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.message || 'Falha ao atualizar perfil.');
      }
    } catch (error) {
      console.error('Erro de rede ao atualizar perfil:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao salvar perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se estiver carregando, mostre uma mensagem de carregamento
  if (loading || authLoading) {
    return <div className="text-gray-400 text-center py-8">Carregando configurações...</div>;
  }

  // Se o usuário não estiver logado, redireciona para a página de login
  if (!user) {
    router.push('/login'); 
    return null; // Não renderiza nada enquanto redireciona
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar do Usuário */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400">
          <Image
            src={formData.profilePictureUrl || '/img/default-avatar.png'}
            alt="Avatar do Usuário"
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>
        {/* Futuro: Input para upload de nova imagem de avatar */}
        <button type="button" className="text-yellow-400 hover:underline text-sm">
          Alterar Avatar (Em Breve)
        </button>
      </div>

      {/* Nome de Exibição */}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-300">Nome de Exibição</label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
        />
      </div>

      {/* Nome de Usuário */}
      <div>
        <label htmlFor="usuario" className="block text-sm font-medium text-gray-300">Nome de Usuário (único)</label>
        <input
          type="text"
          id="usuario"
          name="usuario"
          value={formData.usuario || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
        />
      </div>

      {/* Email (Não editável aqui, apenas para exibição) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email || ''}
          disabled // Email geralmente não é alterado diretamente aqui
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-400 shadow-sm sm:text-sm p-2 cursor-not-allowed"
        />
        <p className="mt-2 text-xs text-gray-500">Para alterar seu e-mail, entre em contato com o suporte.</p>
      </div>

      {/* Biografia */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Biografia</label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={formData.bio || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
        ></textarea>
      </div>

      {/* País */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-300">País/Região</label>
        <select
          id="country"
          name="country"
          value={formData.country || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
        >
          <option value="">Selecione um país...</option>
          <option value="BR">Brasil</option>
          <option value="US">Estados Unidos</option>
          <option value="PT">Portugal</option>
          {/* Adicione mais países conforme necessário */}
        </select>
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || loading || authLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}