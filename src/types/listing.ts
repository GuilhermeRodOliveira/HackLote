// src/types/listing.ts
// Este arquivo conterá a interface Listing que será usada em toda a aplicação.

// src/types/listing.ts

export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    subCategory?: string;
    // Tipo corrigido para corresponder à resposta da API
    imageUrls?: string[] | null; 
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
    game?: string;
    stock: number;
}