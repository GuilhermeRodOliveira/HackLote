'use client';

import React, { useContext } from 'react';
import Image from 'next/image';
import styles from './SideBar.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AuthContext } from '@/context/AuthContext'; // importe o contexto

const logo = '/img/logo.png';

export default function SideBar() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  // Função logout chama logout do contexto e redireciona
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    router.push('/login');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Cabeçalho */}
      <div className={styles['sidebar-header']}>
        <Link href="/">
          <Image src={logo} alt="logo" width={42} height={42} className="cursor-pointer" />
        </Link>
        <h2>Menu</h2>
      </div>

      {/* Links principais */}
      <ul className={styles['sidebar-links']}>
        {/* Seção Menu */}
        <h4>
          <span className={styles.linkText}>Menu</span>
          <div className={styles['menu-separator']}></div>
        </h4>

        {/* Submenu Pedidos */}
        <li className={styles['submenu']}>
          <div className={styles['submenu-trigger']}>
            <span className="material-symbols-outlined">receipt</span>
            <span className={styles.linkText}>Pedidos</span>
          </div>
          <ul className={styles['submenu-items']}>
            <li><Link href="/compras">🛒 Compras</Link></li>
            <li><Link href="/vendas">💰 Vendas</Link></li>
          </ul>
        </li>

        {/* Link normal - Ofertas */}
        <li>
          <Link href="/ofertas">
            <span className="material-symbols-outlined">sell</span>
            <span className={styles.linkText}>Marketplace</span>
          </Link>
        </li>

        {/* Submenu Boosting */}
        <li className={styles['submenu']}>
          <div className={styles['submenu-trigger']}>
            <span className="material-symbols-outlined">stat_2</span>
            <span className={styles.linkText}>Boosting</span>
          </div>
          <ul className={styles['submenu-items']}>
            <li><Link href="/boosting/create">📥 Novo Boosting</Link></li>
            <li><Link href="/boosting/matches">📝 Ver Pedidos</Link></li>
          </ul>
        </li>

        {/* Seção Geral */}
        <h4>
          <span className={styles.linkText}>Geral</span>
          <div className={styles['menu-separator']}></div>
        </h4>

        <li>
          <Link href="/carteira">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className={styles.linkText}>Carteira</span>
          </Link>
        </li>
        <li>
          <Link href="/mensagens">
            <span className="material-symbols-outlined">chat</span>
            <span className={styles.linkText}>Mensagens</span>
          </Link>
        </li>
        <li>
          <Link href="/notificacoes">
            <span className="material-symbols-outlined">notifications_active</span>
            <span className={styles.linkText}>Notificações</span>
          </Link>
        </li>

        {/* Seção Conta */}
        <h4>
          <span className={styles.linkText}>Conta</span>
          <div className={styles['menu-separator']}></div>
        </h4>

        <li>
          <Link href="/perfil">
            <span className="material-symbols-outlined">account_circle</span>
            <span className={styles.linkText}>Perfil</span>
          </Link>
        </li>
        <li>
          <Link href="/configuracao">
            <span className="material-symbols-outlined">settings</span>
            <span className={styles.linkText}>Configuração</span>
          </Link>
        </li>

        {!user && (
          <li>
            <Link href="/login">
              <span className="material-symbols-outlined">login</span>
              <span className={styles.linkText}>Entrar</span>
            </Link>
          </li>
        )}

        {user && (
          <li>
            <a href="#" onClick={handleLogout} className="flex items-center gap-2">
              <span className="material-symbols-outlined">logout</span>
              <span className={styles.linkText}>Logout</span>
            </a>
          </li>
        )}
      </ul>

      {/* Perfil do usuário logado */}
      <div className={styles['user-account']}>
        <div className={styles['user-profile']}>
          <Image src={logo} alt="Avatar-img" width={42} height={42} />
          <div className={styles['user-detail']}>
            {user ? (
              <>
                <h3>{user.usuario || user.email}</h3>
                <span>ID: {user.id.slice(0, 6)}...</span>
              </>
            ) : (
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
