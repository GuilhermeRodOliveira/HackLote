// src/app/boosting/matches/[id]/page.tsx
'use client';

import { useEffect, useState, useContext, useRef } from 'react'; // Adicionado useRef para scroll do chat
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { AuthContext } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image'; // Para exibir avatares no chat

// Definir interfaces completas para os dados esperados da API
interface UserInfo {
  id: string;
  usuario?: string;
  nome?: string;
  email: string;
  profilePictureUrl?: string;
}

interface BoostBid {
  id: string;
  amount: number;
  estimatedTime: string;
  booster: UserInfo;
}

interface BoostRequest {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  description?: string;
  createdAt: string;
  user: UserInfo; // O usuário que fez o pedido (criador)
  bids: BoostBid[];
  acceptedBidId?: string | null; // Para saber se já foi aceito
}

// Interfaces para o Chat
interface ChatMessage {
  id: string;
  sender: UserInfo; // Quem enviou a mensagem
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  boostRequestId: string;
  participant1: UserInfo; // Criador do pedido
  participant2: UserInfo; // Booster aceito
  status: 'OPEN' | 'CLOSED_ACCEPTED' | 'CLOSED_CANCELED';
  messages: ChatMessage[];
}


export default function BoostRequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);

  const [request, setRequest] = useState<BoostRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bidPrice, setBidPrice] = useState('');
  const [bidEstimatedTime, setBidEstimatedTime] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isAcceptingBid, setIsAcceptingBid] = useState(false);
  const [currentUserBid, setCurrentUserBid] = useState<BoostBid | null>(null);
  const [isEditingBid, setIsEditingBid] = useState(false); 
  const [isDeletingBid, setIsDeletingBid] = useState(false);

  // Estados do Chat
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref para scrollar o chat

  const estimatedTimeOptions = [
    '30 minutos', '1 hora', '3 horas', '6 horas', '12 horas',
    '1 dia', '3 dias', '7 dias', '14 dias',
  ];

  // Efeito para buscar os dados do pedido de boost e o lance do usuário logado
  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError('ID do pedido de boost não fornecido.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null); // Limpa erros anteriores

      try {
        const res = await fetch(`/api/boostrequest/${id}`); // Chama sua API de detalhes de boost
        if (res.ok) {
          const data = await res.json();
          const fetchedRequest: BoostRequest = data.boostRequest; // Tipagem da resposta da API
          setRequest(fetchedRequest);
          
          // >>>>> LINHA ADICIONADA AQUI <<<<<
          console.log('Dados do Pedido de Boost (fetchedRequest):', fetchedRequest); 
          // >>>>> FIM DA LINHA ADICIONADA <<<<<

          // Verifica se o usuário logado já fez um lance para este pedido
          if (currentUser && fetchedRequest && fetchedRequest.bids) {
            const foundBid = fetchedRequest.bids.find(
              (bid: BoostBid) => bid.booster.id === currentUser.id
            );
            setCurrentUserBid(foundBid || null);
            // Se o lance for encontrado, preenche os campos do formulário de edição
            if (foundBid) {
                setBidPrice(foundBid.amount.toString());
                setBidEstimatedTime(foundBid.estimatedTime);
            }
          } else {
            setCurrentUserBid(null); // Limpa se não houver usuário logado ou lances
          }
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Pedido de boost não encontrado.');
          toast.error(errorData.error || 'Pedido de boost não encontrado.');
        }
      } catch (err) {
        console.error('Erro de rede ao buscar pedido de boost:', err);
        setError('Erro de conexão ao carregar pedido de boost.');
        toast.error('Erro de conexão ao carregar pedido de boost.');
      } finally {
        setLoading(false);
      }
    }

    // Chama fetchData apenas se o ID estiver disponível e o currentUser não estiver carregando
    // e se o ID não mudou (para evitar loops desnecessários)
    if (id && !authLoading) {
        fetchData();
    }
  }, [id, currentUser, authLoading]);

  // Efeito para buscar/criar a sessão de chat e atualizar mensagens
  useEffect(() => {
    let chatInterval: NodeJS.Timeout | null = null;

    async function fetchChatSession() {
      if (!request || !currentUser) return; // Precisa do pedido e do usuário logado

      // Condição para abrir o chat:
      // 1. O pedido foi aceito (acceptedBidId existe)
      // 2. O usuário logado é o criador do pedido OU o booster que teve o lance aceito
      const isCreator = currentUser.id === request.user.id;
      const isAcceptedBooster = request.acceptedBidId && currentUserBid?.id === request.acceptedBidId;

      if (request.acceptedBidId && (isCreator || isAcceptedBooster)) {
        try {
          const res = await fetch('/api/chat/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              boostRequestId: request.id,
              participant1Id: request.user.id, // Criador do pedido
              participant2Id: request.bids.find(b => b.id === request.acceptedBidId)?.booster.id || '', // Booster aceito
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setChatSession(data.chatSession);
          } else {
            console.error('Falha ao obter sessão de chat:', await res.json());
            setChatSession(null);
          }
        } catch (err) {
          console.error('Erro de rede ao obter sessão de chat:', err);
          setChatSession(null);
        }
      } else {
        setChatSession(null); // Fecha/limpa o chat se as condições não forem atendidas
      }
    }

    // Função para buscar novas mensagens (polling)
    async function fetchMessages() {
      if (!chatSession || chatSession.status !== 'OPEN') return;
      try {
        const res = await fetch(`/api/chat/session/${chatSession.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          setChatSession(prev => prev ? { ...prev, messages: data.messages, status: data.chatStatus } : null);
        } else {
          console.error('Falha ao buscar mensagens:', await res.json());
        }
      } catch (err) {
        console.error('Erro de rede ao buscar mensagens:', err);
      }
    }

    // Inicia a busca da sessão de chat quando o pedido ou usuário logado mudam
    if (request && currentUser && !authLoading) {
      fetchChatSession();
    }

    // Inicia o polling de mensagens se houver uma sessão de chat aberta
    if (chatSession && chatSession.status === 'OPEN') {
      chatInterval = setInterval(fetchMessages, 3000); // Polling a cada 3 segundos
    }

    // Limpa o intervalo quando o componente desmonta ou as dependências mudam
    return () => {
      if (chatInterval) clearInterval(chatInterval);
    };
  }, [request, currentUser, authLoading]); // Dependências: request, currentUser, authLoading

  // Efeito para scrollar para a última mensagem do chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSession?.messages]); // Rola sempre que as mensagens do chat mudam

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('Você precisa estar logado para enviar um lance.');
      router.push('/login');
      return;
    }
    if (!request) {
        toast.error('Erro: Pedido de boost não carregado.');
        return;
    }

    setIsSubmittingBid(true);
    toast.loading('Enviando lance...');

    try {
      const res = await fetch('/api/boostbid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // O token JWT será enviado automaticamente via cookie pelo navegador para o mesmo domínio
        },
        body: JSON.stringify({
          amount: parseFloat(bidPrice), // Preço do lance
          estimatedTime: bidEstimatedTime, // Tempo estimado do lance
          boostRequestId: request.id, // ID do pedido atual
          boosterId: currentUser.id, // ID do usuário logado (o booster)
        }),
      });

      if (res.ok) {
        const newBidData = await res.json(); // Captura os dados do novo lance da resposta
        toast.dismiss();
        toast.success('Lance enviado com sucesso!');
        setBidPrice(''); // Limpa o campo de preço
        setBidEstimatedTime(''); // Limpa o campo de tempo estimado
        
        // NOVO: Atualiza o estado 'request' e 'currentUserBid' localmente para exibir o lance imediatamente
        if (request) {
          const newBid: BoostBid = { // Cria um objeto BoostBid completo com base na resposta
            id: newBidData.bid.id,
            amount: newBidData.bid.amount,
            estimatedTime: newBidData.bid.estimatedTime,
            booster: currentUser, // Usa o currentUser como booster
          };
          setRequest({
            ...request,
            bids: [...request.bids, newBid], // Adiciona o novo lance à lista de lances
          });
          setCurrentUserBid(newBid); // Define o novo lance como o lance do usuário logado
        }
        // router.refresh(); // Opcional: manter para garantir consistência total, mas a atualização local já resolve a exibição imediata
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.error || 'Falha ao enviar lance.');
      }
    } catch (error) {
      console.error('Erro de rede ao enviar lance:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao enviar lance.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Função para lidar com a edição do lance
  const handleEditBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentUserBid || !request) {
      toast.error('Erro: Dados insuficientes para editar o lance.');
      return;
    }

    setIsSubmittingBid(true); // Reutilizando o estado de submissão
    toast.loading('Atualizando lance...');

    try {
      const res = await fetch(`/api/boostbid/${currentUserBid.id}`, { // Chama a API PUT
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(bidPrice),
          estimatedTime: bidEstimatedTime,
        }),
      });

      if (res.ok) {
        const updatedBidData = await res.json(); // Captura os dados atualizados do lance
        toast.dismiss();
        toast.success('Lance atualizado com sucesso!');
        setIsEditingBid(false); // Sai do modo de edição
        
        // NOVO: Atualiza o estado 'request' e 'currentUserBid' localmente
        if (request) {
          const updatedBid: BoostBid = { // Cria um objeto BoostBid atualizado
            ...currentUserBid, // Mantém os dados antigos
            amount: updatedBidData.bid.amount,
            estimatedTime: updatedBidData.bid.estimatedTime,
          } as BoostBid; // Força a tipagem se necessário
          
          setRequest({
            ...request,
            bids: request.bids.map(bid => 
              bid.id === updatedBid.id ? updatedBid : bid // Substitui o lance atualizado na lista
            ),
          });
          setCurrentUserBid(updatedBid); // Atualiza o lance do usuário logado
        }
        // router.refresh(); // Opcional: manter para consistência total
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.error || 'Falha ao atualizar lance.');
      }
    } catch (error) {
      console.error('Erro de rede ao atualizar lance:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao atualizar lance.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Função para lidar com a exclusão do lance
  const handleDeleteBid = async () => {
    if (!currentUser || !currentUserBid || !request) {
      toast.error('Erro: Dados insuficientes para excluir o lance.');
      return;
    }

    // Confirmação antes de excluir (você pode usar um modal customizado aqui)
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este lance?');
    if (!confirmDelete) {
      return;
    }

    setIsDeletingBid(true); // Ativa o estado de exclusão
    toast.loading('Excluindo lance...');

    try {
      const res = await fetch(`/api/boostbid/${currentUserBid.id}`, { // Chama a API DELETE
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        toast.dismiss();
        toast.success('Lance excluído com sucesso!');
        
        // NOVO: Remove o lance do estado local
        if (request) {
          setRequest({
            ...request,
            bids: request.bids.filter(bid => bid.id !== currentUserBid.id), // Filtra o lance excluído
          });
          setCurrentUserBid(null); // Remove o lance do usuário logado
          setIsEditingBid(false); // Sai do modo de edição
        }
        // router.refresh(); // Opcional: manter para consistência total
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.error || 'Falha ao excluir lance.');
      }
    } catch (error) {
      console.error('Erro de rede ao excluir lance:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao excluir lance.');
    } finally {
      setIsDeletingBid(false);
    }
  };

  // Função para lidar com a aceitação de um lance
  const handleAcceptBid = async (bidId: string) => {
    // Verifica se o usuário logado é o criador do pedido e se o lance ainda não foi aceito
    if (!currentUser || currentUser.id !== request?.user.id || request?.acceptedBidId) {
      toast.error('Você não tem permissão para aceitar este lance ou o pedido já foi aceito.');
      return;
    }
    if (!request) {
      toast.error('Erro: Pedido de boost não carregado.');
      return;
    }

    setIsAcceptingBid(true);
    toast.loading('Aceitando lance...');

    try {
      const res = await fetch('/api/boostbid/accept', { // Você precisará criar esta API Route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bidId, requestId: request.id }),
      });

      if (res.ok) {
        toast.dismiss();
        toast.success('Lance aceito com sucesso!');
        router.refresh(); // Isso forçará um re-fetch de todos os dados da página
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.error || 'Falha ao aceitar lance.');
      }
    } catch (error) {
      console.error('Erro de rede ao aceitar lance:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao aceitar lance.');
    } finally {
      setIsAcceptingBid(false);
    }
  };

  // Função para enviar mensagem no chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !chatSession) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/chat/session/${chatSession.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: chatMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        // Adiciona a nova mensagem ao estado local do chat
        setChatSession(prev => prev ? { ...prev, messages: [...prev.messages, data.chatMessage] } : null);
        setChatMessage(''); // Limpa o input da mensagem
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Falha ao enviar mensagem.');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro de conexão ao enviar mensagem.');
    } finally {
      setIsSendingMessage(false);
    }
  };


  // Redireciona para login se não estiver autenticado após o carregamento
  if (!authLoading && !currentUser) {
    router.push('/login');
    return null;
  }

  // Exibe estados de carregamento e erro
  if (loading || authLoading) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando detalhes do pedido de boost...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white flex items-center justify-center">
        <p className="text-red-500">Erro: {error}</p>
        <button onClick={() => router.back()} className="ml-4 py-2 px-4 bg-yellow-400 text-black rounded-md hover:bg-yellow-500">
          Voltar
        </button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white flex items-center justify-center">
        <p className="text-gray-400">Pedido de boost não encontrado.</p>
        <button onClick={() => router.back()} className="ml-4 py-2 px-4 bg-yellow-400 text-black rounded-md hover:bg-yellow-500">
          Voltar
        </button>
      </div>
    );
  }

  // Determina se o chat deve ser exibido
  const showChat = request.acceptedBidId && 
                       chatSession && 
                       chatSession.status === 'OPEN' &&
                       (currentUser?.id === request.user.id || 
                        currentUser?.id === chatSession.participant2.id); // Chat visível para criador ou booster aceito
  
  // Determina o outro participante do chat
  const otherParticipant = chatSession 
    ? (currentUser?.id === chatSession.participant1.id ? chatSession.participant2 : chatSession.participant1)
    : null;


  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#0f0f1a] text-white">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400">Detalhes do Pedido de Boost</h1>
        
        {/* Informações do Pedido */}
        <div className="space-y-3 mb-8 p-4 border border-gray-700 rounded-md">
          <p className="text-lg"><strong>Jogo:</strong> <span className="text-white">{request.game}</span></p>
          <p className="text-lg"><strong>Rank Atual:</strong> <span className="text-white">{request.currentRank}</span></p>
          <p className="text-lg"><strong>Rank Desejado:</strong> <span className="text-white">{request.desiredRank}</span></p>
          <p className="text-lg"><strong>Descrição:</strong> <span className="text-white">{request.description || 'N/A'}</span></p>
          <p className="text-gray-400 text-sm">
            Solicitado por: 
            <Link href={`/perfil/${request.user.id}`} className="text-yellow-400 hover:underline ml-1">
              {request.user.usuario || request.user.nome || request.user.email}
            </Link>
          </p>
          <p className="text-gray-500 text-xs">Data: {new Date(request.createdAt).toLocaleString('pt-BR')}</p>
        </div>

        {/* ================================================================ */}
        {/* Renderização Condicional do Formulário de Lance / Seu Lance */}
        {/* Condição: Usuário logado E não é o criador do pedido E o pedido não foi aceito */}
        {currentUser && currentUser.id !== request.user.id && !request.acceptedBidId && (
          <>
            {!currentUserBid && ( // Se o usuário não tem lance, mostra o formulário de envio
              <div className="mb-8 p-4 border border-blue-600 rounded-md bg-blue-900/20">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Enviar Lance</h2>
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="bidPrice" className="block text-sm font-medium text-gray-300">Preço (R$)</label>
                    <input
                      type="number"
                      id="bidPrice"
                      name="bidPrice"
                      step="0.01"
                      placeholder="Ex: 150.00"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="bidEstimatedTime" className="block text-sm font-medium text-gray-300">Tempo Estimado</label>
                    <select
                      id="bidEstimatedTime"
                      name="bidEstimatedTime"
                      value={bidEstimatedTime}
                      onChange={(e) => setBidEstimatedTime(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
                    >
                      <option value="">Selecione um tempo...</option>
                      {estimatedTimeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingBid}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingBid ? 'Enviando Lance...' : 'Enviar Lance'}
                  </button>
                </form>
              </div>
            )}

            {currentUserBid && ( // Se o usuário já fez um lance, mostra o lance dele
              <div className="mb-8 p-4 border border-purple-600 rounded-md bg-purple-900/20">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Seu Lance</h2>
                {isEditingBid ? ( // Se estiver no modo de edição, mostra o formulário de edição
                  <form onSubmit={handleEditBid} className="space-y-4">
                    <div>
                      <label htmlFor="editBidPrice" className="block text-sm font-medium text-gray-300">Preço (R$)</label>
                      <input
                        type="number"
                        id="editBidPrice"
                        name="editBidPrice"
                        step="0.01"
                        placeholder="Ex: 150.00"
                        value={bidPrice} // Usa o mesmo estado de preço
                        onChange={(e) => setBidPrice(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="editBidEstimatedTime" className="block text-sm font-medium text-gray-300">Tempo Estimado</label>
                      <select
                        id="editBidEstimatedTime"
                        name="editBidEstimatedTime"
                        value={bidEstimatedTime} // Usa o mesmo estado de tempo estimado
                        onChange={(e) => setBidEstimatedTime(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
                      >
                        <option value="">Selecione um tempo...</option>
                        {estimatedTimeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button
                        type="submit"
                        disabled={isSubmittingBid}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingBid ? 'Salvando...' : 'Salvar Edição'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingBid(false)} // Cancela a edição
                        className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : ( // Se não estiver no modo de edição, mostra os detalhes do lance
                  <>
                    <p className="text-lg"><strong>Preço:</strong> <span className="text-white">R$ {currentUserBid.amount.toFixed(2)}</span></p>
                    <p className="text-lg"><strong>Tempo estimado:</strong> <span className="text-white">{currentUserBid.estimatedTime}</span></p>
                    <div className="mt-4 flex gap-4">
                      <button
                        onClick={() => setIsEditingBid(true)} // Entra no modo de edição
                        className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-semibold"
                      >
                        Editar Lance
                      </button>
                      <button
                        onClick={handleDeleteBid} // Conecta ao novo handler de exclusão
                        disabled={isDeletingBid} // Desabilita durante a exclusão
                        className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeletingBid ? 'Excluindo...' : 'Excluir Lance'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        {/* ================================================================ */}

        {/* Lances Recebidos */}
        <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Lances Recebidos</h2>
        {request.bids.length === 0 ? (
          <p className="text-gray-400">Nenhum lance recebido ainda.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {request.bids.map((bid) => (
              <li key={bid.id} className={`p-4 border rounded-md bg-gray-700 shadow-md ${request.acceptedBidId === bid.id ? 'border-green-500 bg-green-900/30' : 'border-gray-600'}`}>
                <p className="text-lg"><strong>Preço:</strong> <span className="text-white">R$ {bid.amount.toFixed(2)}</span></p>
                <p className="text-lg"><strong>Tempo estimado:</strong> <span className="text-white">{bid.estimatedTime}</span></p>
                <p className="text-gray-400 text-sm mt-1">
                  Proposto por: 
                  <Link href={`/perfil/${bid.booster.id}`} className="text-yellow-400 hover:underline ml-1">
                    {bid.booster.usuario || bid.booster.nome || bid.booster.email}
                  </Link>
                </p>
                
                {/* Botão Aceitar Lance (visível apenas para o criador do pedido e se o lance ainda não foi aceito) */}
                {currentUser && currentUser.id === request.user.id && !request.acceptedBidId && (
                  <button
                    onClick={() => handleAcceptBid(bid.id)}
                    disabled={isAcceptingBid}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAcceptingBid ? 'Aceitando...' : 'Aceitar Lance'}
                  </button>
                )}
                {request.acceptedBidId === bid.id && (
                  <p className="mt-2 text-green-400 font-semibold">✅ Lance Aceito!</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Se o chat deve ser exibido */}
        {showChat && chatSession && (
          <div className="mt-8 p-4 border border-yellow-600 rounded-md bg-yellow-900/20">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">
              Chat com {otherParticipant?.usuario || otherParticipant?.nome || 'Usuário'}
            </h2>
            {/* Área de mensagens do chat */}
            <div className="h-80 overflow-y-auto bg-gray-900 p-4 rounded-md mb-4 custom-scrollbar">
              {chatSession.messages.length === 0 ? (
                <p className="text-gray-500 text-center">Nenhuma mensagem ainda. Comece a conversar!</p>
              ) : (
                chatSession.messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex items-start mb-4 ${message.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender.id !== currentUser?.id && (
                      <Image 
                        src={message.sender.profilePictureUrl || '/default-avatar.png'} 
                        alt={message.sender.usuario || message.sender.nome || 'Usuário'} 
                        width={32} 
                        height={32} 
                        className="w-8 h-8 rounded-full mr-3"
                      />
                    )}
                    <div className={`max-w-[70%] p-3 rounded-lg ${message.sender.id === currentUser?.id ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-white rounded-bl-none'}`}>
                      <p className="font-semibold text-sm mb-1">{message.sender.usuario || message.sender.nome || 'Usuário'}</p>
                      <p>{message.content}</p>
                      <span className="block text-right text-xs text-gray-300 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {message.sender.id === currentUser?.id && (
                      <Image 
                        src={message.sender.profilePictureUrl || '/default-avatar.png'} 
                        alt={message.sender.usuario || message.sender.nome || 'Usuário'} 
                        width={32} 
                        height={32} 
                        className="w-8 h-8 rounded-full ml-3"
                      />
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} /> {/* Para scroll automático */}
            </div>

            {/* Formulário de envio de mensagem */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 rounded-md bg-gray-700 border-gray-600 text-white p-2 focus:border-yellow-500 focus:ring-yellow-500"
                disabled={isSendingMessage}
              />
              <button
                type="submit"
                disabled={isSendingMessage}
                className="py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}