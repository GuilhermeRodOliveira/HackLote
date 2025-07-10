// src/app/layout.tsx
// MANTENHA ESTE ARQUIVO COMO ESTÁ

import "./globals.css"; // <<-- ESTA LINHA AGORA ESTÁ CORRETA para src/app/globals.css

import Header from "../components/Header"; // Este é o Header COMPLETO, que agora inclui o NavBar

export const metadata = {
  title: 'Hack Lote',
  description: 'Sua loja gamer',
  icons: {
    icon: '/logo-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header /> {/* O Header (com o NavBar dentro) é renderizado aqui */}
        <main>{children}</main> 
      </body>
    </html>
  );
}