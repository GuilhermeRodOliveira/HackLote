// src/components/Header/Header.tsx (ou src/components/Header.tsx)
'use client'; // Necessário para componentes interativos no lado do cliente

import { Search, Bell, MessageSquare, Repeat } from 'lucide-react'; // Importa ícones da biblioteca lucide-react
import Image from 'next/image'; // Componente de imagem otimizado do Next.js
import Link from 'next/link'; // Componente de link otimizado do Next.js

export default function Header() {
  return (
    // O cabeçalho é fixo no topo, ocupa 100% da largura (w-full), tem z-index alto para ficar por cima,
    // fundo escuro (#0f0f1a), texto branco e uma sombra sutil.
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0f0f1a] text-white shadow-lg">
      {/* Container interno para alinhar e espaçar o conteúdo do cabeçalho.
        max-w-7xl mx-auto: Limita a largura do conteúdo a 7xl e o centraliza.
        px-4 sm:px-6 lg:px-8: Adiciona padding horizontal responsivo.
        h-[80px]: Define uma altura fixa para o cabeçalho.
        flex items-center justify-between: Usa flexbox para alinhar itens no centro verticalmente e distribuí-los horizontalmente.
      */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[80px]"> 
        
        {/* Lado Esquerdo: Logo do Site */}
        {/* flex-shrink-0: Impede que o logo encolha em telas menores. */}
        <div className="flex-shrink-0">
          {/* Link para a página inicial ao clicar no logo */}
          <Link href="/" className="block">
            <Image
              src="/img/logo.png" // Caminho da imagem do logo (deve estar em public/img/)
              alt="Hack Lote Logo" // Texto alternativo para acessibilidade
              width={75} // Largura da imagem
              height={75} // Altura da imagem
              className="rounded-md cursor-pointer" // Estilos Tailwind: cantos arredondados e cursor de ponteiro
            />
          </Link>
        </div>

        {/* Centro: Área para futura barra de pesquisa ou espaço vazio */}
        {/* flex-grow: Permite que esta div ocupe o espaço disponível entre o lado esquerdo e direito. */}
        {/* flex justify-center: Centraliza o conteúdo dentro desta div. */}
        <div className="flex-grow flex justify-center">
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="w-full max-w-md p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
        </div>

        {/* Lado Direito: Ícones de Ações Rápidas */}
        {/* flex-shrink-0: Impede que esta div encolha. */}
        {/* gap-6: Adiciona espaçamento entre os ícones. */}
        <div className="flex items-center gap-6 text-white flex-shrink-0"> 
          {/* Ícone de pesquisa global (opcional) */}
          {/* size={24}: Define o tamanho do ícone. 
              hover:text-gray-300: Muda a cor ao passar o mouse.
              cursor-pointer: Muda o cursor para indicar que é clicável. */}
          <Search size={24} className="hover:text-gray-300 cursor-pointer" /> 
          
          {/* Ícone de "Repeat" ou alguma ação relacionada (ex: trocas, status) */}
          <Repeat size={24} className="hover:text-gray-300 cursor-pointer" /> 
          
          {/* Ícone de Mensagens */}
          <MessageSquare size={24} className="hover:text-gray-300 cursor-pointer" />
          
          {/* Ícone de Notificações com contador (sininho) */}
          <div className="relative"> {/* relative: Para posicionar o span do contador absolutamente. */}
            <Bell size={24} className="hover:text-gray-300 cursor-pointer" />
            {/* Contador de Notificações: 
                absolute: Posicionamento absoluto em relação ao pai (div relative).
                -top-1.5 -right-1.5: Ajusta a posição (canto superior direito do sininho).
                bg-yellow-400 text-black: Fundo amarelo e texto preto para contraste.
                text-[10px] px-1.5 py-[1px] rounded-full: Estilo pequeno e arredondado. */}
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[10px] px-1.5 py-[1px] rounded-full" />
          </div>
          
          {/* Avatar do Usuário */}
          {/* w-9 h-9: Largura e altura fixas. 
              rounded-full: Completamente redondo. 
              border-2 border-yellow-300: Borda amarela.
              overflow-hidden: Esconde o que transborda (útil se a imagem for maior). */}
          <div className="w-9 h-9 rounded-full border-2 border-yellow-300 overflow-hidden">
            <Image
              src="/img/avatar.png" // Caminho para a imagem do avatar padrão (deve estar em public/img/)
              alt="Avatar" // Texto alternativo
              width={36} // Largura da imagem dentro do container
              height={36} // Altura da imagem dentro do container
              className="object-cover w-full h-full bg-white" // Cobre o container mantendo o aspecto, fundo branco (fallback)
            />
          </div>
        </div>
      </div>
    </header>
  );
}