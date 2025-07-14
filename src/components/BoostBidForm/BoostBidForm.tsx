'use client';

import { useState } from 'react';
import styles from './BoostBidForm.module.css';

type BoostBidFormProps = {
  boostRequestId: string;
  boosterId: string; // Provavelmente vem do usuário logado
};

export default function BoostBidForm({ boostRequestId, boosterId }: BoostBidFormProps) {
  const [amount, setAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !estimatedTime) {
      alert('Preço e prazo são obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/boostbid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boosterId,
          boostRequestId,
          amount: parseFloat(amount),
          estimatedTime,
          comment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Lance enviado com sucesso!');
        setAmount('');
        setEstimatedTime('');
        setComment('');
      } else {
        alert(data.error || 'Erro ao enviar lance.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.boostForm}>
      <h3 className="text-white text-lg font-bold mb-3">Enviar Lance</h3>

      <input
        className={styles.input}
        type="number"
        placeholder="Preço (R$)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <input
        className={styles.input}
        type="text"
        placeholder="Prazo estimado (ex: 2 dias)"
        value={estimatedTime}
        onChange={(e) => setEstimatedTime(e.target.value)}
        required
      />

      <textarea
        className={styles.input}
        placeholder="Comentário (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar Lance'}
      </button>
    </form>
  );
}
