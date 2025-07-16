'use client';

import './styles.css';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

// Lista de domínios de e-mail permitidos (mesma lista do backend)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'zoho.com',
];

// Lista de domínios de e-mail temporários conhecidos (mesma lista do backend)
const TEMPORARY_EMAIL_DOMAINS = [
  'mailinator.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'mail.tm', 'yopmail.com', 'disposablemail.com', 'trash-mail.com',
  'fakemail.com', 'tempmail.com', 'tempmail.dev',
  'signinid.com', 'jxbav.com', 'uorak.com', 'letterprotect.net',
  'vugitublo.com', 'mailshan.com', 'nesopf.com',
];

export default function RegisterPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de campos vazios
    if (!nome || !usuario || !email || !confirmEmail || !password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    // Validação de correspondência de e-mails
    if (email !== confirmEmail) {
      toast.error('Os e-mails não coincidem!');
      return;
    }

    // --- Validação de domínio de e-mail (Frontend) ---
    const emailDomain = email.split('@')[1];
    if (emailDomain && TEMPORARY_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())) {
      toast.error('E-mails temporários não são permitidos.');
      return;
    }
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())) {
      toast.error('Apenas e-mails de domínios permitidos (ex: Gmail, Outlook, Yahoo) são aceitos.');
      return;
    }
    // --- FIM da Validação de domínio de e-mail ---

    // Validação de correspondência de senhas
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    // --- Validação de complexidade da senha (Frontend) ---
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|`~-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error('A senha deve conter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.');
      return;
    }
    // --- FIM da Validação de complexidade da senha ---

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, usuario, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Cadastro iniciado! Verifique seu e-mail.');
        setTimeout(() => {
          // ALTERADO: Redireciona para a página de verificação de e-mail, passando o e-mail
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        toast.error(data.error || 'Falha no cadastro.');
      }
    } catch (error) {
      console.error('Erro na requisição de cadastro:', error);
      toast.error('Erro de rede. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <main className="container">
        <form onSubmit={handleSubmit}>
          <h1>Criar conta</h1>

          <div className="input-box">
            <input
              placeholder="Nome completo"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <i className="bx bxs-user"></i>
          </div>

          <div className="input-box">
            <input
              placeholder="Nome de usuário (único)"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <i className="bx bxs-user"></i>
          </div>

          <div className="input-box">
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <i className="bx bxs-envelope"></i>
          </div>

          <div className="input-box">
            <input
              placeholder="Confirmar Email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              required
            />
            <i className="bx bxs-envelope"></i>
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

          <div className="input-box">
            <input
              placeholder="Confirmar Senha"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <i
              className={`bx ${showConfirmPassword ? 'bx-show' : 'bx-hide'}`}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ cursor: 'pointer' }}
            ></i>
          </div>

          <div className="remember-forgot">
            <label>
              <input type="checkbox" />
              Lembrar senha
            </label>
            <a href="#">Esqueci senha</a>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>

          <div className="register-link">
            <p>Tem uma conta? <a href="/login">Fazer Login</a></p>
          </div>

          <div className="register-link">
            <p><a href="/">← Voltar para a Home</a></p>
          </div>
        </form>
      </main>
    </div>
  );
}
