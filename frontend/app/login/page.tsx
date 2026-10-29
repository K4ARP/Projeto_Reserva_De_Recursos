
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    login: '',
    senha: '',
  });

  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMensagem('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagem('');
    setCarregando(true);

    try {
      const resposta = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: formData.login,
          senha: formData.senha,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.mensagem || 'Login ou senha inválidos.');
        return;
      }

      if (!dados.token) {
        setMensagem('O servidor não retornou o token de autenticação.');
        return;
      }

      // Salva o token e os dados básicos do usuário.
      localStorage.setItem('token', dados.token);

      if (dados.usuario) {
        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
      }

      // Vai para a página principal: frontend/app/page.js
      window.location.replace('/principal');
    } catch (erro) {
      console.error('Erro ao realizar login:', erro);

      setMensagem(
        'Não foi possível conectar ao servidor. Verifique se a API está funcionando.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        paddingTop: '60px',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        backgroundColor: '#000000',
        color: '#ffffff',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px 30px',
          border: '1px solid #ffffff',
          borderRadius: '8px',
          backgroundColor: '#000000',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '32px',
            lineHeight: '1.3',
            color: '#ffffff',
          }}
        >
          Reserva de Recursos
          <span
            style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 'normal',
              marginTop: '6px',
              color: '#dddddd',
            }}
          >
            (Salas e Laboratórios)
          </span>
        </h1>

        {mensagem && (
          <p
            role="alert"
            aria-live="polite"
            style={{
              padding: '12px',
              margin: '0 0 20px',
              borderRadius: '4px',
              border: '1px solid #7f2929',
              backgroundColor: '#2a1111',
              color: '#fca5a5',
              fontSize: '14px',
              lineHeight: '1.5',
              overflowWrap: 'anywhere',
            }}
          >
            {mensagem}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          <div>
            <label
              htmlFor="login"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#ffffff',
              }}
            >
              Login / Usuário:
            </label>

            <input
              id="login"
              type="text"
              name="login"
              maxLength={50}
              value={formData.login}
              onChange={handleChange}
              placeholder="Digite seu login"
              autoComplete="username"
              required
              style={{
                width: '100%',
                padding: '12px 10px',
                borderRadius: '4px',
                border: '1px solid #444444',
                backgroundColor: '#121212',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#ffffff',
              }}
            >
              Senha:
            </label>

            <input
              id="senha"
              type="password"
              name="senha"
              maxLength={72}
              value={formData.senha}
              onChange={handleChange}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                padding: '12px 10px',
                borderRadius: '4px',
                border: '1px solid #444444',
                backgroundColor: '#121212',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{
              padding: '12px 15px',
              backgroundColor: carregando ? '#444444' : '#0070f3',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: carregando ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '10px',
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '35px', textAlign: 'center' }}>
          <p
            style={{
              marginBottom: '14px',
              fontSize: '15px',
              color: '#cccccc',
            }}
          >
            Ainda não possui uma conta?
          </p>

          <Link
            href="/cadastro-usuario"
            style={{
              display: 'block',
              padding: '12px 15px',
              backgroundColor: 'transparent',
              color: '#0070f3',
              border: '1px solid #0070f3',
              borderRadius: '4px',
              width: '100%',
              fontSize: '15px',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            Criar uma conta
          </Link>
        </div>
      </div>
    </div>
  );
}
