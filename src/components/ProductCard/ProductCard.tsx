import Link from 'next/link';
import Image from 'next/image';

// Interface Product atualizada para corresponder à 'Listing' e incluir 'sellerName'
type Product = {
  id: string; // O 'number' não é necessário se os IDs são strings (UUIDs/CUIDs)
  title: string; // ALTERADO: de 'name' para 'title'
  imageUrl: string; // ALTERADO: de 'image' para 'imageUrl'
  price: number;
  sellerName: string; // NOVO: Adicionado sellerName
};

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    // Certifique-se de que estas classes Tailwind estão visíveis e corretas para você
    <div className="bg-[#1c1f2e] border border-purple-500 rounded-2xl p-6 shadow-[0_0_12px_#a855f7] max-w-[480px] w-full mx-auto">
      <Image
        src={product.imageUrl} // USANDO: product.imageUrl
        alt={product.title}    // USANDO: product.title para o alt text
        width={400}            // Defina uma largura intrínseca
        height={160}           // Defina uma altura intrínseca
        className="w-full h-40 object-cover mb-4 rounded-md bg-black/20" // object-cover para preencher o espaço
      />
      {/* Exibindo o nome do vendedor */}
      <p className="text-gray-400 text-xs mb-1">{product.sellerName}</p> 
      <h2 className="text-xl font-bold mb-1">{product.title}</h2> {/* USANDO: product.title */}
      <p className="text-gray-300 text-lg font-semibold mb-3">R$ {product.price.toFixed(2)}</p> {/* Aumentado font-size */}
      <Link
        href={`/listing/${product.id}`} // ALTERADO: para /listing/[id] conforme sua API Route
        className="inline-block text-yellow-400 hover:text-yellow-300 hover:underline text-sm"
      >
        Ver detalhes
      </Link>
    </div>
  );
};

export default ProductCard;