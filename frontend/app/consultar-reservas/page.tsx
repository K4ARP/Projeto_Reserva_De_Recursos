'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

const API = 'http://localhost:8080';

type Filtros = {
    data: string;
    horario: string;
    usuario: string;
    recurso: string;
};

type Reserva = {
    id?: number;
    idReserva?: number;
    codigo?: number;
    data?: string;
    dataReserva?: string;
    horario?: string;
    horarioInicio?: string;
    horarioFim?: string;
    recurso?: string;
    nomeRecurso?: string;
    usuario?: string;
    nomeUsuario?: string;
    status?: string;
};

export default function ConsultarReservas() {
    const [filtros, setFiltros] = useState<Filtros>({
        data: '',
        horario: '',
        usuario: '',
        recurso: 'Todos',
    });

    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [pesquisou, setPesquisou] = useState(false);
    const [mensagem, setMensagem] = useState('');

    function alterarFiltro(
        campo: keyof Filtros,
        valor: string
    ) {
        setFiltros((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
    }

    async function handlePesquisar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();

        setCarregando(true);
        setMensagem('');
        setPesquisou(true);

        try {
            const parametros = new URLSearchParams();

            if (filtros.data) {
                parametros.set('data', filtros.data);
            }

            if (filtros.horario) {
                parametros.set('horario', filtros.horario);
            }

            if (filtros.usuario.trim()) {
                parametros.set('usuario', filtros.usuario.trim());
            }

            if (filtros.recurso !== 'Todos') {
                parametros.set('recurso', filtros.recurso);
            }

            const resposta = await fetch(
                `${API}/reservas?${parametros.toString()}`
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.mensagem ||
                    `Erro HTTP ${resposta.status}.`
                );
            }

            if (!Array.isArray(resultado)) {
                throw new Error(
                    'A API não retornou uma lista de reservas.'
                );
            }

            setReservas(resultado);
        } catch (erro) {
            setReservas([]);

            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Não foi possível consultar as reservas.'
            );
        } finally {
            setCarregando(false);
        }
    }

    function formatarData(valor?: string) {
        if (!valor) return '—';

        const data = valor.substring(0, 10);

        if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }

        return valor;
    }

    function formatarHorario(reserva: Reserva) {
        if (reserva.horario) return reserva.horario;

        if (reserva.horarioInicio || reserva.horarioFim) {
            return `${reserva.horarioInicio || '--:--'} às ${
                reserva.horarioFim || '--:--'
            }`;
        }

        return '—';
    }

    function nomeRecurso(reserva: Reserva) {
        return reserva.nomeRecurso || reserva.recurso || '—';
    }

    function nomeUsuario(reserva: Reserva) {
        return reserva.nomeUsuario || reserva.usuario || '—';
    }

    function identificador(reserva: Reserva, indice: number) {
        return reserva.idReserva ?? reserva.id ?? reserva.codigo ?? indice;
    }

    return (
        <main className="pagina">
            <header className="cabecalho">
                <div>
                    <h1>Consultar Reservas</h1>
                    <p>Consulte as reservas de salas e laboratórios.</p>
                </div>

                <Link href="/principal" className="botao-voltar">
                    Voltar à Página Principal
                </Link>
            </header>

            <section className="painel">
                <h2>Filtros de pesquisa</h2>

                <form onSubmit={handlePesquisar}>
                    <div className="filtros">
                        <label>
                            Data
                            <input
                                type="date"
                                value={filtros.data}
                                onChange={(evento) =>
                                    alterarFiltro('data', evento.target.value)
                                }
                            />
                        </label>

                        <label>
                            Horário
                            <input
                                type="time"
                                value={filtros.horario}
                                onChange={(evento) =>
                                    alterarFiltro('horario', evento.target.value)
                                }
                            />
                        </label>

                        <label>
                            Usuário
                            <input
                                type="text"
                                placeholder="Nome do usuário"
                                value={filtros.usuario}
                                onChange={(evento) =>
                                    alterarFiltro('usuario', evento.target.value)
                                }
                            />
                        </label>

                        <label>
                            Tipo de recurso
                            <select
                                value={filtros.recurso}
                                onChange={(evento) =>
                                    alterarFiltro('recurso', evento.target.value)
                                }
                            >
                                <option value="Todos">Todos</option>
                                <option value="Sala de Aula">
                                    Sala de Aula
                                </option>
                                <option value="Laboratório">
                                    Laboratório
                                </option>
                            </select>
                        </label>
                    </div>

                    <div className="acoes">
                        <button type="submit" disabled={carregando}>
                            {carregando ? 'Pesquisando...' : 'Pesquisar'}
                        </button>

                        <button
                            type="button"
                            className="botao-limpar"
                            onClick={() => {
                                setFiltros({
                                    data: '',
                                    horario: '',
                                    usuario: '',
                                    recurso: 'Todos',
                                });
                                setReservas([]);
                                setMensagem('');
                                setPesquisou(false);
                            }}
                        >
                            Limpar filtros
                        </button>
                    </div>
                </form>
            </section>

            {mensagem && (
                <div className="mensagem erro" role="alert">
                    {mensagem}
                </div>
            )}

            <section className="painel">
                <h2>Reservas encontradas</h2>

                <div className="tabela-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Recurso</th>
                                <th>Usuário</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {reservas.map((reserva, indice) => (
                                <tr key={identificador(reserva, indice)}>
                                    <td>
                                        {formatarData(
                                            reserva.dataReserva || reserva.data
                                        )}
                                    </td>
                                    <td>{formatarHorario(reserva)}</td>
                                    <td>{nomeRecurso(reserva)}</td>
                                    <td>{nomeUsuario(reserva)}</td>
                                    <td>
                                        <span className="status">
                                            {reserva.status || '—'}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {reservas.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="vazio">
                                        {carregando
                                            ? 'Carregando reservas...'
                                            : pesquisou && !mensagem
                                              ? 'Nenhuma reserva encontrada.'
                                              : 'Utilize os filtros e clique em Pesquisar.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <style jsx>{`
                * {
                    box-sizing: border-box;
                }

                .pagina {
                    min-height: 100vh;
                    padding: 32px;
                    background: #101010;
                    color: #f5f5f5;
                    font-family: Arial, Helvetica, sans-serif;
                }

                .cabecalho {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    flex-wrap: wrap;
                    margin-bottom: 28px;
                }

                h1 {
                    margin: 0 0 8px;
                    font-size: 30px;
                }

                h2 {
                    margin: 0 0 22px;
                    font-size: 21px;
                }

                p {
                    margin: 0;
                    color: #bdbdbd;
                }

                .painel {
                    margin-bottom: 24px;
                    padding: 25px;
                    background: #1b1b1b;
                    border: 1px solid #393939;
                    border-radius: 12px;
                }

                .filtros {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 18px;
                }

                label {
                    display: flex;
                    flex-direction: column;
                    gap: 9px;
                    color: #e7e7e7;
                    font-size: 14px;
                }

                input,
                select {
                    width: 100%;
                    min-width: 0;
                    padding: 12px;
                    color: #f5f5f5;
                    background: #292929;
                    border: 1px solid #555;
                    border-radius: 7px;
                    font: inherit;
                }

                input:focus,
                select:focus {
                    outline: 2px solid #4285f4;
                    outline-offset: 1px;
                }

                .acoes {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-top: 22px;
                }

                button,
                .botao-voltar {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 18px;
                    color: white;
                    background: #2563eb;
                    border: 0;
                    border-radius: 7px;
                    font-size: 14px;
                    font-weight: bold;
                    text-decoration: none;
                    cursor: pointer;
                }

                button:hover,
                .botao-voltar:hover {
                    background: #1d4ed8;
                }

                button:disabled {
                    opacity: 0.65;
                    cursor: wait;
                }

                .botao-limpar {
                    background: #444;
                }

                .botao-limpar:hover {
                    background: #555;
                }

                .mensagem {
                    margin-bottom: 20px;
                    padding: 14px;
                    border-radius: 7px;
                }

                .erro {
                    color: #fecaca;
                    background: #451a1a;
                    border: 1px solid #7f1d1d;
                }

                .tabela-container {
                    width: 100%;
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }

                th,
                td {
                    padding: 15px 12px;
                    border-bottom: 1px solid #383838;
                    white-space: nowrap;
                }

                th {
                    color: #d5d5d5;
                    background: #252525;
                }

                .status {
                    display: inline-block;
                    padding: 5px 10px;
                    background: #303030;
                    border: 1px solid #555;
                    border-radius: 20px;
                }

                .vazio {
                    padding: 28px 12px;
                    color: #bdbdbd;
                    text-align: center;
                    white-space: normal;
                }

                @media (max-width: 900px) {
                    .filtros {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 600px) {
                    .pagina {
                        padding: 18px;
                    }

                    .painel {
                        padding: 18px;
                    }

                    .filtros {
                        grid-template-columns: 1fr;
                    }

                    .cabecalho {
                        align-items: flex-start;
                    }
                }
            `}</style>
        </main>
    );
}
