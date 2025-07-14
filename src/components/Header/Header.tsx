// src/components/Header.tsx
'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0f0f1a] text-white shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
          <h1 className="text-xl font-bold">HACK LOTE</h1>
          <button onClick={handleToggleSidebar}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* BACKDROP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={handleCloseSidebar}
        />
      )}
    </>
  );
}
