// src/types/listing.ts
// Este arquivo conterá a interface Listing que será usada em toda a aplicação.

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  imageUrl?: string | null; // Pode ser null ou undefined
  attributes?: Record<string, any> | null;
  sellerId: string;
  seller: {
    id: string;
    usuario?: string;
    email: string;
    nome?: string;
  };
  createdAt: string;
  updatedAt: string;
  game?: string; // Pode ser undefined
}