// src/components/ListingCard/ListingCard.tsx
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subCategory: string; // Manter para tipagem, mesmo se não for exibido
  imageUrl?: string | null;
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
}

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
    const router = useRouter(); // router não será usado diretamente aqui para navegação do Link, mas pode ser útil para outras ações
    const formatAttributeKey = (key: string) => {
        return key.replace(/([A-Z])/g, ' $1').trim();
    };

    return (
        <Link href={`/listing/${listing.id}`} className="block"> {/* Adicionando o Link que envolve todo o card */}
            <div className="content-box overflow-hidden flex flex-col transform hover:scale-105 transition duration-300 ease-in-out">
                {listing.imageUrl ? (
                    <div className="relative w-full h-48 bg-backgroundSecondary flex items-center justify-center">
                        <Image
                            src={listing.imageUrl}
                            alt={listing.title}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-t-lg"
                            onError={(e) => {
                                e.currentTarget.src = `https://placehold.co/400x200/${
                                    document.body.classList.contains('light-theme') ? 'E5E7EB' : '2C3E50'
                                }/${
                                    document.body.classList.contains('light-theme') ? '111827' : 'F5F5DC'
                                }?text=Sem+Imagem`;
                            }}
                        />
                    </div>
                ) : (
                    <div className="w-full h-48 bg-backgroundSecondary flex items-center justify-center text-textSecondary rounded-t-lg">
                        Sem Imagem
                    </div>
                )}
                <div className="p-4 flex flex-col flex-grow">
                    {/* 1. Título do Produto */}
                    <h2 className="text-lg font-semibold mb-1 line-clamp-2 text-accent1">{listing.title}</h2>

                    {/* 2. Preço - VERDE ESPECÍFICO */}
                    <div className="flex justify-between items-center text-xl font-bold mb-2 text-[#10B981]">
                        <span>R$ {listing.price.toFixed(2)}</span>
                    </div>

                    {/* 3. Vendedor */}
                    <div className="text-textSecondary text-sm mb-1">
                        Vendedor: <span className="font-medium text-accent1">{listing.seller.usuario || listing.seller.email}</span>
                    </div>

                    {/* 4. Categoria / Subcategoria / Jogo */}
                    <p className="text-textSecondary text-xs mb-1">
                        {listing.category} / {listing.subCategory}
                        {listing.game && ` (${listing.game})`}
                    </p>

                    {/* 5. Descrição */}
                    <p className="text-textPrimary text-sm mb-2 line-clamp-2">{listing.description}</p>

                    {/* 6. Atributos */}
                    {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                        <div className="mt-1 text-xs text-textSecondary">
                            <p className="font-semibold mb-0.5">Atributos:</p>
                            <ul className="list-disc list-inside">
                                {Object.entries(listing.attributes).map(([key, value]) => (
                                    <li key={key}><span className="font-medium capitalize">{formatAttributeKey(key)}:</span> {String(value)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* REMOVIDO: Botão "Ver Detalhes" */}
                </div>
            </div>
        </Link>
    );
}