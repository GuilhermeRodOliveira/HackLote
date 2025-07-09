// src/app/register/page.jsx

'use client';

import './styles.css';
import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== confirmEmail) {
      alert('Os e-mails não coincidem!');
      return;
    }
    alert('Cadastro realizado com sucesso!');
  };

  return (
    <main className="container">
      <form onSubmit={handleSubmit}>
        <h1>Criar conta</h1>

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
            placeholder="Confirmar Email"
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            required
          />
          <i className="bx bxs-user"></i>
        </div>

        <div className="input-box">
          <input placeholder="Senha" type="password" required />
          <i className="bx bxs-lock-alt"></i>
        </div>

        <div className="remember-forgot">
          <label>
            <input type="checkbox" />
            Lembrar senha
          </label>
          <a href="#">Esqueci senha</a>
        </div>

        <button type="submit" className="login">Criar conta</button>

        <div className="register-link">
          <p>Tem uma conta? <a href="/login">Fazer Login</a></p>
        </div>
      </form>
    </main>
  );
}
