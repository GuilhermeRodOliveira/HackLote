// src/app/layout.tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/context/AuthContext'; 
import SideBar from '@/components/SideBar/SideBar';   
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
      <body className="bg-black antialiased">
        <AuthProvider>
          <div className="flex min-h-screen"> 
            <SideBar /> 
            <div className="flex flex-col flex-1 pl-[164px]"> {/* Mantido pl-[164px] para afastar da SideBar */}
              <Header /> 
              {/* NOVO: Adicionado max-w-7xl mx-auto e paddings horizontais ao main */}
              <main className="flex-grow pt-[80px] bg-[#0f0f1a] text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children} {/* O conteúdo das páginas agora será limitado e centralizado aqui */}
              </main>
              <Footer /> 
            </div>
            <ToastProvider /> 
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}