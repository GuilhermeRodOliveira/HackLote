'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client'; // Importe o tipo Socket separadamente

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Adicione um log para verificar se esta parte está sendo executada
    console.log('Tentando conectar ao WebSocket...');

    // A URL deve ser a mesma onde o seu servidor customizado está rodando
    const newSocket = io('http://localhost:3000/'); 
    setSocket(newSocket);

    // Evento de conexão (útil para debug)
    newSocket.on('connect', () => {
      console.log('Conectado ao WebSocket:', newSocket.id);
    });

    // Evento de erro
    newSocket.on('connect_error', (err: any) => { // <-- CORREÇÃO AQUI
      console.error('Erro ao conectar com WebSocket:', err.message);
    });
    
    // Cleanup: Fecha a conexão quando o componente é desmontado
    return () => {
      newSocket.close();
      console.log('Desconectado do WebSocket.');
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};