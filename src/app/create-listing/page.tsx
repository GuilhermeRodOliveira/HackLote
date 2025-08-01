// src/app/create-listing/page.tsx
'use client';

import React from 'react';
import ListingForm from '@/components/ListingForm/ListingForm'; // Importe o componente de formulário

// Este é um wrapper simples para a página de criação de listagem.
// Todo o formulário e sua lógica estão no ListingForm.tsx
export default function CreateListingPageWrapper() {
  return (
    // min-h-screen para a altura total, padding, e as cores do tema
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-backgroundPrimary text-textPrimary">
      {/* O formulário agora é renderizado pelo componente ListingForm */}
      <ListingForm /> 
    </div>
  );
}