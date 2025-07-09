export const metadata = {
  title: 'Hack Lote',
  description: 'Sua loja gamer',
  icons: {
    icon: '/logo-icon.png', // ou '/favicon.ico' se preferir .ico
  },
};

import "./styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
