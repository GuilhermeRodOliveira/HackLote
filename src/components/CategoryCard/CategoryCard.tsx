// src/components/CategoryCard/CategoryCard.tsx
import Image from 'next/image';

interface CategoryCardProps {
  title: string;
  items: { title: string; icon: string }[];
}

export default function CategoryCard({ title, items }: CategoryCardProps) {
  return (
    // Card Container: Adaptação para usar cores do tema
    <div className="
      rounded-lg shadow-md p-6 w-full sm:w-64 transition-shadow duration-200
      bg-backgroundSecondary border border-borderColor hover:shadow-lg
    ">
      <h3 className="text-xl font-bold mb-4 text-textPrimary">{title}</h3> {/* Usando text-textPrimary */}
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, index) => (
          // Item Individual: Adaptação para hover e texto
          <div
            key={index}
            className="
              flex flex-col items-center p-2 rounded-md cursor-pointer
              transition-colors duration-200
              hover:bg-backgroundPrimary text-textPrimary {/* Hover muda para a cor do background principal do tema */}
            "
          >
            {item.icon && (
              <Image
                src={item.icon}
                alt={item.title}
                width={40}
                height={40}
                className="mb-2 object-contain"
              />
            )}
            <span className="text-sm font-medium text-textPrimary text-center">{item.title}</span> {/* Usando text-textPrimary */}
          </div>
        ))}
      </div>
    </div>
  );
}