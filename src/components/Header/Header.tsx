// src/components/Header/Header.tsx
'use client';

import React, { useContext, useState, useEffect } from 'react';
import { Bell, MessageSquare, Repeat, Menu, X, Wallet, Settings, Home, DollarSign, UserRound, Zap, ListPlus, ShoppingBag, Receipt, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { AuthContext } from '@/context/AuthContext';
import type { User } from '@/context/AuthContext';

interface UserWithProfile extends User {
  profilePictureUrl?: string;
  bio?: string;
  country?: string;
}

export default function Header() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading, logout } = useContext(AuthContext); 
  
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark'); 

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.classList.toggle('light-theme', savedTheme === 'light');
    } else {
      document.body.classList.add('dark-theme'); 
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      document.body.classList.toggle('light-theme', newTheme === 'light');
      document.body.classList.toggle('dark-theme', newTheme === 'dark'); 
      return newTheme;
    });
  };

  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!currentUser) {
        setNotificationCount(0);
        return;
      }
      try {
        const res = await fetch('/api/notifications/boost-requests'); 
        if (res.ok) {
          const data = await res.json();
          setNotificationCount(data.boostRequests?.length || 0);
        } else {
          console.error('Erro ao buscar contagem de notificações:', res.statusText);
        }
      } catch (error) {
        console.error('Erro de rede ao buscar notificações:', error);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Você foi desconectado!'); 
      router.push('/login');
      setIsMainMenuOpen(false);
    } catch (error) {
      toast.error('Erro ao fazer logout.');
    }
  };

  const handleProfileClick = () => {
    router.push('/perfil'); 
    setIsMainMenuOpen(false);
  };

  const handleLinkClick = (path: string) => {
    router.push(path);
    setIsMainMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      router.push(`/marketplace?search=${e.currentTarget.value}`);
      setIsMainMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-colors duration-300
                       bg-backgroundPrimary text-textPrimary shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[80px]"> 
        
        {/* Lado Esquerdo: Logo do Site e Botão de Menu Principal */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <button
            onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
            aria-label="Abrir menu principal"
            className="p-1 rounded-full hover:bg-backgroundSecondary transition-colors duration-200 text-textPrimary"
          >
            {isMainMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <Link href="/" className="block" aria-label="Página Inicial Hack Lote">
            <Image
              src="/img/logo.png"
              alt="Hack Lote Logo"
              width={75}
              height={75}
              className="rounded-md cursor-pointer"
            />
          </Link>
        </div>

        {/* Centro: Barra de Pesquisa Integrada (desktop) */}
        <div className="hidden md:flex flex-grow justify-center px-4">
          <input
            type="text"
            placeholder="Pesquisar..."
            aria-label="Pesquisar produtos e serviços"
            className="w-full max-w-md p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent1 placeholder-textSecondary
                       bg-backgroundSecondary text-textPrimary border border-borderColor transition-colors duration-200"
            onKeyDown={handleSearchSubmit}
          />
        </div>

        {/* Lado Direito: Ícones de Ações Rápidas e Perfil do Usuário */}
        <div className="flex items-center gap-4 flex-shrink-0"> 
          
          {/* Botão de alternar tema */}
          <button onClick={toggleTheme} aria-label="Alternar tema" 
                  className="p-1 rounded-full hover:bg-backgroundSecondary transition-colors duration-200 text-accent1">
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          <button onClick={() => handleLinkClick('/chats')} aria-label="Ver minhas mensagens" 
                  className="p-1 rounded-full hover:bg-backgroundSecondary transition-colors duration-200 text-textPrimary">
            <MessageSquare size={24} />
          </button>
          
          <button onClick={() => handleLinkClick('/notificacoes')} aria-label="Ver minhas notificações" 
                  className="relative p-1 rounded-full hover:bg-backgroundSecondary transition-colors duration-200 text-textPrimary">
            <Bell size={24} />
            {notificationCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 text-[10px] px-1.5 py-[1px] rounded-full font-bold
                               bg-accent1 text-backgroundPrimary"> {/* Cores de destaque */}
                {notificationCount}
              </span>
            )}
          </button>
          
          {/* Avatar do Usuário ou Botão de Login/Registro */}
          {authLoading ? (
            <div className="w-9 h-9 rounded-full bg-backgroundSecondary animate-pulse"></div>
          ) : currentUser ? (
            <div className="relative group">
              <button 
                onClick={handleProfileClick} 
                aria-label={currentUser.usuario ? `Perfil de ${currentUser.usuario}` : `Perfil de ${currentUser.email}`}
                className="w-9 h-9 rounded-full border-2 overflow-hidden flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-accent2
                           border-accent1 transition-colors duration-200"
              >
                <Image
                  src={(currentUser as UserWithProfile).profilePictureUrl || "/img/avatar.png"}
                  alt={currentUser.usuario || "Usuário"}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full bg-textPrimary"
                />
              </button>
              {/* Dropdown de perfil para desktop */}
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50
                             bg-backgroundSecondary text-textPrimary">
                <Link href="/perfil" className="block px-4 py-2 text-sm hover:bg-backgroundPrimary transition-colors duration-200 text-textPrimary" onClick={() => setIsMainMenuOpen(false)}>
                  Meu Perfil
                </Link>
                <Link href="/configuracao" className="block px-4 py-2 text-sm hover:bg-backgroundPrimary transition-colors duration-200 text-textPrimary" onClick={() => setIsMainMenuOpen(false)}>
                  Configurações
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-backgroundPrimary transition-colors duration-200">
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <button className="text-sm px-3 py-1.5 rounded-md transition duration-200
                                   bg-accent1 text-backgroundPrimary">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="text-sm px-3 py-1.5 rounded-md transition duration-200
                                   bg-accent2 text-textPrimary">
                  Registro
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Menu Principal Expandido (Sidebar-like overlay) */}
      {isMainMenuOpen && (
        <>
          {/* Overlay para fechar o menu ao clicar fora */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30" 
            onClick={() => setIsMainMenuOpen(false)}
          ></div>

          {/* Conteúdo do Menu Principal (o que se expande) */}
          <div 
            className={`fixed top-0 left-0 h-full w-64 shadow-xl transform transition-transform duration-300 ease-in-out z-40 
              ${isMainMenuOpen ? 'translate-x-0' : '-translate-x-full'}
              bg-backgroundSecondary text-textPrimary`}
          >
            <div className="flex justify-between items-center p-4 border-b border-borderColor h-[80px]">
              <h3 className="text-xl font-bold text-accent1">Menu</h3>
              <button onClick={() => setIsMainMenuOpen(false)} 
                      className="p-1 rounded-full hover:bg-backgroundPrimary transition-colors duration-200 text-textPrimary">
                <X size={24} />
              </button>
            </div>
            
            {/* Barra de Pesquisa no Menu para Mobile */}
            <div className="md:hidden px-4 py-2">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  aria-label="Pesquisar em menu principal"
                  className="w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent1 placeholder-textSecondary
                             bg-backgroundPrimary border border-borderColor text-textPrimary transition-colors duration-200"
                  onKeyDown={handleSearchSubmit}
                />
              </div>

            <nav className="flex flex-col gap-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              {/* Links Principais do Aplicativo */}
              <Link href="/" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/')}>
                <Home size={18} className="mr-3" /> Página Inicial
              </Link>
              <Link href="/marketplace" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/marketplace')}>
                <ShoppingBag size={18} className="mr-3" /> Marketplace
              </Link>
              <Link href="/create-listing" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/create-listing')}>
                <ListPlus size={18} className="mr-3" /> Postar Novo Serviço
              </Link>
              <Link href="/minhas-listagens" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/minhas-listagens')}>
                <Repeat size={18} className="mr-3" /> Minhas Publicações
              </Link>

              {/* Seção Boosting (Destaque conforme pedido) */}
              <p className="text-xs font-semibold mt-4 mb-1 px-3 text-borderColor">Boosting</p>
              <Link href="/booster/configuracoes" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 font-semibold hover:bg-backgroundPrimary text-accent1" onClick={() => handleLinkClick('/booster/configuracoes')}>
                <Zap size={18} className="mr-3" /> Seja um Booster!
              </Link>
              <Link href="/boosting/my-boosts" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 font-semibold hover:bg-backgroundPrimary text-accent1" onClick={() => handleLinkClick('/boosting/my-boosts')}>
                <Repeat size={18} className="mr-3" /> Meus Boostings
              </Link>

              {/* Seção Pedidos */}
              <p className="text-xs font-semibold mt-4 mb-1 px-3 text-borderColor">Pedidos</p>
              <Link href="/my-orders" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/my-orders')}>
                <Receipt size={18} className="mr-3" /> Pedidos em aberto
              </Link>
              <Link href="/compras" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/compras')}>
                <ShoppingBag size={18} className="mr-3" /> Compras
              </Link>
              <Link href="/vendas" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/vendas')}>
                <DollarSign size={18} className="mr-3" /> Vendas
              </Link>

              {/* Seção Geral */}
              <p className="text-xs font-semibold mt-4 mb-1 px-3 text-borderColor">Geral</p>
              <Link href="/wallet" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/carteira')}>
                <Wallet size={18} className="mr-3" /> Carteira
              </Link>
              <Link href="/chats" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/chats')}>
                <MessageSquare size={18} className="mr-3" /> Mensagens
              </Link>
              <Link href="/notificacoes" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/notificacoes')}>
                <Bell size={18} className="mr-3" /> Notificações
                {notificationCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full
                                     bg-accent2 text-textPrimary">
                    {notificationCount}
                  </span>
                )}
              </Link>

              {/* Seção Conta */}
              <p className="text-xs font-semibold mt-4 mb-1 px-3 text-borderColor">Conta</p>
              {currentUser ? (
                <>
                  <Link href="/perfil" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={handleProfileClick}>
                    <UserRound size={18} className="mr-3" /> Meu Perfil
                  </Link>
                  <Link href="/configuracao" className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 hover:bg-backgroundPrimary text-textPrimary" onClick={() => handleLinkClick('/configuracao')}>
                    <Settings size={18} className="mr-3" /> Configurações
                  </Link>
                  <button onClick={handleLogout} className="flex items-center w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-backgroundPrimary rounded-md transition mt-2">
                    <X size={18} className="mr-3" /> Sair
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link href="/login">
                    <button className="w-full px-3 py-2 rounded-md transition duration-200
                                     bg-accent1 text-backgroundPrimary">
                      Login
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="w-full px-3 py-2 rounded-md transition duration-200
                                     bg-accent2 text-textPrimary">
                      Registro
                    </button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}