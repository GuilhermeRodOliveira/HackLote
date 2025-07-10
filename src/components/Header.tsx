// src/components/Header.tsx
'use client';

import { Search, Bell, MessageSquare, Repeat } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import NavBar from './NavBar'; // Importa o componente NavBar

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0f0f1a] text-white shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-10 h-[80px]"> 
        
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

        {/* Centro: Navegação (o NavBar que contém os links) */}
        <NavBar /> 

        {/* Direita: Ícones */}
        <div className="flex items-center gap-6 text-white"> 
          <Repeat size={40} className="hover:text-gray-300 cursor-pointer" /> 
          <MessageSquare size={40} className="hover:text-gray-300 cursor-pointer" />
          <div className="relative">
            <Bell size={40} className="hover:text-gray-300 cursor-pointer" />
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