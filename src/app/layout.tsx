import './globals.css';
import SideBar from '@/components/SideBar/SideBar';
import type { Metadata } from 'next';
import ToastProvider from '@/components/ToastProvider/ToastProvider';

import { AuthProvider } from '@/context/AuthContext'; // import do AuthProvider

export const metadata: Metadata = {
  title: 'Hack Lote',
  description: 'Sua loja gamer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0f0f1a] text-white font-sans">
        <AuthProvider>
          <SideBar />
          <main style={{ paddingLeft: '85px', paddingTop: '24px' }}>
            {children}
          </main>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
