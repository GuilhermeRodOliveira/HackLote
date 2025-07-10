// src/app/page.tsx  <--- AGORA ESTE ARQUIVO ESTÁ CERTO

'use client'; // Mantenha isso se a sua página inicial tiver qualquer interatividade (useState, useEffect, etc.)

// REMOVIDOS:
// import Header from '../components/Header'; // O Header é importado e renderizado no src/app/layout.tsx
// import './globals.css'; // O CSS global é importado no src/app/layout.tsx

export default function HomePage() { // Renomeado de RootLayout para HomePage, pois é uma página, não um layout
  return (
    // Removidas as tags <html> e <body> porque elas já são definidas no src/app/layout.tsx
    // O children não é necessário aqui, pois esta é a página raiz que será o 'children' do layout.
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center text-white">
      {/* O Tailwind CSS e o fundo escuro do body virão do globals.css via layout.tsx */}
      {/* O padding-top para compensar o header fixo já está no globals.css e se aplicará a este <main> */}
      <h1 className="text-4xl font-bold mb-4">Bem-vindo à Página Principal!</h1>
      <p className="text-lg">Este é o conteúdo da sua rota de índice (`/`).</p>
      <p className="mt-4">O cabeçalho e os estilos globais são gerenciados pelo seu layout principal.</p>
    </div>
  );
}