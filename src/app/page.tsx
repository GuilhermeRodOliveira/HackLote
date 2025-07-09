// src/app/layout.tsx
'use client';

import Header from '../components/Header';
import './styles/globals.css'; // se precisar do CSS global

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
