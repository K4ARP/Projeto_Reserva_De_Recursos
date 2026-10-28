// frontend/app/consultar-reservas/page.tsx  (REESCRITO)
//
// Página de CONSULTAR RESERVAS.
// Problemas da versão antiga que foram corrigidos:
//  - chamava /reservas sem enviar o token (o Node respondia 401);
//  - enviava filtros que o Node não entende (horario/usuario/recurso).
// Agora chama GET /consulta-reservas, a rota feita para esta tela, com o
// token e os filtros: data, horario, usuario e tipoRecurso.
'use client';

import { useState, type FormEvent } from 'react';
import LayoutPainel from '../components/LayoutPainel';
import styles from '../components/painel.module.css';
import { API, obterToken, lerResposta, extrairLista } from '../lib/api';

// Formato de cada reserva devolvida pelo Node
type Reserva = {
  idReserva: number;
  nomeUsuario: string;
  dataReserva: string;
  horarioInicio: string;
  horarioFim: string;
  nomeStatus: string;
  tipoRecurso: string;
  nomeRecurso: string;
};

const filtrosVazios = { data: '', horario: '', usuario: '', tipo: '' };

// Transforma "2026-10-30T00:00:00.000Z" em "30/10/2026"
function formatarData(valor?: string) {
  if (!valor) return '—';
  const [ano, mes, dia] = valor.substring(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

export default function ConsultarReservas() {
  const [filtros, setFiltros] = useState(filtrosVazios);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);

  // Atualiza um filtro
  function alterar(campo: string, valor: string) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
  }

  // Envia os filtros para o Node e mostra o resultado
  async function pesquisar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem('');

    // A rota exige login
    const token = obterToken();
    if (!token) {
      setMensagem('Faça login para consultar as reservas.');
      return;
    }

    setCarregando(true);
    setPesquisou(true);

    try {
      // Só envia os filtros preenchidos
      const parametros = new URLSearchParams();
      if (filtros.data) parametros.set('data', filtros.data);
      if (filtros.horario) parametros.set('horario', filtros.horario);
      if (filtros.usuario.trim()) parametros.set('usuario', filtros.usuario.trim());
      if (filtros.tipo) parametros.set('tipoRecurso', filtros.tipo);

      const resposta = await fetch(
        `${API}/consulta-reservas?${parametros.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const dados = await lerResposta(resposta);
      setReservas(extrairLista(dados) as Reserva[]);
    } catch (erro) {
      setReservas([]);
      setMensagem(
        erro instanceof Error
          ? `Erro ao consultar reservas: ${erro.message}`
          : 'Erro ao consultar reservas.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // Limpa filtros e resultado
  function limpar() {
    setFiltros(filtrosVazios);
    setReservas([]);
    setMensagem('');
    setPesquisou(false);
  }

  return (
    <LayoutPainel titulo="Consultar Reservas" mensagem={mensagem}>
      <section className={styles.painel}>
        <h2>Filtros</h2>

        <form onSubmit={pesquisar}>
          <div className={styles.formulario}>
            <div className={styles.campo}>
              <label htmlFor="data">Data</label>
              <input
                id="data"
                type="date"
                value={filtros.data}
                onChange={(e) => alterar('data', e.target.value)}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="horario">Horário</label>
              <input
                id="horario"
                type="time"
                value={filtros.horario}
                onChange={(e) => alterar('horario', e.target.value)}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="usuario">Usuário</label>
              <input
                id="usuario"
                placeholder="Nome do usuário"
                value={filtros.usuario}
                onChange={(e) => alterar('usuario', e.target.value)}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="tipo">Tipo de recurso</label>
              <select
                id="tipo"
                value={filtros.tipo}
                onChange={(e) => alterar('tipo', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="sala">Sala de Aula</option>
                <option value="laboratorio">Laboratório</option>
              </select>
            </div>
          </div>

          <button type="submit" className={styles.primario} disabled={carregando}>
            {carregando ? 'Pesquisando...' : 'Pesquisar'}
          </button>{' '}
          <button type="button" className={styles.secundario} onClick={limpar}>
            Limpar filtros
          </button>
        </form>

        <div className={styles.tituloLista}>
          <h2>Reservas encontradas</h2>
        </div>

        <div className={styles.tabelaContainer}>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Recurso</th>
                <th>Tipo</th>
                <th>Usuário</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {reservas.map((r) => (
                <tr key={r.idReserva}>
                  <td>{formatarData(r.dataReserva)}</td>
                  <td>
                    {r.horarioInicio} às {r.horarioFim}
                  </td>
                  <td>{r.nomeRecurso}</td>
                  <td>{r.tipoRecurso}</td>
                  <td>{r.nomeUsuario}</td>
                  <td>{r.nomeStatus}</td>
                </tr>
              ))}

              {reservas.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    {carregando
                      ? 'Carregando reservas...'
                      : pesquisou && !mensagem
                        ? 'Nenhuma reserva encontrada.'
                        : 'Use os filtros e clique em Pesquisar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </LayoutPainel>
  );
}
