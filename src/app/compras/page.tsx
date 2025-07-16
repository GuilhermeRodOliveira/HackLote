'use client';

// Defina a interface para um item de compra
interface Compra {
  id: number; // Ou string, dependendo do seu backend
  item: string;
  jogo: string;
  data: string;
  preco: number;
}

export default function ComprasPage() {
  // Em um aplicativo real, você buscaria os dados de compras de uma API
  // Por enquanto, vamos simular que não há compras para um novo usuário.
  const compras: Compra[] = []; // Array vazio, mas agora com tipo explícito

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">🛒 Minhas Compras</h1>
      
      <section>
        {compras.length === 0 ? (
          // Aplicando content-box à mensagem de "nenhuma compra"
          <div className="content-box text-center text-gray-400 text-lg py-8">
            Você ainda não realizou nenhuma compra.
          </div>
        ) : (
          <ul className="space-y-4">
            {compras.map((compra) => (
              // Aplicando content-box a cada item da lista de compras
              <li key={compra.id} className="content-box">
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
    </div>
  );
}
