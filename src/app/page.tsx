'use client';

import CategoryCard from '@/components/CategoryCard/CategoryCard';

export default function Page() {
  const sections = [
    {
      title: '🛡️ Boosting',
      description: 'Suba de elo com segurança',
      items: [
        {
          title: 'Valorant',
          icon: '/img/valorant.png',
        },
        {
          title: 'League of Legends',
          icon: '/img/lol.png',
        },
        {
          title: 'GTA V',
          icon: '/img/gta.png',
        },
        {
          title: 'CS2',
          icon: '/img/cs2.png',
        },
        {
          title: 'Fortnite',
          icon: '/img/fortnite.png',
        },
        {
          title: 'Rainbow Six',
          icon: '/img/r6.png',
        },
      ],
    },
    {
      title: '🛒 Marketplace',
      items: [
        {
          title: 'Skins',
          icon: '/img/cs2.png',
        },
        {
          title: 'Contas de Jogo',
          icon: '/img/gta.png',
        },
        {
          title: 'Boosts',
          icon: '/img/valorant.png',
        },
        {
          title: 'Gift Cards',
          icon: '/img/fortnite.png',
        },
      ],
    },
  ];

  return (
    <main className="pt-24 px-6 pl-[85px] min-h-screen bg-[#0d0f1a]">
      <h1 className="text-3xl font-bold mb-6">
        Bem-vindo à <span className="text-orange-400">Hack Lote</span>!
      </h1>

      <section className="flex flex-wrap justify-center gap-6">
        {sections.map((section, index) => (
          <CategoryCard key={index} title={section.title} items={section.items} />
        ))}
      </section>

      {/* Últimas Atualizações */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-purple-400">📢 Últimas Atualizações</h2>
        <div className="bg-#dbd4d4e3 p-6 rounded-xl shadow-lg">
          <p className="text-gray-300">
            Nada novo por enquanto... mas grandes coisas estão chegando! 🚀
          </p>
        </div>
      </section>
    </main>
  );
}
