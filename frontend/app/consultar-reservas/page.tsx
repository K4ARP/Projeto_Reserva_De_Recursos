// frontend/app/consultar-reservas/page.tsx
//
// Página de CONSULTAR RESERVAS, com os filtros pedidos no enunciado:
// data ou período, horário, usuário, recurso (código ou nome),
// tipo de recurso.// Chama GET /consulta-reservas, que exige o token de login.
// A consulta é SEMPRE das reservas do usuário logado: o Node descobre quem
// é pelo token, então não existe campo para digitar outro usuário.
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import LayoutPainel from '../components/LayoutPainel';
import styles from '../components/painel.module.css';
import { API, LIMITES, obterToken, lerResposta, extrairLista } from '../lib/api';

// Formato de cada reserva devolvida pelo Node
type Reserva = {
  idReserva: number;
  nomeUsuario: string;
  dataReserva: string;
  dataFim: string;
  horarioInicio: string;
  horarioFim: string;
  nomeStatus: string;
  tipoRecurso: string;
  codigoRecurso: number;
  nomeRecurso: string;
};


const filtrosVazios = {
  data: '',
  dataFinal: '',
  horario: '',
  recurso: '',
  tipo: '',
};

// Transforma "2026-10-30" em "30/10/2026"
function formatarData(valor?: string) {
  if (!valor) return '—';
  const [ano, mes, dia] = valor.substring(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

// Período da reserva: um dia ("10/11/2026") ou vários dias
// ("10/11/2026 até 14/11/2026")
function formatarPeriodo(r: Reserva) {
  const inicio = formatarData(r.dataReserva);
  return r.dataFim && r.dataFim !== r.dataReserva
    ? `${inicio} até ${formatarData(r.dataFim)}`
    : inicio;
}

// Horário da reserva: "Dia inteiro", "08:00 às 10:00" ou, quando vira a
// noite, "23:00 às 05:00 (dia seguinte)"
function formatarHorario(r: Reserva) {
  if (r.horarioInicio === '00:00' && r.horarioFim === '23:59') {
    return 'Dia inteiro';
  }

  const viraNoite = r.dataFim && r.dataFim > r.dataReserva;
  return `${r.horarioInicio} às ${r.horarioFim}${viraNoite ? ' (dia seguinte)' : ''}`;
}

export default function ConsultarReservas() {
  const [filtros, setFiltros] = useState(filtrosVazios);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);

  // Nome do usuário logado (só para exibir, o Node usa o token)
  const [usuarioLogado, setUsuarioLogado] = useState('');

  useEffect(() => {
    try {
      const salvo = localStorage.getItem('usuario');
      if (salvo) {
        const usuario = JSON.parse(salvo);
        setUsuarioLogado(usuario.nomeCompleto || usuario.login || '');
      }
    } catch {
      setUsuarioLogado('');
    }
  }, []);

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

    // Período: a data final precisa de uma data inicial
    if (filtros.dataFinal && !filtros.data) {
      setMensagem('Informe a data inicial do período.');
      return;
    }

    if (filtros.dataFinal && filtros.dataFinal < filtros.data) {
      setMensagem('A data final não pode ser anterior à data inicial.');
      return;
    }

    setCarregando(true);
    setPesquisou(true);

    try {
      // Só envia os filtros preenchidos
      const parametros = new URLSearchParams();
      if (filtros.data) parametros.set('data', filtros.data);
      if (filtros.dataFinal) parametros.set('dataFinal', filtros.dataFinal);
      if (filtros.horario) parametros.set('horario', filtros.horario);
      if (filtros.recurso.trim()) parametros.set('recurso', filtros.recurso.trim());
      if (filtros.tipo) parametros.set('tipoRecurso', filtros.tipo);

      const resposta = await fetch(
        `${API}/consulta-reservas?${parametros.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
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
              <label htmlFor="data">Data (ou início do período)</label>
              <input
                id="data"
                type="date"
                min="2000-01-01"
                max="2100-12-31"
                value={filtros.data}
                onChange={(e) => alterar('data', e.target.value)}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="dataFinal">Data final do período</label>
              <input
                id="dataFinal"
                type="date"
                min="2000-01-01"
                max="2100-12-31"
                value={filtros.dataFinal}
                onChange={(e) => alterar('dataFinal', e.target.value)}
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

            {/* Preenchido automaticamente pelo login; não dá para editar */}
            <div className={styles.campo}>
              <label htmlFor="usuario">Usuário</label>
              <input
                id="usuario"
                value={usuarioLogado || 'Faça login para consultar'}
                readOnly
                disabled
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="recurso">Recurso (código ou nome)</label>
              <input
                id="recurso"
                placeholder="Ex: 201 ou Laboratório 1"
                maxLength={LIMITES.nomeRecurso}
                value={filtros.recurso}
                onChange={(e) => alterar('recurso', e.target.value)}
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
                <th>Data / período</th>
                <th>Horário</th>
                <th>Código</th>
                <th>Recurso</th>
                <th>Tipo</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {reservas.map((r) => (
                <tr key={r.idReserva}>
                  <td>{formatarPeriodo(r)}</td>
                  <td>{formatarHorario(r)}</td>
                  <td>{r.codigoRecurso}</td>
                  <td>{r.nomeRecurso}</td>
                  <td>{r.tipoRecurso}</td>
                  <td>{r.nomeStatus}</td>
                </tr>
              ))}

              {reservas.length === 0 && (
                <tr>
                  <td colSpan={5}>
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

