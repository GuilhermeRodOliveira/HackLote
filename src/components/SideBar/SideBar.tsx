// src/components/SideBar/SideBar.tsx
'use client';

import React, { useContext, useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './SideBar.module.css'; // Mantenha este se você usa CSS Modules
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Importe o contexto de autenticação
import { AuthContext } from '@/context/AuthContext'; // Certifique-se de que o alias @/context está configurado em tsconfig.json

// Caminho para o logo
const logo = '/img/logo.png'; // Certifique-se que public/img/logo.png existe

export default function SideBar() {
  // Use o contexto para acessar o usuário e as funções de logout
  const { user, logout } = useContext(AuthContext);
  // Hook do Next.js para navegação
  const router = useRouter();
  // Estado para armazenar a contagem de notificações
  const [notificationCount, setNotificationCount] = useState<number | null>(null);

  // Função para lidar com o logout
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do link
    await logout(); // Chama a função de logout do contexto
    router.push('/login'); // Redireciona para a página de login após o logout
  };

  // useEffect para buscar a contagem de notificações
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) { // Só busca se o usuário estiver logado
        setNotificationCount(null); // Limpa a contagem se o usuário não estiver logado
        return;
      }

      try {
        // Chamando o endpoint correto para buscar notificações de boost
        const res = await fetch('/api/notifications/boost-requests'); 
        const data = await res.json();

        if (res.ok && Array.isArray(data.boostRequests)) {
          // Contamos o número de pedidos retornados
          setNotificationCount(data.boostRequests.length);
        } else {
          console.error('Erro ao buscar contagem de notificações:', data.error || res.statusText);
          setNotificationCount(null);
        }
      } catch (error) {
        console.error('Erro de rede ao buscar contagem de notificações:', error);
        setNotificationCount(null);
      }
    };

    // Busca a contagem na montagem e sempre que o usuário mudar
    fetchNotificationCount();

    // Opcional: Atualizar a contagem periodicamente (ex: a cada 30 segundos)
    const interval = setInterval(fetchNotificationCount, 30000); // A cada 30 segundos
    return () => clearInterval(interval); // Limpa o intervalo na desmontagem para evitar vazamento de memória
  }, [user]); // Dependência: user (para rebuscar quando o login/logout ocorrer)

  // Função para formatar a contagem (99+)
  const formatNotificationCount = (count: number | null) => {
    if (count === null || count === 0) {
      return null; // Não exibe nada se for 0 ou nulo
    }
    if (count > 99) {
      return '99+'; // Exibe "99+" se a contagem for maior que 99
    }
    return count; // Exibe o número exato
  };

  const formattedCount = formatNotificationCount(notificationCount);

  return (
    <aside className={styles.sidebar}>
      {/* Cabeçalho da barra lateral */}
      <div className={styles['sidebar-header']}>
        <Link href="/">
          {/* Imagem do logo com largura e altura definidas */}
          <Image src={logo} alt="logo" width={42} height={42} className="cursor-pointer" />
        </Link>
        <h2>Menu</h2>
      </div>

      {/* Lista principal de links da barra lateral */}
      <ul className={styles['sidebar-links']}>
        {/* Seção "Menu" */}
        <h4>
          <span className={styles.linkText}>Menu</span>
          <div className={styles['menu-separator']}></div> {/* Separador visual */}
        </h4>

        {/* Submenu Pedidos */}
        <li className={styles['submenu']}>
          <div className={styles['submenu-trigger']}>
            <span className="material-symbols-outlined">receipt</span> {/* Ícone de recibo */}
            <span className={styles.linkText}>Pedidos</span>
          </div>
          <ul className={styles['submenu-items']}>
            <li><Link href="/compras">🛒 Compras</Link></li>
            <li><Link href="/vendas">💰 Vendas</Link></li>
          </ul>
        </li>

        <li>
          <Link href="/marketplace">
            <span className="material-symbols-outlined">sell</span>
            <span className={styles.linkText}>Marketplace</span>
          </Link>
        </li>

        <li className={styles['submenu']}>
          <div className={styles['submenu-trigger']}>
            <span className="material-symbols-outlined">stat_2</span> {/* Ícone de estatísticas */}
            <span className={styles.linkText}>Boosting</span>
          </div>
          <ul className={styles['submenu-items']}>
            {/* ALTERADO: Link para "Meus Boostings" */}
            <li><Link href="/boosting/my-boosts">🚀 Meus Boostings</Link></li> 
            <li><Link href="/boosting/matches">📝 Ver Pedidos</Link></li>
          </ul>
        </li>

        {/* Seção "Geral" */}
        <h4>
          <span className={styles.linkText}>Geral</span>
          <div className={styles['menu-separator']}></div>
        </h4>

        {/* Links da seção "Geral" */}
        <li>
          <Link href="/carteira">
            <span className="material-symbols-outlined">account_balance_wallet</span> {/* Ícone de carteira */}
            <span className={styles.linkText}>Carteira</span>
          </Link>
        </li>
        <li>
          <Link href="/mensagens">
            <span className="material-symbols-outlined">chat</span> {/* Ícone de chat */}
            <span className={styles.linkText}>Mensagens</span>
          </Link>
        </li>
        <li>
          <Link href="/notificacoes">
            <span className="material-symbols-outlined">notifications_active</span> {/* Ícone de notificações */}
            <span className={styles.linkText}>Notificações</span>
            {/* Contador de Notificações */}
            {formattedCount && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                {formattedCount}
              </span>
            )}
          </Link>
        </li>

        {/* Seção "Conta" */}
        <h4>
          <span className={styles.linkText}>Conta</span>
          <div className={styles['menu-separator']}></div>
        </h4>

        {/* Links da seção "Conta" */}
        <li>
          <Link href="/perfil"> 
            <span className="material-symbols-outlined">account_circle</span> {/* Ícone de perfil */}
            <span className={styles.linkText}>Perfil</span>
          </Link>
        </li>
        <li>
          <Link href="/configuracao">
            <span className="material-symbols-outlined">settings</span> {/* Ícone de configurações */}
            <span className={styles.linkText}>Configuração</span>
          </Link>
        </li>

        {!user && (
          <li>
            <Link href="/login">
              <span className="material-symbols-outlined">login</span> {/* Ícone de login */}
              <span className={styles.linkText}>Entrar</span>
            </Link>
          </li>
        )}

        {user && (
          <li>
            <a href="#" onClick={handleLogout} className="flex items-center gap-2">
              <span className="material-symbols-outlined">logout</span> {/* Ícone de logout */}
              <span className={styles.linkText}>Logout</span>
            </a>
          </li>
        )}
      </ul>

      {/* Área de perfil do usuário logado na parte inferior da barra lateral */}
      <div className={styles['user-account']}>
        <div className={styles['user-profile']}>
          {/* Imagem do avatar do usuário */}
          {/* Você pode substituir 'logo' por user.profilePictureUrl aqui, se disponível no seu 'user' */}
          <Image src={logo} alt="Avatar-img" width={42} height={42} /> 
          <div className={styles['user-detail']}>
            {user ? (
              <>
                {/* Exibe o nome de usuário ou email */}
                <h3>{user.usuario || user.email}</h3>
                {/* Exibe uma parte do ID do usuário, garantindo que user.id exista */}
                <span>ID: {user.id ? user.id.slice(0, 6) : ''}...</span>
              </>
            ) : (
              // Se o usuário não estiver logado, exibe "Visitante"
              <>
                <h3>Visitante</h3>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
