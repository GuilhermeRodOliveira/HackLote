'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // useSearchParams para pegar o email da URL
import { toast } from 'react-toastify';
import Link from 'next/link';
import './styles.css'; // Crie este arquivo CSS para estilos específicos se necessário

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Para ler parâmetros da URL
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Preenche o email se ele vier como parâmetro na URL (ex: /verify-email?email=usuario@exemplo.com)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !code) {
      toast.error('Por favor, preencha o e-mail e o código de verificação.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'E-mail verificado com sucesso! Você será redirecionado.');
        setTimeout(() => {
          router.push('/'); // Redireciona para a página inicial (assumindo que o usuário é logado)
        }, 2000);
      } else {
        toast.error(data.error || 'Erro na verificação do código.');
      }
    } catch (error) {
      console.error('Erro de rede na verificação:', error);
      toast.error('Erro de rede. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-page-wrapper flex justify-center items-center min-h-screen bg-[#0d0f25]"> {/* Fundo escuro */}
      <main className="container"> {/* Reutiliza a classe global .container para o card */}
        <form onSubmit={handleVerify}>
          <h1 className="text-3xl font-bold text-center mb-6">Verificar E-mail</h1>
          <p className="text-gray-400 text-center mb-4">
            Um código de verificação foi enviado para o seu e-mail. Por favor, insira-o abaixo.
          </p>

          <div className="input-box">
            <input
              placeholder="Seu E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!searchParams.get('email')} // Torna o campo somente leitura se o email vier da URL
            />
            <i className="bx bxs-envelope"></i>
          </div>

          <div className="input-box">
            <input
              placeholder="Código de Verificação"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6} // Códigos de 6 dígitos
              required
            />
            <i className="bx bxs-key"></i> {/* Ícone de chave/código */}
          </div>

          <button
            type="submit"
            className="login-button" // Reutiliza o estilo do botão de login
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Verificar E-mail'}
          </button>

          <div className="register-link mt-4">
            <p>Não recebeu o código? <Link href="/register" className="text-blue-400 hover:underline">Reenviar</Link></p> {/* Link para reenviar (pode ser ajustado para um endpoint de reenviar) */}
          </div>
          <div className="register-link">
            <p><Link href="/login" className="text-blue-400 hover:underline">Voltar para o Login</Link></p>
          </div>
        </form>
      </main>
    </div>
  );
}
