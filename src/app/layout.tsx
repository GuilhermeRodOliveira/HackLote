// file: src/app/layout.tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext'; // Importe o SocketProvider
import Header from '@/components/Header/Header';
import Footer from '../components/Footer/Footer';
import { Toaster } from 'react-hot-toast';

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
      <body className="antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          <SocketProvider> {/* Envolva a aplicação com o SocketProvider */}
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow pt-[80px] w-full px-8 sm:px-12 lg:px-16">
                {children}
              </main>
              <Footer />
              <Toaster position="top-right" reverseOrder={false} />
            </div>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}