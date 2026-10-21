
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CadastrarUsuario() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    cpf: '',
    nomeCompleto: '',
    dataAniversario: '',
    celular: '',
    email: '',
    login: '',
    senha: '',
    confirmarSenha: '',
  });

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setMensagem('');
    setTipoMensagem('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMensagem('');
    setTipoMensagem('');

    if (formData.senha !== formData.confirmarSenha) {
      setTipoMensagem('erro');
      setMensagem('As senhas não coincidem!');
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch('http://localhost:8080/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: formData.cpf,
          nomeCompleto: formData.nomeCompleto,
          dataAniversario: formData.dataAniversario,
          celular: formData.celular,
          email: formData.email,
          login: formData.login,
          senha: formData.senha,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem || 'Não foi possível cadastrar o usuário.'
        );
      }

      // Cadastro concluído: segue para a tela de login.
      router.replace('/login');
    } catch (erro) {
      console.error('Erro ao cadastrar usuário:', erro);

      setTipoMensagem('erro');
      setMensagem(
        erro.message || 'Não foi possível conectar ao servidor.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container-login">
      <div className="card-login">
        <h2>Criar Conta</h2>

        <p className="subtitulo">
          Preencha os dados para se cadastrar no sistema
        </p>

        {mensagem && (
          <p
            className={`mensagem ${tipoMensagem}`}
            role="status"
            aria-live="polite"
          >
            {mensagem}
          </p>
        )}

        <form onSubmit={handleSubmit} className="formulario">
          <div className="campos-grid">
            <div className="campo">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="nomeCompleto">Nome Completo</label>
              <input
                id="nomeCompleto"
                name="nomeCompleto"
                type="text"
                placeholder="Digite o nome completo"
                value={formData.nomeCompleto}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="dataAniversario">Data de Nascimento</label>
              <input
                id="dataAniversario"
                name="dataAniversario"
                type="date"
                value={formData.dataAniversario}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="celular">Celular</label>
              <input
                id="celular"
                name="celular"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.celular}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="login">Login</label>
              <input
                id="login"
                name="login"
                type="text"
                placeholder="Crie um usuário para login"
                value={formData.login}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                name="senha"
                type="password"
                placeholder="Crie uma senha"
                autoComplete="new-password"
                value={formData.senha}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="confirmarSenha">Confirmar Senha</label>
              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                placeholder="Repita a senha"
                autoComplete="new-password"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-entrar"
            disabled={carregando}
          >
            {carregando ? 'Cadastrando...' : 'Cadastrar'}
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
          padding: 30px 20px;
        }

        .card-login {
          width: 100%;
          max-width: 600px;
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

        .mensagem {
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 20px;
          overflow-wrap: anywhere;
        }

        .mensagem.erro {
          color: #fca5a5;
          background: #2a1111;
          border: 1px solid #7f2929;
        }

        .formulario {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .campos-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .campo label {
          font-size: 14px;
          color: #ffffff;
          font-weight: 500;
        }

        .campo input {
          width: 100%;
          min-width: 0;
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

        input[type='date']::-webkit-calendar-picker-indicator {
          filter: invert(1);
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

        .btn-entrar:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        @media (max-width: 580px) {
          .campos-grid {
            grid-template-columns: 1fr;
          }

          .card-login {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}
