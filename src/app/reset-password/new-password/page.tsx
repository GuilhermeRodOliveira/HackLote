'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import '../../login/styles.css'; // Reutilizar estilos do login/registro

export default function NewPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(''); // O código também será passado para o backend
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pega o email e o código da URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');
    if (emailParam && codeParam) {
      setEmail(emailParam);
      setCode(codeParam);
    } else {
      // Se faltar email ou código, redireciona para o início do fluxo de recuperação
      toast.error('Parâmetros de redefinição incompletos. Por favor, inicie o processo novamente.');
      router.push('/forgot-password');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !code || !newPassword || !confirmNewPassword) {
      toast.error('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('As novas senhas não coincidem.');
      setLoading(false);
      return;
    }

    // Validação de complexidade da senha (mesma regex do registro/login)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|`~-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('A nova senha deve conter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.');
      setLoading(false);
      return;
    }

    try {
      // NOVO LOG: Para ver os dados enviados para o backend
      console.log('Enviando dados para redefinição de senha:', { email, code, newPassword });

      // Chama o endpoint para redefinir a senha
      const res = await fetch('/api/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      // NOVO LOG: Para ver a resposta bruta da API
      console.log('Resposta bruta da API de redefinição:', res);

      const data = await res.json(); // Tenta parsear a resposta como JSON

      // NOVO LOG: Para ver os dados parseados da API
      console.log('Dados da resposta da API de redefinição:', data);

      if (res.ok) {
        toast.success(data.message || 'Senha redefinida com sucesso! Você será redirecionado para o login.');
        setTimeout(() => {
          router.push('/login'); // Redireciona para o login após o sucesso
        }, 2000);
      } else {
        toast.error(data.error || 'Erro ao redefinir a senha.');
      }
    } catch (error: any) { // Captura o erro com tipo 'any' para acessar propriedades
      console.error('Erro de rede ou ao processar resposta da redefinição de senha:', error);
      // NOVO: Loga detalhes específicos do erro se for um SyntaxError (JSON inválido)
      if (error instanceof SyntaxError) {
        console.error('Provável erro: Resposta da API não é JSON válida. Conteúdo:', await (error as any).response?.text());
      }
      toast.error('Erro de rede ou ao redefinir a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Se email ou code não estiverem na URL (ou ainda carregando), não renderiza o formulário
  if (loading || !email || !code) {
    return (
      <div className="login-page-wrapper flex justify-center items-center min-h-screen">
        <p className="text-white text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      <main className="container">
        <form onSubmit={handleSubmit}>
          <h1 className="text-3xl font-bold text-center mb-6">Definir Nova Senha</h1>
          <p className="text-gray-400 text-center mb-4">
            Insira sua nova senha.
          </p>

          <div className="input-box">
            <input
              placeholder="Nova Senha"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <i
              className={`bx ${showNewPassword ? 'bx-show' : 'bx-hide'}`}
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{ cursor: 'pointer' }}
            ></i>
          </div>

          <div className="input-box">
            <input
              placeholder="Confirmar Nova Senha"
              type={showConfirmNewPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <i
              className={`bx ${showConfirmNewPassword ? 'bx-show' : 'bx-hide'}`}
              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              style={{ cursor: 'pointer' }}
            ></i>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>

          <div className="register-link mt-4">
            <p><Link href="/login" className="text-blue-400 hover:underline">← Voltar para o Login</Link></p>
          </div>
        </form>
      </main>
    </div>
  );
}
