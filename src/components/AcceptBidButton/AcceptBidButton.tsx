// src/components/AcceptBidButton/AcceptBidButton.tsx (REVISADO)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type Props = {
  bidId: string;
  requestId: string;
};

export default function AcceptBidButton({ bidId, requestId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/boost/accept-bid', { // Nova API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, requestId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Lance aceito com sucesso! O chat agora está ativo.');
        // Opcional: redirecionar para a página do chat aceito
        // Se a API retornar o ID do chat, você pode redirecionar para lá
        if (data.chatId) {
          router.push(`/chats?chatId=${data.chatId}`);
        } else {
          // Apenas recarrega a página se não tiver o ID do chat
          window.location.reload();
        }
      } else {
        toast.error(data.error || 'Erro ao aceitar lance.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de rede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:bg-gray-500"
      onClick={handleAccept}
      disabled={isLoading}
    >
      {isLoading ? 'Aceitando...' : 'Aceitar Lance'}
    </button>
  );
}