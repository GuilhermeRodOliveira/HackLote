import Card from '@/components/Card/Card';

type CategoryCardProps = {
  title: string;
  items: { title: string; icon?: string }[];
};

export default function CategoryCard({ title, items }: CategoryCardProps) {
  return (
    <div className="bg-[#1c1f2e] border border-purple-500 rounded-2xl p-6 shadow-[0_0_12px_#a855f7] max-w-md w-full">
      <h2 className="text-xl text-white font-bold mb-4 text-center">{title}</h2>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <Card
            key={index}
            title={item.title}
            icon={item.icon} description={''}          />
        ))}
      </div>
    </div>
  );
}
