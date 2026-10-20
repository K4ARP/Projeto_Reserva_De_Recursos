'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CadastrarUsuario() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.senha !== formData.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    alert(`Usuário "${formData.nome}" cadastrado com sucesso!`);
  };

  return (
    <div className="container-login">
      <div className="card-login">
        <h2>Criar Conta</h2>
        <p className="subtitulo">Preencha os dados para se cadastrar no sistema</p>

        <form onSubmit={handleSubmit} className="formulario">
          <div className="campo">
            <label htmlFor="nome">Nome Completo</label>
            <input
              type="text"
              id="nome"
              name="nome"
              placeholder="Digite seu nome completo"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="seuemail@exemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              placeholder="Crie uma senha"
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              placeholder="Confirme sua senha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-entrar">
            Cadastrar
          </button>
        </form>

        <div className="rodape">
          <p>
            Já tem uma conta?{' '}
            <Link href="/login" className="link">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #000000;
          color: #ffffff;
        }

        .container-login {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000000;
          padding: 20px;
        }

        .card-login {
          width: 100%;
          max-width: 420px;
          background: #000000;
          border: 1px solid #ffffff;
          border-radius: 8px;
          padding: 40px 30px;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
        }

        .card-login h2 {
          margin: 0 0 6px;
          font-size: 26px;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
        }

        .subtitulo {
          margin: 0 0 28px;
          color: #aaaaaa;
          font-size: 14px;
          text-align: center;
        }

        .formulario {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .campo label {
          font-size: 14px;
          color: #ffffff;
          font-weight: 500;
        }

        .campo input {
          width: 100%;
          padding: 12px 14px;
          background: #121212;
          border: 1px solid #333333;
          border-radius: 6px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .campo input:focus {
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.25);
        }

        .btn-entrar {
          width: 100%;
          margin-top: 10px;
          padding: 13px;
          background: #0070f3;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-entrar:hover {
          background: #005bb5;
        }

        .rodape {
          margin-top: 24px;
          text-align: center;
          font-size: 14px;
          color: #aaaaaa;
        }

        .rodape p {
          margin: 0;
        }

        .link {
          color: #0070f3;
          text-decoration: none;
          font-weight: bold;
        }

        .link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}