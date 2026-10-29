// frontend/app/components/GerenciarRecurso.tsx
//
// Tela de cadastro de RECURSOS (sala de aula e laboratório). É usada por
// três páginas, para não repetir código:
//   /cadastrar-recurso      -> as duas coisas (tem o campo "Tipo")
//   /cadastro-sala          -> só salas        (tipoFixo="sala")
//   /cadastro-laboratorio   -> só laboratórios (tipoFixo="laboratorio")
//
// Faz: cadastrar (POST /recursos/:tipo), listar (GET /recursos/:tipo)
// e ativar/desativar (PATCH /recursos/:tipo/:codigo/ativo).
// Só recursos ATIVOS aparecem para reserva.
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import LayoutPainel from './LayoutPainel';
import styles from './painel.module.css';
import { API, LIMITES, lerResposta, extrairLista, somenteDigitos } from '../lib/api';

type TipoRecurso = 'sala' | 'laboratorio';

type Recurso = {
  codigo: string;
  nome: string;
  capacidade: number;
  localizacao: string;
  ativo: boolean;
};

type Props = {
  titulo: string;
  tipoFixo?: TipoRecurso; // se vier preenchido, o campo "Tipo" some
};

const formVazio = { codigo: '', nome: '', capacidade: '', localizacao: '' };

export default function GerenciarRecurso({ titulo, tipoFixo }: Props) {
  const [tipo, setTipo] = useState<TipoRecurso>(tipoFixo ?? 'sala');
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [form, setForm] = useState(formVazio);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Busca no Node a lista de salas ou laboratórios
  async function carregarRecursos(tipoAtual: TipoRecurso = tipo) {
    setCarregando(true);

    try {
      const resposta = await fetch(`${API}/recursos/${tipoAtual}`, {
        cache: 'no-store',
      });
      const dados = await lerResposta(resposta);

      // Padroniza os campos recebidos
      setRecursos(
        extrairLista(dados).map((r: any) => ({
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

  // Recarrega a lista quando o tipo muda (e ao abrir a página)
  useEffect(() => {
    setMensagem('');
    carregarRecursos(tipo);
  }, [tipo]);

  // Atualiza um campo do formulário, respeitando os limites de tamanho
  function alterar(campo: string, valor: string) {
    let novo = valor;

    // código e capacidade: só números, com tamanho máximo
    if (campo === 'codigo') novo = somenteDigitos(valor).slice(0, LIMITES.codigoRecurso);
    if (campo === 'capacidade') novo = somenteDigitos(valor).slice(0, LIMITES.capacidade);

    setForm((anterior) => ({ ...anterior, [campo]: novo }));
  }

  // Cadastra um recurso novo
  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem('');

    if (
      !form.codigo ||
      !form.nome.trim() ||
      !form.capacidade ||
      !form.localizacao.trim()
    ) {
      setMensagem('Preencha todos os campos do recurso.');
      return;
    }

    if (Number(form.codigo) <= 0 || Number(form.capacidade) <= 0) {
      setMensagem('Código e capacidade devem ser maiores que zero.');
      return;
    }

    try {
      const resposta = await fetch(`${API}/recursos/${tipo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: Number(form.codigo),
          nome: form.nome.trim(),
          capacidade: Number(form.capacidade),
          localizacao: form.localizacao.trim(),
          ativo: true,
        }),
      });

      const dados = await lerResposta(resposta);
      setMensagem(dados.mensagem || 'Recurso cadastrado com sucesso!');
      setForm(formVazio);
      await carregarRecursos(tipo);
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? `Erro ao cadastrar recurso: ${erro.message}`
          : 'Erro ao cadastrar recurso.'
      );
    }
  }

  // Liga/desliga um recurso (ativo <-> inativo)
  async function alterarAtivo(recurso: Recurso) {
    setMensagem('');

    try {
      const resposta = await fetch(
        `${API}/recursos/${tipo}/${encodeURIComponent(recurso.codigo)}/ativo`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ativo: !recurso.ativo }),
        }
      );

      const dados = await lerResposta(resposta);
      setMensagem(dados.mensagem || 'Status do recurso atualizado.');
      await carregarRecursos(tipo);
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? `Erro ao alterar recurso: ${erro.message}`
          : 'Erro ao alterar o recurso.'
      );
    }
  }

  const nomeDoTipo = tipo === 'sala' ? 'sala de aula' : 'laboratório';

  return (
    <LayoutPainel titulo={titulo} mensagem={mensagem}>
      <section className={styles.painel}>
        <h2>Novo recurso</h2>

        <form onSubmit={cadastrar}>
          <div className={styles.formulario}>
            {/* O campo Tipo só aparece na página que cadastra os dois tipos */}
            {!tipoFixo && (
              <div className={styles.campo}>
                <label htmlFor="tipo">Tipo</label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoRecurso)}
                >
                  <option value="sala">Sala de Aula</option>
                  <option value="laboratorio">Laboratório</option>
                </select>
              </div>
            )}

            <div className={styles.campo}>
              <label htmlFor="codigo">Código</label>
              <input
                id="codigo"
                inputMode="numeric"
                placeholder="Ex: 201"
                maxLength={LIMITES.codigoRecurso}
                value={form.codigo}
                onChange={(e) => alterar('codigo', e.target.value)}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                placeholder={`Nome da ${nomeDoTipo}`}
                maxLength={LIMITES.nomeRecurso}
                value={form.nome}
                onChange={(e) => alterar('nome', e.target.value)}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="capacidade">Capacidade</label>
              <input
                id="capacidade"
                inputMode="numeric"
                placeholder="Ex: 40"
                maxLength={LIMITES.capacidade}
                value={form.capacidade}
                onChange={(e) => alterar('capacidade', e.target.value)}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="localizacao">Localização</label>
              <input
                id="localizacao"
                placeholder="Ex: Bloco A - Térreo"
                maxLength={LIMITES.localizacao}
                value={form.localizacao}
                onChange={(e) => alterar('localizacao', e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className={styles.primario}>
            Cadastrar
          </button>
        </form>

        <div className={styles.tituloLista}>
          <h2>{tipo === 'sala' ? 'Salas de aula' : 'Laboratórios'}</h2>
          <button
            type="button"
            className={styles.secundario}
            onClick={() => carregarRecursos(tipo)}
          >
            Atualizar lista
          </button>
        </div>

        <div className={styles.tabelaContainer}>
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
                      type="button"
                      className={styles.secundario}
                      onClick={() => alterarAtivo(r)}
                    >
                      {r.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}

              {recursos.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    {carregando ? 'Carregando...' : 'Nenhum recurso cadastrado.'}
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
