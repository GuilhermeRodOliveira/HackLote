'use client';

import { Search, Bell, MessageSquare, Repeat, Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="flex justify-between items-center px-8 py-4 bg-[#0f0f1a] text-white shadow-lg">
      {/* Logo */}
      <div className="text-2xl font-bold leading-tight">
        <span className="block">HACK</span>
        <span className="block">LOTE</span>
      </div>

      {/* Navigation */}
      <nav className="space-x-4 hidden md:flex">
        <Link href="/login" className="hover:text-yellow-400 transition">Login</Link>
        <Link href="/accounts" className="hover:text-yellow-400 transition">Accounts</Link>
        <Link href="/top-up" className="hover:text-yellow-400 transition">Top Up</Link>
        <Link href="/items" className="hover:text-yellow-400 transition">Items</Link>
        <Link href="/boosting" className="hover:text-yellow-400 transition">Boosting</Link>
      </nav>

      {/* Icons */}
      <div className="flex items-center space-x-4 text-xl">
        <Repeat className="cursor-pointer" />
        <MessageSquare className="cursor-pointer" />
        <Bell className="cursor-pointer" />
        <Image
          src="/avatar.png"
          alt="Profile"
          width={32}
          height={32}
          className="rounded-full border-2 border-blue-500"
        />
      </div>
    </header>
  );
}
