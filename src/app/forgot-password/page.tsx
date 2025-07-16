'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import '../login/styles.css'; // Reutilizar estilos do login/registro

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!email) {
      toast.error('Por favor, insira seu e-mail.');
      setLoading(false);
      return;
    }

    try {
      // Chama o endpoint para enviar o código de recuperação
      const res = await fetch('/api/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Se um e-mail correspondente for encontrado, um código de redefinição de senha foi enviado.');
        toast.success(data.message || 'Código de redefinição enviado com sucesso!');
        // Redireciona para uma página para inserir o código
        setTimeout(() => {
          router.push(`/reset-password/verify-code?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        setMessage(data.error || 'Erro ao solicitar redefinição de senha.');
        toast.error(data.error || 'Erro ao solicitar redefinição de senha.');
      }
    } catch (error) {
      console.error('Erro de rede ao solicitar redefinição:', error);
      setMessage('Erro de rede. Tente novamente.');
      toast.error('Erro de rede. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // O return principal do componente deve estar aqui, fora de qualquer função ou if/else
  return (
    <div className="login-page-wrapper"> {/* Reutiliza o wrapper de background */}
      <main className="container"> {/* Reutiliza o card container */}
        <form onSubmit={handleSubmit}>
          <h1 className="text-3xl font-bold text-center mb-6">Esqueci a Senha</h1>
          <p className="text-gray-400 text-center mb-4">
            Insira seu e-mail para receber um código de redefinição de senha.
          </p>

          <div className="input-box">
            <input
              placeholder="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <i className="bx bxs-envelope"></i>
          </div>

          <button
            type="submit"
            className="login-button" // Reutiliza o estilo do botão de login
            disabled={loading}
          >
            {loading ? 'Enviando Código...' : 'Enviar Código'}
          </button>

          {message && (
            <p className={`text-center mt-4 ${message.includes('Erro') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}

          <div className="register-link mt-4">
            <p><Link href="/login" className="text-blue-400 hover:underline">← Voltar para o Login</Link></p>
          </div>
        </form>
      </main>
    </div>
  );
}
