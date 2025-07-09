import Link from 'next/link';
import Image from 'next/image';

type Product = {
  id: string | number;
  name: string;
  image: string;
  price: number;
};

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="bg-[#1c1f2e] text-white rounded-xl shadow-lg p-5 max-w-sm mx-auto my-4 transition duration-300 hover:scale-105 hover:shadow-yellow-400/20 border border-yellow-400/10">
      <Image
        src={product.image}
        alt={product.name}
        width={400}
        height={160}
        className="w-full h-40 object-contain mb-4 rounded-md bg-black/20"
      />
      <h2 className="text-xl font-bold mb-1">{product.name}</h2>
      <p className="text-gray-300 text-sm mb-3">R$ {product.price.toFixed(2)}</p>
      <Link
        href={`/product/${product.id}`}
        className="inline-block text-yellow-400 hover:text-yellow-300 hover:underline text-sm"
      >
        Ver detalhes
      </Link>
    </div>
  );
};

export default ProductCard;
