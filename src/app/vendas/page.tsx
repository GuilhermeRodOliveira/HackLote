'use client';

// Defina a interface para um item de venda
interface Venda {
  id: number; // Ou string, dependendo do seu backend
  item: string;
  descricao: string;
  data: string;
  preco: number;
}

export default function VendasPage() {
  // Em um aplicativo real, você buscaria os dados de vendas de uma API
  // Por enquanto, vamos simular que não há vendas para um novo usuário.
  const vendas: Venda[] = []; // Array vazio, mas agora com tipo explícito

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">💰 Minhas Vendas</h1>

      <section className="space-y-4">
        {vendas.length === 0 ? (
          // Aplicando content-box à mensagem de "nenhuma venda"
          <div className="content-box text-center text-gray-400 text-lg py-8">
            Você ainda não realizou nenhuma venda.
          </div>
        ) : (
          // Se houvesse vendas, cada item individual receberia a classe content-box
          vendas.map((venda) => (
            <div key={venda.id} className="content-box">
              <h3 className="text-lg font-semibold text-purple-400">{venda.item}</h3>
              <p className="text-gray-300">Item: {venda.descricao}</p>
              <p className="text-gray-400 text-sm">Data: {venda.data}</p>
              <p className="text-green-400 font-semibold">R$ {venda.preco.toFixed(2)}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
