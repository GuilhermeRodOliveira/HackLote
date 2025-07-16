'use client';

import { useEffect, useState, useContext } from 'react'; // Importar useContext
import { toast } from 'react-toastify'; // Importar toast
import { AuthContext } from '@/context/AuthContext'; // Importar AuthContext
import GameSelect from './GameSelect'; // Manter GameSelect por enquanto
import RankSelect from './RankSelect';

export default function BoostForm() {
  // Obter user e loading do AuthContext
  const { user, loading: authLoading } = useContext(AuthContext);

  const [game, setGame] = useState('');
  const [currentRank, setCurrentRank] = useState('');
  const [desiredRank, setDesiredRank] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removido userId do estado local, pois virá do AuthContext
  // const [userId, setUserId] = useState<string | null>(null);

  // Removido useEffect para carregar userId do localStorage, pois virá do AuthContext
  /*
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) setUserId(parsed.id);
    }
  }, []);
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Usar user?.id do AuthContext
    if (!user?.id || !game || !currentRank || !desiredRank) {
      toast.error('Preencha todos os campos obrigatórios.'); // Usar toast
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/boostrequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // userId não é mais enviado no body, pois o backend o extrai do token JWT
        body: JSON.stringify({ game, currentRank, desiredRank, description }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Pedido de boost criado com sucesso!'); // Usar toast
        setGame('');
        setCurrentRank('');
        setDesiredRank('');
        setDescription('');
      } else {
        toast.error(data.error || 'Erro ao criar pedido.'); // Usar toast
      }
    } catch (err) {
      toast.error('Erro de rede. Tente novamente.'); // Usar toast
      console.error('Erro ao enviar pedido de boost:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirecionar se não estiver autenticado e não estiver carregando
  if (!authLoading && !user) {
    // Você pode adicionar um redirecionamento aqui se quiser forçar o login
    // router.push('/login');
    return <p className="text-white text-center">Você precisa estar logado para criar um pedido de boost.</p>;
  }

  if (authLoading) {
    return <p className="text-white text-center">Carregando informações do usuário...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="boost-form">
      <h2 className="text-xl font-bold mb-4 text-white">Criar Pedido de Boost</h2>

      <GameSelect value={game} onChange={(e) => setGame(e.target.value)} />

      <RankSelect
        label="Rank atual"
        value={currentRank}
        onChange={(e) => setCurrentRank(e.target.value)}
      />

      <RankSelect
        label="Rank desejado"
        value={desiredRank}
        onChange={(e) => setDesiredRank(e.target.value)}
      />

      <textarea
        className="input"
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Publicar Pedido'}
      </button>
    </form>
  );
}
