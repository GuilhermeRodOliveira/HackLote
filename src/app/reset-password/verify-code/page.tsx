'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import '../../login/styles.css'; // Reutilizar estilos do login/registro

export default function ResetPasswordVerifyCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Preenche o email se ele vier como parâmetro na URL (ex: /reset-password/verify-code?email=usuario@exemplo.com)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !code) {
      toast.error('Por favor, insira seu e-mail e o código de verificação.');
      setLoading(false);
      return;
    }

    try {
      // Chama o novo endpoint para verificar o código de redefinição
      const res = await fetch('/api/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Código verificado com sucesso! Agora defina sua nova senha.');
        // Redireciona para a página de definição da nova senha, passando o e-mail e o código (ou um token temporário)
        setTimeout(() => {
          router.push(`/reset-password/new-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
        }, 2000);
      } else {
        toast.error(data.error || 'Erro na verificação do código.');
      }
    } catch (error) {
      console.error('Erro de rede na verificação do código:', error);
      toast.error('Erro de rede. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper"> {/* Reutiliza o wrapper de background */}
      <main className="container"> {/* Reutiliza o card container */}
        <form onSubmit={handleVerifyCode}>
          <h1 className="text-3xl font-bold text-center mb-6">Verificar Código de Redefinição</h1>
          <p className="text-gray-400 text-center mb-4">
            Um código foi enviado para o seu e-mail. Insira-o abaixo.
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
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>

          <div className="register-link mt-4">
            <p>Não recebeu o código? <Link href="/forgot-password" className="text-blue-400 hover:underline">Reenviar Código</Link></p>
          </div>
          <div className="register-link">
            <p><Link href="/login" className="text-blue-400 hover:underline">Voltar para o Login</Link></p>
          </div>
        </form>
      </main>
    </div>
  );
}
