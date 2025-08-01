// src/components/Card/Card.tsx
import Image from 'next/image';

type CardProps = {
  title: string;
  description?: string; // Mantido como opcional, mesmo não usado visualmente aqui
  icon?: string; // opcional
};

export default function Card({ title, icon }: CardProps) {
  return (
    <div className="group rounded-2xl p-4 shadow-md transition-all duration-300 flex items-center gap-4
                bg-backgroundSecondary border border-accent2 hover:shadow-accent2"> {/* Usando variáveis */}
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
        <h3 className="font-semibold text-textPrimary">{title}</h3> {/* Usando text-textPrimary */}
      </div>
    </div>
  );
}