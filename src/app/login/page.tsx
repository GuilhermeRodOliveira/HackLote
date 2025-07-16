'use client';

import './styles.css';
import React, { useState, useContext, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Importar o componente Link

import { AuthContext } from '@/context/AuthContext';

export default function LoginPage() {
  const { user, loading: authLoading, login } = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState(''); // Para mensagens de erro do login
  
  // Estado para controlar a exibição da recomendação "Esqueci senha"
  const [showForgotPasswordRecommendation, setShowForgotPasswordRecommendation] = useState(false);

  // Efeito para redirecionar se o usuário já estiver logado
  useEffect(() => {
    if (!authLoading && user) {
      toast.success('Login realizado com sucesso!');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMessage(''); // Limpa mensagens de erro anteriores
    setShowForgotPasswordRecommendation(false); // Limpa a recomendação

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    try {
      await login({ email, password }); // Chama a função de login do AuthContext
    } catch (err: any) {
      const errorMessage = err.message || 'Ocorreu um erro desconhecido ao tentar fazer login.';
      setLoginErrorMessage(errorMessage);
      toast.error(errorMessage);

      // Lógica para exibir a recomendação "Esqueci senha"
      // Verifica se a mensagem de erro contém as palavras-chave que indicam falha de tentativa ou bloqueio
      if (errorMessage.includes('tentativa(s)') || errorMessage.includes('temporariamente bloqueada')) {
        setShowForgotPasswordRecommendation(true);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="login-page-wrapper flex justify-center items-center min-h-screen">
        <p className="text-white text-lg">Carregando autenticação...</p>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="login-page-wrapper">
      <main className="container">
        <form onSubmit={handleLogin}>
          <h1>Login</h1>

          <div className="input-box">
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <i className="bx bxs-user"></i>
          </div>

          <div className="input-box">
            <input
              placeholder="Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <i
              className={`bx ${showPassword ? 'bx-show' : 'bx-hide'}`}
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer' }}
            ></i>
          </div>

          <div className="remember-forgot">
            <label>
              <input type="checkbox" />
              Lembrar senha
            </label>
            {/* ALTERADO: Link para a página de Esqueceu Senha */}
            <Link href="/forgot-password" className="text-white hover:underline">Esqueci senha</Link> 
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={authLoading} // Usar authLoading do contexto
          >
            {authLoading ? 'Entrando...' : 'Login'}
          </button>

          {/* Exibe a mensagem de erro APENAS se houver um erro de login específico */}
          {loginErrorMessage && (
            <p className="text-red-500 text-sm text-center mt-4">{loginErrorMessage}</p>
          )}

          {/* Recomendação "Esqueci senha" */}
          {showForgotPasswordRecommendation && (
            <div className="register-link mt-4"> {/* Reutiliza o estilo register-link para o espaçamento */}
              <p className="text-gray-400">
                Problemas para entrar? Tente <Link href="/forgot-password" className="text-blue-400 hover:underline">Esqueci minha senha</Link>.
              </p>
            </div>
          )}

          <div className="register-link">
            <p>Não tem uma conta? <Link href="/register" className="text-blue-400 hover:underline">Cadastre-se</Link></p>
          </div>

          <div className="register-link">
            <p><Link href="/">← Voltar para a Home</Link></p>
          </div>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </form>
      </main>
    </div>
  );
}
