// file: src/app/chats/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify'; // Certifique-se de ter o react-toastify instalado
import { useSocket } from '@/context/SocketContext';

// Interfaces para os dados
interface User {
  id: string;
  name: string;
  image: string;
}
interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}
interface Chat {
  id: string;
  participants: { user: User }[];
  lastMessageText: string | null;
  lastMessageAt: string | null;
}

export default function ChatsPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket } = useSocket();
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Efeito para carregar a lista de chats
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      toast.error('Você precisa estar logado para acessar os chats.');
      return;
    }

    const fetchChats = async () => {
      setIsLoadingChats(true);
      try {
        const res = await fetch('/api/chats');
        if (res.ok) {
          const data = await res.json();
          setChats(data.chats);
        } else {
          toast.error('Erro ao carregar conversas.');
        }
      } catch (error) {
        toast.error('Erro de rede ao buscar conversas.');
      } finally {
        setIsLoadingChats(false);
      }
    };
    fetchChats();
  }, [user, authLoading, router]);

  // Efeito para gerenciar a conexão do chat ativo
  useEffect(() => {
    if (socket && activeChatId) {
      socket.emit('join_chat', activeChatId);
      const handleReceiveMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
        // TODO: Atualizar a lista de chats na lateral com a nova mensagem
      };
      socket.on('receive_message', handleReceiveMessage);
      return () => {
        socket.emit('leave_chat', activeChatId);
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [socket, activeChatId]);

  // Função para selecionar um chat e carregar as mensagens
  const handleSelectChat = async (chatId: string) => {
    if (activeChatId === chatId) return; // Evita recarregar se já estiver no chat

    if (socket && activeChatId) {
      socket.emit('leave_chat', activeChatId);
    }
    setActiveChatId(chatId);
    setIsLoadingMessages(true);
    setMessages([]);

    try {
      const res = await fetch(`/api/chats/${chatId}`); // Rota corrigida
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      } else {
        toast.error('Erro ao carregar histórico de mensagens.');
      }
    } catch (error) {
      toast.error('Erro de rede ao carregar mensagens.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Função para enviar uma nova mensagem
  const handleSendMessage = () => {
    if (socket && activeChatId && newMessage.trim() && user) {
      const messageData = {
        chatId: activeChatId,
        senderId: user.id,
        text: newMessage,
        timestamp: new Date().toISOString(),
      };
      socket.emit('send_message', messageData);
      setNewMessage('');
    }
  };

  // Renderização da página
  if (authLoading || isLoadingChats) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">Carregando chats...</div>;
  }
  if (!user) return null; // A rota já redirecionou

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#0f0f1a] text-white">
      {/* Chat List (Barra lateral) */}
      <div className="w-1/3 border-r border-gray-700 bg-[#1a1a1a] p-4 flex flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Conversas</h2>
        {chats.map(chat => {
          const otherParticipant = chat.participants.find(p => p.user.id !== user.id)?.user;
          if (!otherParticipant) return null;

          return (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`p-3 rounded-lg cursor-pointer flex items-center mb-2 transition-colors ${
                activeChatId === chat.id ? 'bg-blue-600' : 'hover:bg-[#2c2c2c]'
              }`}
            >
              <img src={otherParticipant.image || '/placeholder-avatar.png'} alt="Avatar" className="w-10 h-10 rounded-full mr-3" />
              <div>
                <p className="font-semibold">{otherParticipant.name}</p>
                <p className="text-sm text-gray-400 truncate">{chat.lastMessageText || 'Comece a conversar...'}</p>
              </div>
            </div>
          );
        })}
      </div>
      {/* Chat Window (Janela principal) */}
      <div className="flex-1 flex flex-col">
        {activeChatId ? (
          <>
            <div className="p-4 border-b border-gray-700 bg-[#1a1a1a]">
              <h2 className="text-xl font-bold">Chat com {chats.find(c => c.id === activeChatId)?.participants.find(p => p.user.id !== user.id)?.user.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <p className="text-gray-400 text-center">Carregando mensagens...</p>
              ) : messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs ${msg.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700 bg-[#1a1a1a] flex">
              <input
                type="text"
                className="flex-1 p-3 rounded-l-lg bg-gray-700 text-white border border-gray-600 focus:outline-none"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white p-3 rounded-r-lg font-semibold hover:bg-blue-700"
              >
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">Selecione uma conversa para começar a conversar.</p>
          </div>
        )}
      </div>
    </div>
  );
}