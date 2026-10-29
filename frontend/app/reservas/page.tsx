// frontend/app/reservas/page.tsx
//
// Página de FAZER UMA RESERVA. Há dois tipos de reserva:
//
//  POR HORÁRIO: um dia, de uma hora até outra.
//     Se a hora final for MENOR que a inicial, a reserva termina no dia
//     seguinte (ex.: 23:00 até 05:00 = da noite até a madrugada).
//
//  POR DIAS: do dia inicial ao dia final (inclusive), DIA INTEIRO.
//     Aqui não faz sentido escolher horário, então os campos de hora
//     não aparecem.
//
// Como funciona:
//  1. O usuário escolhe o tipo de recurso, o tipo de reserva e o período.
//  2. A página pergunta ao Node quais recursos estão LIVRES nesse período
//     (GET /reservas/disponiveis). Só eles aparecem na lista.
//  3. Ao clicar em Reservar, envia POST /reservas com o token de login
//     (o Node descobre quem é o usuário pelo token).
//  4. Depois de reservar, a lista é buscada de novo: o recurso reservado
//     some da lista, porque não está mais disponível nesse período.
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import LayoutPainel from '../components/LayoutPainel';
import styles from '../components/painel.module.css';
import { API, obterToken, lerResposta, extrairLista } from '../lib/api';

type TipoRecurso = 'sala' | 'laboratorio';
type ModoReserva = 'horario' | 'dias';

// Formato de cada recurso devolvido por /reservas/disponiveis
type RecursoDisponivel = {
  codigo: number | string;
  nome: string;
  capacidade: number;
  localizacao: string;
};

// Devolve a data de hoje no formato AAAA-MM-DD (usado como data mínima)
function dataDeHoje() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Confere se a data é válida: ano com 4 dígitos e de hoje em diante.
// (O campo de data do navegador deixa digitar anos com 5 ou 6 dígitos,
// como 22026, e isso fazia o Node recusar a consulta.)
// Devolve o texto do erro, ou '' se estiver tudo certo.
function validarData(data: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return 'Data inválida. Digite o ano com 4 dígitos.';
  }
  if (data < dataDeHoje()) {
    return 'Escolha uma data de hoje em diante.';
  }
  return '';
}

// "2026-11-10" -> "11/11/2026" (o dia seguinte, para o aviso da madrugada)
function diaSeguinteFormatado(data: string) {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const [ano, mes, dia] = d.toISOString().slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function Reservas() {
  // Campos do formulário
  const [form, setForm] = useState({
    tipo: 'sala' as TipoRecurso,
    modo: 'horario' as ModoReserva,
    codigo: '',
    data: '',
    dataFinal: '',
    inicio: '',
    fim: '',
  });

  const [disponiveis, setDisponiveis] = useState<RecursoDisponivel[]>([]);
  const [mensagem, setMensagem] = useState('');   // resultado do envio
  const [aviso, setAviso] = useState('');         // aviso sobre a lista
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Nome do usuário logado, só para exibir. Quem identifica o usuário
  // de verdade é o token enviado ao Node (o id vem dele, não da tela).
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

  // Contador que força a lista a ser buscada de novo (usado após reservar)
  const [atualizacao, setAtualizacao] = useState(0);

  // Atualiza um campo do formulário
  function alterar(campo: string, valor: string) {
    setForm((anterior) => {
      const novo = { ...anterior, [campo]: valor };

      // Trocar o tipo de reserva limpa o recurso escolhido
      if (campo === 'modo') novo.codigo = '';

      // Se a data inicial passar da final, a final acompanha
      if (campo === 'data' && novo.dataFinal && novo.dataFinal < valor) {
        novo.dataFinal = valor;
      }

      return novo;
    });
  }

  // Madrugada: reserva por horário com hora final menor que a inicial
  const viraNoite =
    form.modo === 'horario' && !!form.inicio && !!form.fim && form.fim < form.inicio;

  // Parâmetros que descrevem o período escolhido (iguais para consultar e reservar)
  function montarParametros() {
    const parametros: Record<string, string> = {
      tipo: form.tipo,
      modo: form.modo,
      data: form.data,
    };

    if (form.modo === 'dias') {
      parametros.dataFinal = form.dataFinal;
    } else {
      parametros.inicio = form.inicio;
      parametros.fim = form.fim;
    }

    return parametros;
  }

  // Confere o período. Devolve o texto do erro, ou '' se estiver tudo certo.
  function validarPeriodo() {
    if (!form.data) return 'Informe a data.';

    const erroData = validarData(form.data);
    if (erroData) return erroData;

    if (form.modo === 'dias') {
      if (!form.dataFinal) return 'Informe a data final.';

      const erroFinal = validarData(form.dataFinal);
      if (erroFinal) return erroFinal;

      if (form.dataFinal < form.data) {
        return 'A data final não pode ser anterior à data inicial.';
      }

      return '';
    }

    if (!form.inicio || !form.fim) return 'Informe o horário inicial e o final.';

    if (form.inicio === form.fim) {
      return 'O horário final deve ser diferente do inicial.';
    }

    return '';
  }

  // Busca os recursos livres sempre que o período muda
  // (e também quando "atualizacao" muda, depois de uma reserva).
  useEffect(() => {
    const erroPeriodo = validarPeriodo();

    // Período incompleto ou inválido: não consulta o Node
    if (erroPeriodo) {
      setDisponiveis([]);
      setAviso(
        erroPeriodo.startsWith('Informe')
          ? 'Informe o período da reserva para ver os recursos livres.'
          : erroPeriodo
      );
      return;
    }

    // "cancelado" evita atualizar a tela com uma resposta antiga
    let cancelado = false;

    async function carregarDisponiveis() {
      setCarregando(true);
      setAviso('');

      try {
        const parametros = new URLSearchParams(montarParametros());

        // cache: 'no-store' = sempre buscar o dado atual no Node,
        // para o recurso recém-reservado sumir da lista.
        const resposta = await fetch(
          `${API}/reservas/disponiveis?${parametros.toString()}`,
          { cache: 'no-store' }
        );
        const dados = await lerResposta(resposta);

        if (cancelado) return;

        const lista = extrairLista(dados) as RecursoDisponivel[];
        setDisponiveis(lista);

        // Se o recurso escolhido deixou de estar livre, desmarca
        setForm((anterior) =>
          lista.some((r) => String(r.codigo) === anterior.codigo)
            ? anterior
            : { ...anterior, codigo: '' }
        );

        if (lista.length === 0) {
          setAviso('Nenhum recurso livre nesse período.');
        }
      } catch (erro) {
        if (cancelado) return;
        setDisponiveis([]);
        setAviso(
          erro instanceof Error
            ? `Não foi possível consultar os recursos: ${erro.message}`
            : 'Não foi possível consultar os recursos.'
        );
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarDisponiveis();

    return () => {
      cancelado = true;
    };
  }, [
    form.tipo,
    form.modo,
    form.data,
    form.dataFinal,
    form.inicio,
    form.fim,
    atualizacao,
  ]);

  // Envia a reserva para o Node
  async function enviarReserva(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem('');

    if (!form.codigo) {
      setMensagem('Selecione o recurso que deseja reservar.');
      return;
    }

    // Confere o período antes de enviar
    const erroPeriodo = validarPeriodo();
    if (erroPeriodo) {
      setMensagem(erroPeriodo);
      return;
    }

    // O token prova quem é o usuário; o Node pega o id dele a partir dele
    const token = obterToken();
    if (!token) {
      setMensagem('Faça login antes de reservar um recurso.');
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch(`${API}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...montarParametros(), codigo: form.codigo }),
      });

      const dados = await lerResposta(resposta);
      setMensagem(dados.mensagem || 'Reserva cadastrada com sucesso!');

      // Limpa o recurso escolhido e busca a lista de novo:
      // o recurso recém-reservado não aparece mais como disponível.
      setForm((anterior) => ({ ...anterior, codigo: '' }));
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? `Erro ao reservar: ${erro.message}`
          : 'Erro ao cadastrar reserva.'
      );
    } finally {
      setEnviando(false);
      setAtualizacao((n) => n + 1); // atualiza a lista em qualquer caso
    }
  }

  return (
    <LayoutPainel titulo="Reservar" mensagem={mensagem}>
      <section className={styles.painel}>
        <h2>Nova reserva</h2>

        <form onSubmit={enviarReserva}>
          <div className={styles.formulario}>
            {/* Preenchido automaticamente pelo login; não dá para editar */}
            <div className={styles.campo}>
              <label htmlFor="usuario">Usuário</label>
              <input
                id="usuario"
                value={usuarioLogado || 'Faça login para reservar'}
                readOnly
                disabled
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="tipo">Tipo de recurso</label>
              <select
                id="tipo"
                value={form.tipo}
                onChange={(e) => alterar('tipo', e.target.value)}
              >
                <option value="sala">Sala de Aula</option>
                <option value="laboratorio">Laboratório</option>
              </select>
            </div>

            <div className={styles.campo}>
              <label htmlFor="modo">Tipo de reserva</label>
              <select
                id="modo"
                value={form.modo}
                onChange={(e) => alterar('modo', e.target.value)}
              >
                <option value="horario">Por horário (um dia)</option>
                <option value="dias">Por dias (dia inteiro)</option>
              </select>
            </div>

            <div className={styles.campo}>
              <label htmlFor="data">
                {form.modo === 'dias' ? 'Data inicial' : 'Data'}
              </label>
              <input
                id="data"
                type="date"
                min={dataDeHoje()}
                max="2100-12-31"
                value={form.data}
                onChange={(e) => alterar('data', e.target.value)}
              />
            </div>

            {/* Por dias: data final (sem horários, a reserva é de dia inteiro) */}
            {form.modo === 'dias' && (
              <div className={styles.campo}>
                <label htmlFor="dataFinal">Data final</label>
                <input
                  id="dataFinal"
                  type="date"
                  min={form.data || dataDeHoje()}
                  max="2100-12-31"
                  value={form.dataFinal}
                  onChange={(e) => alterar('dataFinal', e.target.value)}
                />
                <small>Reserva de dia inteiro, da data inicial até a final.</small>
              </div>
            )}

            {/* Por horário: hora inicial e final */}
            {form.modo === 'horario' && (
              <>
                <div className={styles.campo}>
                  <label htmlFor="inicio">Início</label>
                  <input
                    id="inicio"
                    type="time"
                    value={form.inicio}
                    onChange={(e) => alterar('inicio', e.target.value)}
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="fim">Fim</label>
                  <input
                    id="fim"
                    type="time"
                    value={form.fim}
                    onChange={(e) => alterar('fim', e.target.value)}
                  />
                  {viraNoite && form.data && (
                    <small>
                      Termina no dia seguinte ({diaSeguinteFormatado(form.data)}).
                    </small>
                  )}
                </div>
              </>
            )}

            <div className={styles.campo}>
              <label htmlFor="codigo">Recurso disponível</label>
              <select
                id="codigo"
                value={form.codigo}
                onChange={(e) => alterar('codigo', e.target.value)}
                disabled={carregando || disponiveis.length === 0}
              >
                <option value="">
                  {carregando ? 'Buscando...' : 'Selecione'}
                </option>

                {disponiveis.map((r) => (
                  <option key={String(r.codigo)} value={String(r.codigo)}>
                    {r.nome} — {r.capacidade} lugares — {r.localizacao}
                  </option>
                ))}
              </select>

              {/* Explica por que a lista está vazia */}
              {aviso && <small>{aviso}</small>}
            </div>
          </div>

          <button
            type="submit"
            className={styles.primario}
            disabled={enviando || carregando}
          >
            {enviando ? 'Reservando...' : 'Reservar'}
          </button>
        </form>
      </section>
    </LayoutPainel>
  );
}
