// src/app/layout.tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/context/AuthContext';
// REMOVIDO: import SideBar from '@/components/SideBar/SideBar';
import Header from '@/components/Header/Header';
import Footer from '../components/Footer/Footer';
import ToastProvider from '@/components/ToastProvider/ToastProvider';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Hack Lote',
  description: 'Sua loja gamer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className={poppins.className}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-backgroundLight text-textDark antialiased">
        <AuthProvider>
          {/* O `flex min-h-screen` aqui ainda garante que o layout ocupa toda a altura */}
          <div className="flex flex-col min-h-screen"> {/* Mudei para flex-col */}
            <Header /> {/* O Header está fixo no topo, não precisa estar dentro do flex para empurrar o conteúdo */}
            
            {/* O main agora precisa de padding-top para o header fixo, e removemos o padding-left da sidebar */}
            <main className="flex-grow pt-[80px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
              {children}
            </main>
            
            <Footer />
            <ToastProvider />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}