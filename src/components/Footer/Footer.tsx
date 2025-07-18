// src/components/Footer.tsx
'use client'; 

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const footerLinks = [
    {
      title: 'Ajuda',
      links: [
        { name: 'Central de Ajuda', href: '/help' },
        { name: 'Contato', href: '/contact' },
        { name: 'Bug Bounty', href: '/bug-bounty' },
        { name: 'Blog', href: '/blog' },
        { name: 'Seja um Parceiro', href: '/become-partner' },
      ],
    },
    {
      title: 'Garantia e Segurança',
      links: [
        { name: 'Garantia da Conta', href: '/account-warranty' },
        { name: 'TradeShield (Compra)', href: '/tradesheild-buying' },
        { name: 'TradeShield (Venda)', href: '/tradesheild-selling' },
        { name: 'Depósitos', href: '/deposits' },
        { name: 'Saques', href: '/withdrawals' },
      ],
    },
    {
      title: 'Regras e Termos',
      links: [
        { name: 'Regras de Vendedor', href: '/seller-rules' },
        { name: 'Regras Gerais', href: '/general-rules' },
        { name: 'Alterar Usuário', href: '/change-username' },
        { name: 'Taxas', 'href': '/fees' },
        { name: 'Política de Reembolso', href: '/refund-policy' },
      ],
    },
  ];

  const paymentMethods = [
    { src: 'https://assetsdelivery.eldorado.gg/v7/_assets_/payments/v11/icons/Visa-Dark.svg?w=42', alt: 'Visa' },
    { src: 'https://assetsdelivery.eldorado.gg/v7/_assets_/payments/v11/icons/Mastercard-Dark.svg?w=42', alt: 'Mastercard' },
    { src: 'https://assetsdelivery.eldorado.gg/v7/_assets_/payments/v11/icons/Amex-Dark.svg?w=42', alt: 'Amex' },
    { src: 'https://assetsdelivery.eldorado.gg/v7/_assets_/payments/v11/icons/GooglePay-Dark.svg?w=42', alt: 'Google Pay' },
  ];

  return (
    <footer className="bg-gray-900 text-white mt-12 p-8 border-t border-gray-700 shadow-lg rounded-t-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start gap-8">

        {/* Coluna da Esquerda: Logo e Slogan */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left mb-6 md:mb-0 md:w-1/4 lg:w-1/5">
          <Link href="/" className="block mb-4">
            <Image
              src="/img/logo.png"
              alt="Hack Lote Logo"
              width={75}
              height={75}
              className="rounded-md"
            />
          </Link>
          <p className="text-sm text-gray-400 max-w-xs md:max-w-full">
            Junte-se a nós hoje para elevar sua experiência de jogo!
          </p>
        </div>

        {/* Colunas de Links - Ajustado para melhor responsividade e espaçamento */}
        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 md:gap-x-12 lg:gap-x-16">
          {footerLinks.map((column, colIndex) => (
            <div key={colIndex} className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400 whitespace-nowrap">
                {column.title}
              </h3>
              <ul>
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="mb-2">
                    <Link href={link.href} className="text-gray-400 hover:text-white transition text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Meios de Pagamento */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right md:w-1/4 lg:w-1/5">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">Métodos de Pagamento</h3>
          <div className="flex flex-wrap justify-center md:justify-end gap-3 max-w-xs md:max-w-full">
            {paymentMethods.map((method, index) => (
              // Ajuste para usar 'fill' e um container com tamanho fixo
              <div key={index} className="relative w-[42px] h-[25px] flex-shrink-0"> {/* Parent com tamanho fixo e position: relative */}
                <Image
                  src={method.src}
                  alt={method.alt}
                  fill // 'fill' faz a imagem preencher o pai
                  className="object-contain" // Mantém o aspecto dentro do container
                />
              </div>
            ))}
            <span className="text-gray-400 text-sm mt-2 block w-full text-right pr-1">
              +15 more
            </span>
          </div>
        </div>
      </div>

      {/* Seção de Copyright */}
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500 text-sm">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} Hack Lote. Todos os direitos reservados.
          <Link href="/terms" className="hover:text-white ml-2">Termos de Serviço</Link>
          <Link href="/privacy" className="hover:text-white ml-2">Política de Privacidade</Link>
          <Link href="/dmca" className="hover:text-white ml-2">DMCA</Link>
        </p>
      </div>
    </footer>
  );
}