'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';


// Interface para o objeto User, definindo suas propriedades
export interface User {
  id: string;
  usuario?: string; // Nome de usuário opcional
  email: string;
  name?: string; // Nome completo opcional
}

// Interface para o tipo do contexto de autenticação
interface AuthContextType {
  user: User | null; // O objeto User ou null se não houver usuário logado
  loading: boolean; // Indica se o estado de autenticação está sendo carregado
  login: (credentials: { email: string; password: string }) => Promise<void>; // Função de login
  logout: () => void; // Função de logout
  refreshUser: () => Promise<void>; // Função para recarregar os dados do usuário
}

// Cria o contexto de autenticação com valores padrão
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {}, // Função de login padrão vazia
  logout: () => {}, // Função de logout padrão vazia
  refreshUser: async () => {}, // Função de refreshUser padrão vazia
});

// Componente provedor de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Estado para armazenar o usuário
  const [loading, setLoading] = useState(true); // Estado para controlar o carregamento

  // Função assíncrona para buscar os dados do usuário da API
  async function fetchUser() {
    setLoading(true); // Define loading como true enquanto busca
    try {
      const res = await fetch('/api/me'); // Faz uma requisição para sua API /api/me
      if (res.ok) {
        const json = await res.json();
        setUser(json.user); // Define o usuário com os dados recebidos da API
      } else {
        setUser(null); // Se a resposta não for ok, define usuário como null
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error); // Loga qualquer erro na console
      setUser(null); // Em caso de erro, define usuário como null
    } finally {
      setLoading(false); // Define loading como false após a conclusão (sucesso ou erro)
    }
  }

  // Função assíncrona para realizar o login
  async function login(credentials: { email: string; password: string }) {
    setLoading(true); // Define loading como true durante o login
    try {
      const res = await fetch('/api/login', { // Faz uma requisição POST para sua API /api/login
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Define o tipo de conteúdo como JSON
        },
        body: JSON.stringify(credentials), // Envia as credenciais como JSON
      });

      if (res.ok) {
        await fetchUser(); // Se o login for bem-sucedido, busca os dados do usuário para atualizar o estado
      } else {
        const errorData = await res.json(); // Pega os dados de erro da resposta
        console.error("Falha no login:", errorData.message || res.statusText); // Loga o erro
        setUser(null); // Define usuário como null em caso de falha
        setLoading(false); // Define loading como false
        throw new Error(errorData.message || 'Falha no login'); // Lança um erro para ser capturado por quem chamou
      }
    } catch (error) {
      console.error("Erro durante o login:", error); // Loga qualquer erro de rede ou inesperado
      setUser(null); // Define usuário como null
      setLoading(false); // Define loading como false
      throw error; // Lança o erro novamente
    }
  }

  // Função para realizar o logout
  async function logout() { // Alterado para async function
    setLoading(true); // Define loading como true durante o logout
    try {
      const res = await fetch('/api/logout', { method: 'POST' }); // Faz uma requisição POST para sua API /api/logout
      if (res.ok) {
        setUser(null); // Define usuário como null após o logout
      } else {
        console.error("Falha no logout:", res.statusText); // Loga o erro
      }
    } catch (error) {
      console.error("Erro durante o logout:", error); // Loga qualquer erro
    } finally {
      setLoading(false); // Define loading como false após a conclusão (sucesso ou erro)
    }
  }

  // useEffect para buscar o usuário na montagem inicial do componente
  useEffect(() => {
    fetchUser();
  }, []); // O array vazio [] garante que esta função execute apenas uma vez

  // Fornece os valores do contexto para os componentes filhos
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
