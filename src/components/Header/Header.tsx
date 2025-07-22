// src/components/Header/Header.tsx
'use client';

import React, { useContext, useState, useEffect } from 'react';
// Removido 'Search' se não for mais usado no header, mantendo os que são visíveis
import { Bell, MessageSquare, Repeat, Menu, X, Wallet, Settings, Home, DollarSign, UserRound, Zap, ListPlus, ShoppingBag, Receipt } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'; // << CORRIGIDO: Importado de react-hot-toast

import { AuthContext } from '@/context/AuthContext';
import type { User } from '@/context/AuthContext';

interface UserWithProfile extends User {
  profilePictureUrl?: string;
}

export default function Header() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading, logout } = useContext(AuthContext); 
  
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

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
    if (currentUser) {
      router.push(`/perfil/${currentUser.id}`);
    } else {
      router.push('/login');
    }
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
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0f0f1a] text-white shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[80px]"> 
        
        {/* Lado Esquerdo: Logo do Site e Botão de Menu Principal */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <button
            onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
            aria-label="Abrir menu principal"
            className="p-1 rounded-full hover:bg-gray-700 transition"
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
            className="w-full max-w-md p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
            onKeyDown={handleSearchSubmit}
          />
        </div>

        {/* Lado Direito: Ícones de Ações Rápidas e Perfil do Usuário */}
        <div className="flex items-center gap-4 text-white flex-shrink-0"> 
          
          <button onClick={() => handleLinkClick('/mensagens')} aria-label="Ver minhas mensagens" className="p-1 rounded-full hover:bg-gray-700 transition">
            <MessageSquare size={24} className="hover:text-gray-300" />
          </button>
          
          <button onClick={() => handleLinkClick('/notificacoes')} aria-label="Ver minhas notificações" className="relative p-1 rounded-full hover:bg-gray-700 transition">
            <Bell size={24} className="hover:text-gray-300" />
            {notificationCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[10px] px-1.5 py-[1px] rounded-full font-bold">
                {notificationCount}
              </span>
            )}
          </button>
          
          {/* Avatar do Usuário ou Botão de Login/Registro */}
          {authLoading ? (
            <div className="w-9 h-9 rounded-full bg-gray-700 animate-pulse"></div>
          ) : currentUser ? (
            <div className="relative group">
              <button 
                onClick={handleProfileClick} 
                aria-label={currentUser.usuario ? `Perfil de ${currentUser.usuario}` : `Perfil de ${currentUser.email}`}
                className="w-9 h-9 rounded-full border-2 border-yellow-300 overflow-hidden flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <Image
                  src={(currentUser as UserWithProfile).profilePictureUrl || "/img/avatar.png"}
                  alt={currentUser.usuario || "Usuário"}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full bg-white"
                />
              </button>
              {/* Dropdown de perfil para desktop */}
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link href={`/perfil/${currentUser.id}`} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700" onClick={() => setIsMainMenuOpen(false)}>
                  Meu Perfil
                </Link>
                <Link href="/configuracao" className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700" onClick={() => setIsMainMenuOpen(false)}>
                  Configurações
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md transition duration-200" onClick={() => setIsMainMenuOpen(false)}>
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded-md transition duration-200" onClick={() => setIsMainMenuOpen(false)}>
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
            className={`fixed top-0 left-0 h-full w-64 bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out z-40 
              ${isMainMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700 h-[80px]">
              <h3 className="text-xl font-bold text-yellow-400">Menu</h3>
              <button onClick={() => setIsMainMenuOpen(false)} className="p-1 rounded-full hover:bg-gray-700 transition">
                <X size={24} />
              </button>
            </div>
            
            {/* Barra de Pesquisa no Menu para Mobile */}
            <div className="md:hidden px-4 py-2">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  aria-label="Pesquisar em menu principal"
                  className="w-full p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
                  onKeyDown={handleSearchSubmit}
                />
              </div>

            <nav className="flex flex-col gap-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}> {/* Rolagem para menus longos */}
              {/* Links Principais do Aplicativo */}
              <Link href="/" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/')}>
                <Home size={18} className="mr-3" /> Página Inicial
              </Link>
              <Link href="/marketplace" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/marketplace')}>
                <ShoppingBag size={18} className="mr-3" /> Marketplace
              </Link>
              <Link href="/create-listing" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/create-listing')}>
                <ListPlus size={18} className="mr-3" /> Postar Novo Serviço
              </Link>
              <Link href="/minhas-listagens" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/minhas-listagens')}>
                <Repeat size={18} className="mr-3" /> Minhas Publicações
              </Link>

              {/* Seção Boosting (Destaque conforme pedido) */}
              <p className="text-sm font-semibold text-gray-400 mt-4 mb-1 px-3">Boosting</p>
              {/* Opção "Seja um Booster!" - Onde o usuário configura o que pode boostar */}
              <Link href="/configuracao?tab=notifications" className="flex items-center px-3 py-2 text-yellow-400 hover:bg-gray-700 rounded-md transition font-semibold" onClick={() => handleLinkClick('/configuracao?tab=notifications')}>
                <Zap size={18} className="mr-3" /> Seja um Booster!
              </Link>
              {/* Opção "Meus Boostings" - Onde o usuário vê os pedidos que fez ou está fazendo */}
              <Link href="/boosting/my-boosts" className="flex items-center px-3 py-2 text-yellow-400 hover:bg-gray-700 rounded-md transition font-semibold" onClick={() => handleLinkClick('/boosting/my-boosts')}>
                <Repeat size={18} className="mr-3" /> Meus Boostings
              </Link>


              {/* Seção Pedidos */}
              <p className="text-sm font-semibold text-gray-400 mt-4 mb-1 px-3">Pedidos</p>
              <Link href="/my-orders" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/my-orders')}>
                <Receipt size={18} className="mr-3" /> Pedidos em aberto
              </Link>
              <Link href="/compras" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/compras')}>
                <ShoppingBag size={18} className="mr-3" /> Compras
              </Link>
              <Link href="/vendas" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/vendas')}>
                <DollarSign size={18} className="mr-3" /> Vendas
              </Link>

              {/* Seção Geral */}
              <p className="text-sm font-semibold text-gray-400 mt-4 mb-1 px-3">Geral</p>
              <Link href="/carteira" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/carteira')}>
                <Wallet size={18} className="mr-3" /> Carteira
              </Link>
              <Link href="/mensagens" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/mensagens')}>
                <MessageSquare size={18} className="mr-3" /> Mensagens
              </Link>
              <Link href="/notificacoes" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/notificacoes')}>
                <Bell size={18} className="mr-3" /> Notificações
                {notificationCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </Link>

              {/* Seção Conta */}
              <p className="text-sm font-semibold text-gray-400 mt-4 mb-1 px-3">Conta</p>
              {currentUser ? (
                <>
                  <Link href={`/perfil/${currentUser.id}`} className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={handleProfileClick}>
                    <UserRound size={18} className="mr-3" /> Meu Perfil
                  </Link>
                  <Link href="/configuracao" className="flex items-center px-3 py-2 text-gray-200 hover:bg-gray-700 rounded-md transition" onClick={() => handleLinkClick('/configuracao')}>
                    <Settings size={18} className="mr-3" /> Configurações
                  </Link>
                  <button onClick={handleLogout} className="flex items-center w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded-md transition mt-2">
                    <X size={18} className="mr-3" /> Sair
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link href="/login">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition" onClick={() => setIsMainMenuOpen(false)}>
                      Login
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md transition" onClick={() => setIsMainMenuOpen(false)}>
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
