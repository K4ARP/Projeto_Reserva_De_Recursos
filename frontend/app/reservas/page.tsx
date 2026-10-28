// frontend/app/reservas/page.tsx  (REESCRITO)
//
// Página de FAZER UMA RESERVA (antes esse código ficava dentro da página
// principal, e esta página era uma consulta antiga que nem funcionava).
//
// Como funciona:
//  1. O usuário escolhe tipo (sala/laboratório), data, início e fim.
//  2. A página pergunta ao Node quais recursos estão LIVRES nesse horário
//     (GET /reservas/disponiveis). Só eles aparecem na lista.
//  3. Ao clicar em Reservar, envia POST /reservas com o token de login.
//  4. Depois de reservar, a lista é buscada de novo: o recurso reservado
//     some da lista, porque já não está mais disponível nesse horário.
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import LayoutPainel from '../components/LayoutPainel';
import styles from '../components/painel.module.css';
import { API, obterToken, lerResposta, extrairLista } from '../lib/api';

type TipoRecurso = 'sala' | 'laboratorio';

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

export default function Reservas() {
  // Campos do formulário
  const [form, setForm] = useState({
    tipo: 'sala' as TipoRecurso,
    codigo: '',
    data: '',
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
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
  }

  // Busca os recursos livres sempre que tipo, data ou horários mudam
  // (e também quando "atualizacao" muda, depois de uma reserva).
  useEffect(() => {
    // Falta informação: não há o que buscar ainda
    if (!form.data || !form.inicio || !form.fim) {
      setDisponiveis([]);
      setAviso('Informe a data e os horários para ver os recursos livres.');
      return;
    }

    // Data com ano errado (ex.: 22026) ou no passado: não consulta o Node
    const erroData = validarData(form.data);
    if (erroData) {
      setDisponiveis([]);
      setAviso(erroData);
      return;
    }

    if (form.inicio >= form.fim) {
      setDisponiveis([]);
      setAviso('O horário final deve ser posterior ao inicial.');
      return;
    }

    // "cancelado" evita atualizar a tela com uma resposta antiga
    let cancelado = false;

    async function carregarDisponiveis() {
      setCarregando(true);
      setAviso('');

      try {
        const parametros = new URLSearchParams({
          tipo: form.tipo,
          data: form.data,
          inicio: form.inicio,
          fim: form.fim,
        });

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
          setAviso('Nenhum recurso livre nesse dia e horário.');
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
  }, [form.tipo, form.data, form.inicio, form.fim, atualizacao]);

  // Envia a reserva para o Node
  async function enviarReserva(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem('');

    if (!form.codigo || !form.data || !form.inicio || !form.fim) {
      setMensagem('Preencha todos os campos da reserva.');
      return;
    }

    // Confere a data antes de enviar
    const erroData = validarData(form.data);
    if (erroData) {
      setMensagem(erroData);
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
        body: JSON.stringify({
          tipo: form.tipo,
          codigo: form.codigo,
          data: form.data,
          inicio: form.inicio,
          fim: form.fim,
        }),
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
              <label htmlFor="data">Data</label>
              <input
                id="data"
                type="date"
                min={dataDeHoje()}
                max="2100-12-31"
                value={form.data}
                onChange={(e) => alterar('data', e.target.value)}
              />
            </div>

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
            </div>

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
