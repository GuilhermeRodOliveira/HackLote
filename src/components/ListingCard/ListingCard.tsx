// src/components/ProductCard/ProductCard.tsx (ATUALIZADO)
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Para o botão "Ver Detalhes"
import Link from 'next/link'; // Se o título ou imagem forem links

// Importar a interface Listing de um local centralizado (recomendado)
// import { Listing } from '@/types/listing';
// Ou, se não tiver centralizado ainda, copie a interface Listing para cá:
interface Listing {
  id: string;
  title: string;
  description: string; // Adicionado para reorganização
  price: number;
  category: string; // Adicionado para reorganização
  subCategory: string; // Adicionado para reorganização
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
  game?: string; // Adicionado para reorganização
}

interface ProductCardProps {
  listing: Listing; // Mudei de 'product' para 'listing' para ser mais claro
}

export default function ProductCard({ listing }: ProductCardProps) {
    const router = useRouter(); // Se você quer o botão Ver Detalhes
    const formatAttributeKey = (key: string) => {
        return key.replace(/([A-Z])/g, ' $1').trim();
    };

    return (
        <div className="content-box overflow-hidden flex flex-col transform hover:scale-105 transition duration-300 ease-in-out">
            {listing.imageUrl ? (
                <div className="relative w-full h-48 bg-gray-700 flex items-center justify-center">
                    <Image
                        src={listing.imageUrl}
                        alt={listing.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                        onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/400x200/4B5563/FFFFFF?text=Sem+Imagem';
                        }}
                    />
                </div>
            ) : (
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400 rounded-t-lg">
                    Sem Imagem
                </div>
            )}
            <div className="p-5 flex flex-col flex-grow">
                {/* Reorganização das informações */}
                {/* 1. Título do Produto */}
                <h2 className="text-xl font-semibold text-blue-400 mb-2 line-clamp-2">{listing.title}</h2>

                {/* 2. Preço */}
                <div className="flex justify-between items-center text-lg font-bold text-green-400 mb-2">
                    <span>R$ {listing.price.toFixed(2)}</span>
                </div>

                {/* 3. Vendedor */}
                <div className="text-gray-400 text-sm mb-2">
                    Vendedor: <span className="font-medium text-blue-300">{listing.seller.usuario || listing.seller.email}</span>
                </div>

                {/* 4. Categoria / Subcategoria / Jogo */}
                <p className="text-gray-400 text-xs mb-3">
                    {listing.category} / {listing.subCategory}
                    {listing.game && ` (${listing.game})`}
                </p>

                {/* 5. Descrição (opcional, pode deixar aqui ou mover) */}
                <p className="text-gray-300 text-sm mb-3 line-clamp-3">{listing.description}</p>

                {/* 6. Atributos (se existirem) */}
                {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                        <p className="font-semibold mb-1">Atributos:</p>
                        <ul className="list-disc list-inside">
                            {Object.entries(listing.attributes).map(([key, value]) => (
                                <li key={key}><span className="font-medium capitalize">{formatAttributeKey(key)}:</span> {String(value)}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Botão de Ver Detalhes */}
                <button
                    onClick={() => router.push(`/listing/${listing.id}`)}
                    className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
                >
                    Ver Detalhes
                </button>
            </div>
        </div>
    );
}