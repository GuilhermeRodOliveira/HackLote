// src/app/vendas/page.tsx
export default function VendasPage() {
  return (
    <main className="pt-24 pl-[85px] text-white min-h-screen bg-[#0d0f1a] px-6">
      <h1 className="text-3xl font-bold mb-6">💰 Minhas Vendas</h1>

      <section className="space-y-4">
        <div className="bg-[#161a35] border border-purple-500 rounded-xl p-4 shadow">
          <h3 className="text-lg font-semibold text-purple-400">Venda nº 001</h3>
          <p className="text-gray-300">Item: Conta de LoL com Skins Raras</p>
          <p className="text-gray-400 text-sm">Data: 12/07/2025</p>
          <p className="text-green-400 font-semibold">R$ 99,90</p>
        </div>

        <div className="bg-[#161a35] border border-purple-500 rounded-xl p-4 shadow">
          <h3 className="text-lg font-semibold text-purple-400">Venda nº 002</h3>
          <p className="text-gray-300">Item: Skin Karambit Fade - CS2</p>
          <p className="text-gray-400 text-sm">Data: 10/07/2025</p>
          <p className="text-green-400 font-semibold">R$ 1.200,00</p>
        </div>
      </section>
    </main>
  );
}
