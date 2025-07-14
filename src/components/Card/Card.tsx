// src/components/Card/Card.tsx
import Image from 'next/image';

type CardProps = {
  title: string;
  description: string;
  icon?: string; // opcional
};

export default function Card({ title, icon }: CardProps) {
  return (
    <div className="group bg-[#161a35] border border-purple-500 rounded-2xl p-4 shadow-md hover:shadow-purple-500 transition-all duration-300 flex items-center gap-4">
      {icon && (
        <Image
          src={icon}
          alt={title}
          width={40}
          height={40}
          className="rounded-lg object-contain"
        />
      )}
      <div>
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
    </div>
  );
}
