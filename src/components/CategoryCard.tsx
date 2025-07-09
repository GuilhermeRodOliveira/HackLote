// src/components/CategoryCard.tsx

type CategoryCardProps = {
  title: string;
  items: string[];
};

export default function CategoryCard({ title, items }: CategoryCardProps) {
  return (
    <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-md text-white">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
