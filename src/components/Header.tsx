'use client';

import { Search, Bell, MessageSquare, Repeat } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0f0f1a] text-white shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[80px]">
        
        {/* Esquerda: Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="block">
            <Image
              src="/img/logo.png"
              alt="Hack Lote Logo"
              width={75}
              height={75}
              className="rounded-md cursor-pointer"
            />
          </Link>
        </div>

        {/* Centro: Navegação */}
        <nav className="flex-1 flex justify-center space-x-10 text-sm font-semibold text-white">
          <Link href="/login" className="hover:text-white transition">Login</Link>
          <Link href="/accounts" className="hover:text-white transition">Accounts</Link>
          <Link href="/top-up" className="hover:text-white transition">Top Up</Link>
          <Link href="/items" className="hover:text-white transition">Items</Link>
          <Link href="/boosting" className="hover:text-white transition">Boosting</Link>
        </nav>

        {/* Direita: Ícones */}
        <div className="flex items-center gap-4 text-white">
          <Repeat size={40} className="hover:text-white cursor-pointer" />
          <MessageSquare size={40} className="hover:text-white cursor-pointer" />
          <div className="relative">
            <Bell size={40} className="hover:text-white cursor-pointer" />
            {/* O span do contador de notificação continua amarelo */}
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[10px] px-1.5 py-[1px] rounded-full" />
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-yellow-300 overflow-hidden">
            <Image
              src="/img/avatar.png"
              alt="Avatar"
              width={36}
              height={36}
              className="object-cover w-full h-full bg-white"
            />
          </div>
        </div>
      </div>
    </header>
  );
}