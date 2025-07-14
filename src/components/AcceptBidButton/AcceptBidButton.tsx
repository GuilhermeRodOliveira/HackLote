'use client';

import { useState } from 'react';

type Props = {
  bidId: string;
  requestId: string;
};

export default function AcceptBidButton({ bidId, requestId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/boostbid/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, requestId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Lance aceito com sucesso!');
        setSuccess(true);
        window.location.reload();
      } else {
        alert(data.error || 'Erro ao aceitar lance.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) return null;

  return (
    <button
      className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
      onClick={handleAccept}
      disabled={isLoading}
    >
      {isLoading ? 'Aceitando...' : 'Aceitar Lance'}
    </button>
  );
}
