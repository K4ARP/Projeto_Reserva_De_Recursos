'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [formData, setFormData] = useState({
    login: '',
    senha: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Dados do Login:', formData);
    alert('Login realizado com sucesso!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        paddingTop: '60px', // Posiciona mais para baixo no centro
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        backgroundColor: '#000000', // Fundo da página preto
        color: '#ffffff', // Texto padrão em branco
      }}
    >
      {/* Container / Quadradinho com fundo preto e borda fina branca */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px 30px',
          border: '1px solid #ffffff', // Espessura fina branca
          borderRadius: '8px',
          backgroundColor: '#000000', // Cor de fundo preta (igual ao fundo da página)
          boxSizing: 'border-box',
        }}
      >
        {/* Título bem grande */}
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
          <span style={{ display: 'block', fontSize: '20px', fontWeight: 'normal', marginTop: '6px', color: '#dddddd' }}>
            (Salas e Laboratórios)
          </span>
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ffffff' }}>
              Login / Usuário:
            </label>
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Digite seu login"
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
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ffffff' }}>
              Senha:
            </label>
            <input
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Digite sua senha"
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
            style={{
              padding: '12px 15px',
              backgroundColor: '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '10px',
            }}
          >
            Entrar
          </button>
        </form>

        <div style={{ marginTop: '35px', textAlign: 'center' }}>
          <p style={{ marginBottom: '14px', fontSize: '15px', color: '#cccccc' }}>
            Ainda não possui uma conta?
          </p>
          <Link href="/cadastro-usuario">
            <button
              type="button"
              style={{
                padding: '12px 15px',
                backgroundColor: 'transparent',
                color: '#0070f3',
                border: '1px solid #0070f3',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '15px',
              }}
            >
              Criar uma conta
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}