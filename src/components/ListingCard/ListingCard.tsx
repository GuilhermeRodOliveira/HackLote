// src/components/ListingCard/ListingCard.tsx
import Image from 'next/image';
import Link from 'next/link';
interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string;
  imageUrls: string[] | null;
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

    const formatAttributeKey = (key: string) => {
        return key.replace(/([A-Z])/g, ' $1').trim();
    };

    const mainImageUrl = listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : null;

    return (
        <Link href={`/listing/${listing.id}`} className="block">
            <div className="content-box overflow-hidden flex flex-col transform hover:scale-105 transition duration-300 ease-in-out">
                {mainImageUrl ? (
                    <div className="relative w-full h-48 bg-backgroundSecondary flex items-center justify-center">
                        <Image
                            src={mainImageUrl}
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
                    <h2 className="text-lg font-semibold mb-1 line-clamp-2 text-accent1">{listing.title}</h2>
                    <div className="flex justify-between items-center text-xl font-bold mb-2 text-[#10B981]">
                        <span>R$ {listing.price.toFixed(2)}</span>
                    </div>
                    <div className="text-textSecondary text-sm mb-1">
                        Vendedor: <span className="font-medium text-accent1">{listing.seller.usuario || listing.seller.email}</span>
                    </div>
                    <p className="text-textSecondary text-xs mb-1">
                        {listing.category} / {listing.subCategory}
                        {listing.game && ` (${listing.game})`}
                    </p>
                    <p className="text-textPrimary text-sm mb-2 line-clamp-2">{listing.description}</p>
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
                </div>
            </div>
        </Link>
    );
}