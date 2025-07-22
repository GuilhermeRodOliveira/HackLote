// src/components/CategoryCard/CategoryCard.tsx
import Image from 'next/image'; // Certifique-se de que Image está importado

interface CategoryCardProps {
  title: string;
  items: { title: string; icon: string }[];
}

export default function CategoryCard({ title, items }: CategoryCardProps) {
  return (
    // Card Container: Adicione 'group' aqui para facilitar o hover em elementos filhos
    <div className="
      bg-white rounded-lg shadow-md p-6 w-full sm:w-64 border border-textMuted
      hover:shadow-lg transition-shadow duration-200
    ">
      <h3 className="text-xl font-bold mb-4 text-textDark">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, index) => (
          // Item Individual: AQUI faremos a mudança para o hover
          <div
            key={index}
            className="
              flex flex-col items-center p-2 rounded-md cursor-pointer
              transition-colors duration-200
              // NOVA CLASSE: No hover, use uma cor mais escura
              // `bg-gray-100` é uma boa opção do Tailwind para um hover sutil
              // Ou você pode usar `bg-textMuted` com `bg-opacity-20` para um cinza translúcido
              // Se você quiser BEM ESCURO, use `bg-gray-800` com `text-white`
              hover:bg-gray-100   
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
            <span className="text-sm font-medium text-textDark text-center">{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}