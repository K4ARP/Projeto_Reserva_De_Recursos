
'use client';

import { useEffect, useState } from 'react';

type Secao = 'inicio' | 'reservar' | 'consultar' | 'recursos';

type Recurso = {
  codigo: string;
  nome: string;
  capacidade: number;
  localizacao: string;
  ativo: boolean;
};

type Reserva = {
  idReserva?: number;
  nomeCompleto?: string;
  nomeRecurso?: string;
  tipoRecurso?: string;
  codigo?: string | number;
  dataReserva?: string;
  horarioInicio?: string;
  horarioFim?: string;
  status?: string;
};

const API = 'http://localhost:8080';

export default function Principal() {
  const [secao, setSecao] = useState<Secao>('inicio');
  const [tipoRecurso, setTipoRecurso] = useState<'Sala de Aula' | 'Laboratório'>('Sala de Aula');

  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [formRecurso, setFormRecurso] = useState({
    codigo: '',
    nome: '',
    capacidade: '',
    localizacao: '',
  });

  const [formReserva, setFormReserva] = useState({
    tipo: 'sala',
    codigo: '',
    data: '',
    inicio: '',
    fim: '',
  });

  const [filtros, setFiltros] = useState({
    tipo: '',
    codigo: '',
    data: '',
  });

  const tipoApi = tipoRecurso === 'Sala de Aula' ? 'sala' : 'laboratorio';

  function obterToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  }

  async function lerResposta(resposta: Response) {
    const texto = await resposta.text();

    let dados: any = {};
    try {
      dados = texto ? JSON.parse(texto) : {};
    } catch {
      dados = { mensagem: texto };
    }

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem || dados.erro || `Erro HTTP ${resposta.status}`
      );
    }

    return dados;
  }

  function extrairLista(dados: any): any[] {
    if (Array.isArray(dados)) return dados;
    if (Array.isArray(dados.recursos)) return dados.recursos;
    if (Array.isArray(dados.reservas)) return dados.reservas;
    if (Array.isArray(dados.resultado)) return dados.resultado;
    if (Array.isArray(dados.dados)) return dados.dados;
    return [];
  }

  // Carrega salas ou laboratórios do banco.
  async function carregarRecursos(tipo = tipoApi) {
    setCarregando(true);
    setMensagem('');

    try {
      const resposta = await fetch(`${API}/recursos/${tipo}`);
      const dados = await lerResposta(resposta);
      const lista = extrairLista(dados);

      setRecursos(
        lista.map((r: any) => ({
          codigo: String(r.codigo ?? r.codigoRecurso ?? r.id ?? ''),
          nome: String(r.nome ?? r.nomeRecurso ?? ''),
          capacidade: Number(r.capacidade ?? 0),
          localizacao: String(r.localizacao ?? ''),
          ativo: r.ativo === undefined ? true : Boolean(r.ativo),
        }))
      );
    } catch (erro) {
      setRecursos([]);
      setMensagem(
        erro instanceof Error
          ? `Não foi possível carregar os recursos: ${erro.message}`
          : 'Não foi possível carregar os recursos.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // IMPORTANTE: carrega os recursos também ao entrar em Reservar.
  useEffect(() => {
    if (secao === 'recursos' || secao === 'reservar') {
      const tipo = secao === 'reservar'
        ? formReserva.tipo
        : tipoApi;

      carregarRecursos(tipo);
    }
  }, [secao, tipoRecurso, formReserva.tipo]);

  async function cadastrarRecurso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem('');

    if (
      !formRecurso.codigo.trim() ||
      !formRecurso.nome.trim() ||
      !formRecurso.capacidade ||
      !formRecurso.localizacao.trim()
    ) {
      setMensagem('Preencha todos os campos do recurso.');
      return;
    }

    try {
      const resposta = await fetch(`${API}/recursos/${tipoApi}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: formRecurso.codigo,
          nome: formRecurso.nome,
          capacidade: Number(formRecurso.capacidade),
          localizacao: formRecurso.localizacao,
          ativo: true,
        }),
      });

      const dados = await lerResposta(resposta);

      setMensagem(dados.mensagem || 'Recurso cadastrado com sucesso!');
      setFormRecurso({
        codigo: '',
        nome: '',
        capacidade: '',
        localizacao: '',
      });

      await carregarRecursos(tipoApi);
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? `Erro ao cadastrar recurso: ${erro.message}`
          : 'Erro ao cadastrar recurso.'
      );
    }
  }

  async function alterarAtivo(recurso: Recurso) {
    setMensagem('');

    try {
      const resposta = await fetch(
        `${API}/recursos/${tipoApi}/${encodeURIComponent(recurso.codigo)}/ativo`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ativo: !recurso.ativo }),
        }
      );

      const dados = await lerResposta(resposta);
      setMensagem(dados.mensagem || 'Status do recurso atualizado.');
      await carregarRecursos(tipoApi);
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? `Erro ao alterar recurso: ${erro.message}`
          : 'Erro ao alterar o recurso.'
      );
    }
  }

  async function consultarReservas(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setMensagem('');

    try {
      const parametros = new URLSearchParams();

      if (filtros.tipo) parametros.set('tipo', filtros.tipo);
      if (filtros.codigo.trim()) parametros.set('codigo', filtros.codigo.trim());
      if (filtros.data) parametros.set('data', filtros.data);

      const token = obterToken();

      const resposta = await fetch(
        `${API}/reservas?${parametros.toString()}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const dados = await lerResposta(resposta);
      setReservas(extrairLista(dados));
    } catch (erro) {
      setReservas([]);
      setMensagem(
        erro instanceof Error
          ? `Erro ao consultar reservas: ${erro.message}`
          : 'Erro ao consultar reservas.'
      );
    }
  }

  async function enviarReserva(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem('');

    if (
      !formReserva.codigo ||
      !formReserva.data ||
      !formReserva.inicio ||
      !formReserva.fim
    ) {
      setMensagem('Preencha todos os campos da reserva.');
      return;
    }

    if (formReserva.inicio >= formReserva.fim) {
      setMensagem('O horário final deve ser posterior ao inicial.');
      return;
    }

    try {
      const token = obterToken();

      if (!token) {
        setMensagem('Faça login antes de reservar um recurso.');
        return;
      }

      const corpo = {
        tipo: formReserva.tipo,
        codigo: formReserva.codigo,
        data: formReserva.data,
        inicio: formReserva.inicio,
        fim: formReserva.fim,
      };

      const resposta = await fetch(`${API}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(corpo),
      });

      const dados = await lerResposta(resposta);
      setMensagem(dados.mensagem || 'Reserva cadastrada com sucesso!');

      setFormReserva({
        tipo: 'sala',
        codigo: '',
        data: '',
        inicio: '',
        fim: '',
      });
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? `Erro ao reservar: ${erro.message}`
          : 'Erro ao cadastrar reserva.'
      );
    }
  }

  function abrirSecao(novaSecao: Secao) {
    setMensagem('');
    setSecao(novaSecao);
  }

  return (
    <main className="pagina">
      <aside className="menu">
        <h2>Reserva de Recursos</h2>

        <button onClick={() => abrirSecao('inicio')}>⌂ Início</button>
        <button onClick={() => abrirSecao('reservar')}>▣ Reservar</button>
        <button onClick={() => abrirSecao('consultar')}>▤ Consultar reservas</button>
        <button onClick={() => abrirSecao('recursos')}>＋ Cadastrar recurso</button>

        <button
          className="sair"
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/';
          }}
        >
          Sair
        </button>
      </aside>

      <section className="conteudo">
        <header className="cabecalho">
          <div>
            <h1>
              {secao === 'inicio' && 'Página principal'}
              {secao === 'reservar' && 'Reservar recurso'}
              {secao === 'consultar' && 'Consultar reservas'}
              {secao === 'recursos' && 'Cadastro de recursos'}
            </h1>
            <p>Sistema de reserva de salas de aula e laboratórios</p>
          </div>
        </header>

        {mensagem && (
          <div className="mensagem" role="status">
            {mensagem}
          </div>
        )}

        {secao === 'inicio' && (
          <div className="painel">
            <h2>Bem-vindo!</h2>
            <p>Escolha uma opção no menu para começar.</p>

            <div className="cartoes">
              <button className="cartao" onClick={() => abrirSecao('reservar')}>
                <span>▣</span>
                <strong>Reservar recurso</strong>
                <small>Escolha uma sala ou laboratório.</small>
              </button>

              <button className="cartao" onClick={() => abrirSecao('consultar')}>
                <span>▤</span>
                <strong>Consultar reservas</strong>
                <small>Consulte as reservas cadastradas.</small>
              </button>

              <button className="cartao" onClick={() => abrirSecao('recursos')}>
                <span>＋</span>
                <strong>Cadastrar recurso</strong>
                <small>Cadastre salas e laboratórios.</small>
              </button>
            </div>
          </div>
        )}

        {secao === 'recursos' && (
          <div className="painel">
            <h2>Cadastrar recurso</h2>

            <div className="campo">
              <label>Tipo de recurso</label>
              <select
                value={tipoRecurso}
                onChange={(e) =>
                  setTipoRecurso(e.target.value as 'Sala de Aula' | 'Laboratório')
                }
              >
                <option>Sala de Aula</option>
                <option>Laboratório</option>
              </select>
            </div>

            <form onSubmit={cadastrarRecurso} className="formulario">
              <div className="campo">
                <label>Código</label>
                <input
                  value={formRecurso.codigo}
                  onChange={(e) =>
                    setFormRecurso({ ...formRecurso, codigo: e.target.value })
                  }
                  placeholder="Ex.: 101"
                  required
                />
              </div>

              <div className="campo">
                <label>Nome</label>
                <input
                  value={formRecurso.nome}
                  onChange={(e) =>
                    setFormRecurso({ ...formRecurso, nome: e.target.value })
                  }
                  placeholder="Nome do recurso"
                  required
                />
              </div>

              <div className="campo">
                <label>Capacidade</label>
                <input
                  type="number"
                  min="1"
                  value={formRecurso.capacidade}
                  onChange={(e) =>
                    setFormRecurso({ ...formRecurso, capacidade: e.target.value })
                  }
                  placeholder="Quantidade de pessoas"
                  required
                />
              </div>

              <div className="campo">
                <label>Localização</label>
                <input
                  value={formRecurso.localizacao}
                  onChange={(e) =>
                    setFormRecurso({ ...formRecurso, localizacao: e.target.value })
                  }
                  placeholder="Ex.: Bloco A"
                  required
                />
              </div>

              <button className="primario" type="submit">
                Cadastrar recurso
              </button>
            </form>

            <div className="titulo-lista">
              <h2>Recursos cadastrados</h2>
              <button className="secundario" onClick={() => carregarRecursos()}>
                Atualizar lista
              </button>
            </div>

            {carregando ? (
              <p>Carregando recursos...</p>
            ) : recursos.length === 0 ? (
              <p>Nenhum recurso encontrado para este tipo.</p>
            ) : (
              <div className="tabela-container">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nome</th>
                      <th>Capacidade</th>
                      <th>Localização</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recursos.map((r) => (
                      <tr key={r.codigo}>
                        <td>{r.codigo}</td>
                        <td>{r.nome}</td>
                        <td>{r.capacidade}</td>
                        <td>{r.localizacao}</td>
                        <td>{r.ativo ? 'Ativo' : 'Inativo'}</td>
                        <td>
                          <button
                            className="secundario"
                            onClick={() => alterarAtivo(r)}
                          >
                            {r.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {secao === 'reservar' && (
          <div className="painel">
            <h2>Nova reserva</h2>

            <form onSubmit={enviarReserva} className="formulario">
              <div className="campo">
                <label>Tipo de recurso</label>
                <select
                  value={formReserva.tipo}
                  onChange={(e) =>
                    setFormReserva({
                      ...formReserva,
                      tipo: e.target.value,
                      codigo: '',
                    })
                  }
                >
                  <option value="sala">Sala de aula</option>
                  <option value="laboratorio">Laboratório</option>
                </select>
              </div>

              <div className="campo">
                <label>Recurso disponível</label>
                <select
                  value={formReserva.codigo}
                  onChange={(e) =>
                    setFormReserva({ ...formReserva, codigo: e.target.value })
                  }
                  required
                >
                  <option value="">Selecione um recurso</option>
                  {recursos
                    .filter((r) => r.ativo)
                    .map((r) => (
                      <option key={r.codigo} value={r.codigo}>
                        {r.nome} — Código {r.codigo}
                      </option>
                    ))}
                </select>

                {!carregando && recursos.filter((r) => r.ativo).length === 0 && (
                  <small>
                    Nenhum recurso ativo encontrado. Confira se há recursos cadastrados.
                  </small>
                )}
              </div>

              <div className="campo">
                <label>Data</label>
                <input
                  type="date"
                  value={formReserva.data}
                  onChange={(e) =>
                    setFormReserva({ ...formReserva, data: e.target.value })
                  }
                  required
                />
              </div>

              <div className="campo">
                <label>Horário inicial</label>
                <input
                  type="time"
                  value={formReserva.inicio}
                  onChange={(e) =>
                    setFormReserva({ ...formReserva, inicio: e.target.value })
                  }
                  required
                />
              </div>

              <div className="campo">
                <label>Horário final</label>
                <input
                  type="time"
                  value={formReserva.fim}
                  onChange={(e) =>
                    setFormReserva({ ...formReserva, fim: e.target.value })
                  }
                  required
                />
              </div>

              <button className="primario" type="submit">
                Confirmar reserva
              </button>
            </form>
          </div>
        )}

        {secao === 'consultar' && (
          <div className="painel">
            <h2>Consultar reservas</h2>

            <form onSubmit={consultarReservas} className="formulario">
              <div className="campo">
                <label>Tipo de recurso</label>
                <select
                  value={filtros.tipo}
                  onChange={(e) =>
                    setFiltros({ ...filtros, tipo: e.target.value })
                  }
                >
                  <option value="">Todos</option>
                  <option value="sala">Sala de aula</option>
                  <option value="laboratorio">Laboratório</option>
                </select>
              </div>

              <div className="campo">
                <label>Código do recurso</label>
                <input
                  value={filtros.codigo}
                  onChange={(e) =>
                    setFiltros({ ...filtros, codigo: e.target.value })
                  }
                  placeholder="Código"
                />
              </div>

              <div className="campo">
                <label>Data</label>
                <input
                  type="date"
                  value={filtros.data}
                  onChange={(e) =>
                    setFiltros({ ...filtros, data: e.target.value })
                  }
                />
              </div>

              <button className="primario" type="submit">
                Consultar
              </button>

              <button
                className="secundario"
                type="button"
                onClick={() => {
                  setFiltros({ tipo: '', codigo: '', data: '' });
                  setReservas([]);
                  setMensagem('');
                }}
              >
                Limpar filtros
              </button>
            </form>

            <div className="titulo-lista">
              <h2>Resultado</h2>
              <button className="secundario" onClick={() => consultarReservas()}>
                Atualizar
              </button>
            </div>

            {reservas.length === 0 ? (
              <p>Nenhuma reserva para exibir. Faça uma consulta.</p>
            ) : (
              <div className="tabela-container">
                <table>
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Recurso</th>
                      <th>Tipo</th>
                      <th>Data</th>
                      <th>Início</th>
                      <th>Fim</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((r, i) => (
                      <tr key={r.idReserva ?? i}>
                        <td>{r.nomeCompleto || '—'}</td>
                        <td>{r.nomeRecurso || r.codigo || '—'}</td>
                        <td>{r.tipoRecurso || '—'}</td>
                        <td>
                          {r.dataReserva
                            ? String(r.dataReserva).slice(0, 10)
                            : '—'}
                        </td>
                        <td>{r.horarioInicio || '—'}</td>
                        <td>{r.horarioFim || '—'}</td>
                        <td>{r.status || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .pagina {
          min-height: 100vh;
          display: flex;
          background: #f3f5f9;
          color: #202938;
          font-family: Arial, Helvetica, sans-serif;
        }

        .menu {
          width: 250px;
          min-height: 100vh;
          padding: 26px 18px;
          background: #172554;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-shrink: 0;
        }

        .menu h2 {
          font-size: 20px;
          line-height: 1.4;
          margin: 0 0 24px;
        }

        .menu button {
          border: 0;
          padding: 13px 14px;
          border-radius: 8px;
          color: #e5e7eb;
          background: transparent;
          text-align: left;
          font-size: 14px;
          cursor: pointer;
        }

        .menu button:hover {
          background: #293b70;
        }

        .menu .sair {
          margin-top: auto;
          background: #991b1b;
          color: white;
          text-align: center;
        }

        .conteudo {
          flex: 1;
          min-width: 0;
          padding: 30px;
        }

        .cabecalho {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 26px;
        }

        .cabecalho h1 {
          margin: 0 0 8px;
          font-size: 28px;
        }

        .cabecalho p {
          margin: 0;
          color: #64748b;
        }

        .painel {
          background: white;
          padding: 26px;
          border-radius: 14px;
          box-shadow: 0 4px 16px #0f172a0c;
        }

        .painel h2 {
          margin-top: 0;
          font-size: 20px;
        }

        .cartoes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 18px;
          margin-top: 25px;
        }

        .cartao {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          min-height: 150px;
          padding: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          text-align: left;
          cursor: pointer;
          color: #1e293b;
        }

        .cartao:hover {
          border-color: #647de0;
          background: #f1f5ff;
        }

        .cartao span {
          font-size: 26px;
          color: #4338ca;
        }

        .cartao small {
          color: #64748b;
          line-height: 1.5;
        }

        .formulario {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 18px;
          align-items: end;
          margin: 20px 0 28px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo label {
          font-size: 14px;
          font-weight: 600;
        }

        .campo input,
        .campo select {
          width: 100%;
          min-width: 0;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #1e293b;
          font: inherit;
        }

        .campo input:focus,
        .campo select:focus {
          outline: 2px solid #c7d2fe;
          border-color: #6366f1;
        }

        .campo small {
          color: #b45309;
          line-height: 1.4;
        }

        .primario,
        .secundario {
          padding: 12px 16px;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          min-height: 42px;
        }

        .primario {
          background: #4338ca;
          color: white;
        }

        .primario:hover {
          background: #3730a3;
        }

        .secundario {
          background: #e2e8f0;
          color: #1e293b;
        }

        .secundario:hover {
          background: #cbd5e1;
        }

        .mensagem {
          margin-bottom: 20px;
          padding: 14px 16px;
          border-radius: 8px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          color: #312e81;
          overflow-wrap: anywhere;
        }

        .titulo-lista {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .titulo-lista h2 {
          margin: 0;
        }

        .tabela-container {
          width: 100%;
          overflow-x: auto;
          margin-top: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 650px;
        }

        th,
        td {
          padding: 13px 12px;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
          font-size: 14px;
        }

        th {
          background: #f8fafc;
          color: #475569;
        }

        @media (max-width: 760px) {
          .pagina {
            flex-direction: column;
          }

          .menu {
            width: 100%;
            min-height: auto;
          }

          .menu .sair {
            margin-top: 8px;
          }

          .conteudo {
            padding: 18px;
          }

          .painel {
            padding: 18px;
          }

          .cabecalho h1 {
            font-size: 23px;
          }
        }
      `}</style>
    </main>
  );
}
