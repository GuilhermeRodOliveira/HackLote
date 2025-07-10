// src/app/login/page.tsx
'use client';

// Mantenha o import do CSS específico desta página
import "./styles.css";

export default function LoginPage() {
  return (
    // Adicione uma div para o background e centralização desta página,
    // em vez de aplicar no <body> global.
    <div className="login-page-wrapper"> 
      <main className="container">
        <form>
          <h1>Login</h1>

          <div className="input-box">
            <input placeholder="Email" type="email" />
            <i className="bx bxs-user"></i>
          </div>

          <div className="input-box">
            <input placeholder="Senha" type="password" />
            <i className="bx bxs-lock-alt"></i>
          </div>

          <div className="remember-forgot">
            <label>
              <input type="checkbox" />
              Lembrar senha
            </label>
            <a href="#">Esqueci senha</a>
          </div>

          <button type="submit" className="login-button">Login</button> {/* Renomeei a classe para evitar conflito com 'login' em CSS mais global */}

          <div className="register-link">
            <p>Não tem uma conta? <a href="/register">Cadastre-se</a></p>
          </div>
        </form>
      </main>
    </div>
  );
}