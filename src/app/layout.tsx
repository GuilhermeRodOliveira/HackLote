// src/app/layout.tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
import Footer from '../components/Footer/Footer';
// REMOVIDO: ToastProvider (usaremos o Toaster diretamente do react-hot-toast)
import { Toaster } from 'react-hot-toast'; // Importar o Toaster do react-hot-toast

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
      {/* Adicionado suppressHydrationWarning para resolver o aviso de hidratação */}
      <body className="antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          {/* O `flex min-h-screen` aqui ainda garante que o layout ocupa toda a altura */}
          <div className="flex flex-col min-h-screen">
            <Header />
            
            {/* O main agora precisa de padding-top para o header fixo, e removemos o padding-left da sidebar */}
            {/* Certifique-se de que o conteúdo dentro de 'children' também tenha um background escuro, se necessário */}
            <main className="flex-grow pt-[80px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
              {children}
            </main>
            
            <Footer />
            {/* Adicionado o Toaster diretamente aqui */}
            <Toaster position="top-right" reverseOrder={false} />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
