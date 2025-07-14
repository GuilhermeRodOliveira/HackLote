'use client';

export default function ComprasPage() {
  const compras = [
    {
      id: 1,
      item: 'Skin AK-47 Neon Rider',
      jogo: 'CS2',
      data: '10/07/2025',
      preco: 129.90,
    },
    {
      id: 2,
      item: 'Conta nível 30 com Elo Ouro',
      jogo: 'League of Legends',
      data: '08/07/2025',
      preco: 89.99,
    },
    {
      id: 3,
      item: 'Gift Card Steam R$50',
      jogo: 'Steam',
      data: '05/07/2025',
      preco: 50.00,
    },
  ];

  return (
    <main className="pt-24 pl-[85px] pr-6 min-h-screen bg-[#0d0f25] text-white">
      <h1 className="text-3xl font-bold mb-6">🛒 Minhas Compras</h1>
      
      <section className="bg-[#161a35] rounded-xl shadow-lg p-6">
        {compras.length === 0 ? (
          <p className="text-gray-400">Você ainda não realizou nenhuma compra.</p>
        ) : (
          <ul className="space-y-4">
            {compras.map((compra) => (
              <li key={compra.id} className="bg-[#1c1f2e] p-4 rounded-lg border border-purple-500/40 hover:shadow-purple-500/30 transition">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-400">{compra.item}</h3>
                    <p className="text-sm text-gray-300">{compra.jogo} • {compra.data}</p>
                  </div>
                  <span className="text-yellow-400 font-bold">R$ {compra.preco.toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
