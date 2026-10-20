'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Reservar() {
  const [formData, setFormData] = useState({
    tipoRecurso: 'Sala de Aula',
    recurso: '',
    data: '',
    horarioInicio: '',
    horarioFim: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Reserva realizada com sucesso para ${formData.recurso || 'o recurso selecionado'}!`);
  };

  return (
    <div className="sistema">
      {/* CABEÇALHO */}
      <header className="cabecalho">
        <div className="marca">
          <h1>Reserva de Salas e Laboratórios</h1>
        </div>

        <div className="usuario-info">
          <span className="titulo-cabecalho">Usuário</span>
        </div>
      </header>

      <div className="estrutura">
        {/* MENU LATERAL */}
        <aside className="menu-lateral">
          <Link href="/" className="item-menu">
            Início
          </Link>

          <Link href="/reservas" className="item-menu ativo">
            Reservar
          </Link>

          <Link href="/consultar-reservas" className="item-menu">
            Consultar Reservas
          </Link>

          <Link href="/cadastrar-recurso" className="item-menu">
            Cadastrar Recurso
          </Link>

          <Link href="/login" className="item-menu sair">
            Sair
          </Link>
        </aside>

        {/* ÁREA CENTRAL - FORMULÁRIO DE RESERVA */}
        <main className="conteudo">
          <div className="card-reserva">
            <h2>Nova Reserva</h2>

            <form onSubmit={handleSubmit} className="formulario">
              {/* TIPO DE RECURSO */}
              <div className="campo">
                <label htmlFor="tipoRecurso">Tipo de Recurso</label>
                <select
                  id="tipoRecurso"
                  name="tipoRecurso"
                  value={formData.tipoRecurso}
                  onChange={handleChange}
                  required
                >
                  <option value="Sala de Aula">Sala de Aula</option>
                  <option value="Laboratório">Laboratório</option>
                  <option value="Auditório">Auditório</option>
                </select>
              </div>

              {/* RECURSO */}
              <div className="campo">
                <label htmlFor="recurso">Recurso</label>
                <select
                  id="recurso"
                  name="recurso"
                  value={formData.recurso}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Selecione o recurso
                  </option>
                  <option value="Sala 101">Sala 101</option>
                  <option value="Sala 102">Sala 102</option>
                  <option value="Lab 1 - Informática">Lab 1 - Informática</option>
                  <option value="Lab 2 - Química">Lab 2 - Química</option>
                </select>
              </div>

              {/* LINHA COM DATA, INÍCIO E FIM LADO A LADO */}
              <div className="linha-horarios">
                <div className="campo">
                  <label htmlFor="data">Data</label>
                  <input
                    type="date"
                    id="data"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="horarioInicio">Horário de Início</label>
                  <input
                    type="time"
                    id="horarioInicio"
                    name="horarioInicio"
                    value={formData.horarioInicio}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="horarioFim">Horário de Fim</label>
                  <input
                    type="time"
                    id="horarioFim"
                    name="horarioFim"
                    value={formData.horarioFim}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* BOTÃO SUBMIT */}
              <div className="acoes">
                <button type="submit" className="btn-reservar">
                  Reservar
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: sans-serif;
          background: #000000;
          color: #ffffff;
        }

        .sistema {
          min-height: 100vh;
          background: #000000;
        }

        /* CABEÇALHO */
        .cabecalho {
          min-height: 70px;
          padding: 0 30px;
          background: #121212;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #2a2a2a;
        }

        .marca {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .marca h1 {
          margin: 0;
          font-size: 18px;
          font-weight: bold;
          color: #ffffff;
          line-height: 1.2;
        }

        .usuario-info {
          font-size: 14px;
          color: #ffffff;
        }

        .estrutura {
          display: flex;
          min-height: calc(100vh - 70px);
        }

        /* MENU LATERAL */
        .menu-lateral {
          width: 320px;
          flex-shrink: 0;
          background: #121212;
          padding-top: 15px;
          border-right: 1px solid #2a2a2a;
          display: flex;
          flex-direction: column;
        }

        .item-menu {
          display: flex;
          align-items: center;
          padding: 14px 30px;
          color: #cccccc;
          text-decoration: none;
          font-size: 14px;
          transition: background 0.2s, color 0.2s;
        }

        .item-menu:hover {
          background: #1f1f1f;
          color: #ffffff;
        }

        .item-menu.ativo {
          background: #0070f3;
          color: white;
          font-weight: bold;
        }

        .item-menu.sair {
          margin-top: auto;
          color: #ff6b6b;
          border-top: 1px solid #2a2a2a;
        }

        .item-menu.sair:hover {
          background: #2a1515;
        }

        /* CONTEÚDO PRINCIPAL */
        .conteudo {
          flex: 1;
          min-width: 0;
          padding: 40px;
          background: #000000;
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
        }

        /* CARD DE RESERVA */
        .card-reserva {
          width: 100%;
          max-width: 650px;
          background: #000000;
          border: 1px solid #ffffff;
          border-radius: 8px;
          padding: 35px 30px;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
        }

        .card-reserva h2 {
          margin: 0 0 24px;
          font-size: 24px;
          color: #ffffff;
          font-weight: bold;
        }

        .formulario {
          display: flex;
          flex-direction: column;
          gap: 20px;
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

        .campo input,
        .campo select {
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

        .campo input:focus,
        .campo select:focus {
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.25);
        }

        .campo select option {
          background: #121212;
          color: #ffffff;
        }

        /* ESTILO DOS INPUTS DE DATA E HORA NO TEMA ESCURO */
        input[type='date']::-webkit-calendar-picker-indicator,
        input[type='time']::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }

        /* LINHA COM DATA E HORÁRIOS LADO A LADO */
        .linha-horarios {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        .acoes {
          margin-top: 10px;
        }

        .btn-reservar {
          width: 100%;
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

        .btn-reservar:hover {
          background: #005bb5;
        }

        @media (max-width: 768px) {
          .cabecalho {
            padding: 16px;
          }

          .estrutura {
            flex-direction: column;
          }

          .menu-lateral {
            width: 100%;
            padding-top: 0;
            overflow-x: auto;
            flex-direction: row;
          }

          .item-menu {
            padding: 14px;
            white-space: nowrap;
          }

          .conteudo {
            padding: 20px 16px;
          }

          .linha-horarios {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}