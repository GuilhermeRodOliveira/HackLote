// src/components/NavBar.tsx
'use client';

import Link from 'next/link';

export default function NavBar() {
  return (
    // Ajustado hover:text-black para hover:text-gray-300 para manter a consistência de cor branca
    <nav className="flex-1 flex justify-center gap-x-16 text-sm font-semibold text-white">
      <Link href="/login" className="hover:text-gray-300 transition">Login</Link> 
      <Link href="/accounts" className="hover:text-gray-300 transition">Accounts</Link>
      <Link href="/top-up" className="hover:text-gray-300 transition">Top Up</Link>
      <Link href="/items" className="hover:text-gray-300 transition">Items</Link>
      <Link href="/boosting" className="hover:text-gray-300 transition">Boosting</Link>
    </nav>
  );
}