import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import SideBar from '@/components/SideBar/SideBar';
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
    <html lang="pt-br">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${poppins.className} bg-black antialiased flex`}>
        <AuthProvider>
          <SideBar />
          {/* ALTERADO: Removido 'p-4 sm:p-8' do main. Agora, as páginas individuais gerenciarão seu padding. */}
          <main className="flex-1 overflow-auto" style={{ paddingLeft: 'calc(85px + 24px)' }}>
            {children}
          </main>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
