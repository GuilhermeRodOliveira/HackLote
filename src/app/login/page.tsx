'use client';

import './styles.css';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useRouter } from 'next/navigation'; // import do useRouter
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  const router = useRouter(); // inicializa o router
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Login realizado com sucesso!');

        setTimeout(() => {
          router.push('/'); // navega sem recarregar a página
        }, 2000);
      } else {
        toast.error(data.error || 'Falha no login.');
      }
    } catch (err) {
      toast.error('Erro de rede. Tente novamente.');
      console.error('Erro no login:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <a href="#">Esqueci senha</a>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Login'}
          </button>

          <div className="register-link">
            <p>Não tem uma conta? <a href="/register">Cadastre-se</a></p>
          </div>

          <div className="register-link">
            <p><a href="/">← Voltar para a Home</a></p>
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
