'use client';

import './styles.css';
import { useState } from 'react';

export default function RegisterPage() {
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email !== confirmEmail) {
      setError('Os e-mails não coincidem!');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, usuario, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Conta criada com sucesso!');
        window.location.href = '/login';
      } else {
        setError(data.error || 'Erro ao criar conta.');
      }
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro de rede. Tente novamente.');
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

          {error && (
            <div className="register-link">
              <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>
            </div>
          )}

          <div className="remember-forgot">
            <label>
              <input type="checkbox" />
              Lembrar senha
            </label>
            <a href="#">Esqueci senha</a>
          </div>

          <button type="submit" className="login-button">Criar conta</button>

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
