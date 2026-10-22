
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

    function alterarFiltro(campo: keyof Filtros, valor: string) {
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

            if (filtros.data) parametros.set('data', filtros.data);
            if (filtros.horario) parametros.set('horario', filtros.horario);
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
                        `Não foi possível consultar. Erro HTTP ${resposta.status}.`
                );
            }

            if (!Array.isArray(resultado)) {
                throw new Error(
                    'A API não retornou uma lista válida de reservas.'
                );
            }

            setReservas(resultado);
        } catch (erro) {
            setReservas([]);
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Erro ao consultar as reservas.'
            );
        } finally {
            setCarregando(false);
        }
    }

    function limparFiltros() {
        setFiltros({
            data: '',
            horario: '',
            usuario: '',
            recurso: 'Todos',
        });
        setReservas([]);
        setMensagem('');
        setPesquisou(false);
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

    return (
        <div className="sistema">
            <header className="cabecalho">
                <h1>Reserva de Salas e Laboratórios</h1>
                <span className="usuario-info">Usuário</span>
            </header>

            <div className="estrutura">
                <aside className="menu-lateral">
                    <Link href="/principal" className="item-menu">
                        Início
                    </Link>

                    <Link href="/principal" className="item-menu">
                        Reservar
                    </Link>

                    <Link
                        href="/consultar-reservas"
                        className="item-menu ativo"
                    >
                        Consultar Reservas
                    </Link>

                    <Link href="/principal" className="item-menu">
                        Cadastrar Recurso
                    </Link>

                    <Link href="/login" className="item-menu sair">
                        Sair
                    </Link>
                </aside>

                <main className="conteudo">
                    <section className="card-consulta">
                        <h2>Consultar Reservas</h2>

                        <p className="subtitulo">
                            Pesquise reservas por data, horário, usuário ou
                            tipo de recurso.
                        </p>

                        <form onSubmit={handlePesquisar} className="formulario">
                            <div className="campo-grupo">
                                <div className="campo">
                                    <label htmlFor="data">Data</label>
                                    <input
                                        id="data"
                                        type="date"
                                        value={filtros.data}
                                        onChange={(e) =>
                                            alterarFiltro('data', e.target.value)
                                        }
                                    />
                                </div>

                                <div className="campo">
                                    <label htmlFor="horario">Horário</label>
                                    <input
                                        id="horario"
                                        type="time"
                                        value={filtros.horario}
                                        onChange={(e) =>
                                            alterarFiltro(
                                                'horario',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="campo-grupo">
                                <div className="campo">
                                    <label htmlFor="usuario">Usuário</label>
                                    <input
                                        id="usuario"
                                        type="text"
                                        placeholder="Nome do usuário"
                                        value={filtros.usuario}
                                        onChange={(e) =>
                                            alterarFiltro(
                                                'usuario',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="campo">
                                    <label htmlFor="recurso">
                                        Tipo de Recurso
                                    </label>
                                    <select
                                        id="recurso"
                                        value={filtros.recurso}
                                        onChange={(e) =>
                                            alterarFiltro(
                                                'recurso',
                                                e.target.value
                                            )
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
                                </div>
                            </div>

                            <div className="acoes">
                                <button
                                    type="submit"
                                    className="btn-salvar"
                                    disabled={carregando}
                                >
                                    {carregando ? 'Pesquisando...' : 'Pesquisar'}
                                </button>

                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={limparFiltros}
                                >
                                    Limpar filtros
                                </button>
                            </div>
                        </form>

                        {mensagem && (
                            <p className="mensagem erro" role="alert">
                                {mensagem}
                            </p>
                        )}

                        <div className="resultados">
                            <h3>Reservas encontradas</h3>

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
                                            <tr
                                                key={
                                                    reserva.idReserva ??
                                                    reserva.id ??
                                                    reserva.codigo ??
                                                    indice
                                                }
                                            >
                                                <td>
                                                    {formatarData(
                                                        reserva.dataReserva ||
                                                            reserva.data
                                                    )}
                                                </td>
                                                <td>{formatarHorario(reserva)}</td>
                                                <td>
                                                    {reserva.nomeRecurso ||
                                                        reserva.recurso ||
                                                        '—'}
                                                </td>
                                                <td>
                                                    {reserva.nomeUsuario ||
                                                        reserva.usuario ||
                                                        '—'}
                                                </td>
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
                                                          : 'Faça uma pesquisa para visualizar as reservas.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </main>
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

                .sistema {
                    min-height: 100vh;
                    background: #000000;
                }

                .cabecalho {
                    min-height: 70px;
                    padding: 16px 30px;
                    background: #121212;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    border-bottom: 1px solid #2a2a2a;
                }

                .cabecalho h1 {
                    margin: 0;
                    font-size: 18px;
                    color: #ffffff;
                }

                .usuario-info {
                    font-size: 14px;
                    color: #ffffff;
                }

                .estrutura {
                    display: flex;
                    min-height: calc(100vh - 70px);
                }

                .menu-lateral {
                    width: 300px;
                    flex-shrink: 0;
                    background: #121212;
                    padding-top: 20px;
                    border-right: 1px solid #2a2a2a;
                    display: flex;
                    flex-direction: column;
                }

                .item-menu {
                    display: flex;
                    align-items: center;
                    min-height: 58px;
                    padding: 18px 28px;
                    color: #cccccc;
                    text-decoration: none;
                    font-size: 16px;
                    transition: background 0.2s, color 0.2s;
                }

                .item-menu:hover {
                    background: #1f1f1f;
                    color: #ffffff;
                }

                .item-menu.ativo {
                    background: #0070f3;
                    color: #ffffff;
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

                .conteudo {
                    flex: 1;
                    min-width: 0;
                    padding: 35px;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    background: #000000;
                }

                .card-consulta {
                    width: 100%;
                    max-width: 1050px;
                    padding: 35px 30px;
                    background: #000000;
                    border: 1px solid #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
                }

                .card-consulta h2 {
                    margin: 0 0 6px;
                    font-size: 24px;
                }

                .subtitulo {
                    margin: 0 0 28px;
                    color: #aaaaaa;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .formulario {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .campo-grupo {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
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

                .campo input,
                .campo select {
                    width: 100%;
                    min-width: 0;
                    padding: 12px 14px;
                    background: #121212;
                    border: 1px solid #333333;
                    border-radius: 6px;
                    color: #ffffff;
                    font-size: 14px;
                    outline: none;
                    color-scheme: dark;
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

                .acoes {
                    margin-top: 10px;
                    display: flex;
                    gap: 12px;
                }

                .btn-salvar,
                .btn-cancelar {
                    padding: 12px 18px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                }

                .btn-salvar {
                    background: #0070f3;
                    color: #ffffff;
                    border: none;
                }

                .btn-salvar:hover:not(:disabled) {
                    background: #005bb5;
                }

                .btn-salvar:disabled {
                    opacity: 0.6;
                    cursor: wait;
                }

                .btn-cancelar {
                    background: transparent;
                    color: #cccccc;
                    border: 1px solid #444444;
                }

                .btn-cancelar:hover {
                    border-color: #ffffff;
                    color: #ffffff;
                }

                .mensagem {
                    padding: 12px;
                    margin: 18px 0 0;
                    border-radius: 5px;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .mensagem.erro {
                    color: #fca5a5;
                    background: #2a1111;
                    border: 1px solid #7f2929;
                }

                .resultados {
                    margin-top: 32px;
                }

                .resultados h3 {
                    margin: 0 0 18px;
                    font-size: 19px;
                }

                .tabela-container {
                    width: 100%;
                    overflow-x: auto;
                    border: 1px solid #333333;
                    border-radius: 6px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }

                th,
                td {
                    padding: 14px 12px;
                    border-bottom: 1px solid #2a2a2a;
                    font-size: 14px;
                }

                th {
                    background: #121212;
                    color: #ffffff;
                    font-weight: bold;
                }

                td {
                    color: #dddddd;
                }

                tbody tr:last-child td {
                    border-bottom: none;
                }

                .status {
                    display: inline-block;
                    padding: 5px 10px;
                    background: #121212;
                    border: 1px solid #444444;
                    border-radius: 5px;
                }

                .vazio {
                    padding: 25px 12px;
                    color: #aaaaaa;
                    text-align: center;
                    white-space: normal;
                }

                @media (max-width: 900px) {
                    .conteudo {
                        padding: 22px;
                    }

                    .menu-lateral {
                        width: 230px;
                    }

                    .card-consulta {
                        padding: 25px 20px;
                    }
                }

                @media (max-width: 700px) {
                    .cabecalho {
                        padding: 16px;
                    }

                    .cabecalho h1 {
                        font-size: 16px;
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
                        min-height: 48px;
                        padding: 14px;
                        white-space: nowrap;
                        font-size: 14px;
                    }

                    .item-menu.sair {
                        margin-top: 0;
                        border-top: none;
                    }

                    .conteudo {
                        padding: 20px 14px;
                    }

                    .campo-grupo {
                        grid-template-columns: 1fr;
                    }

                    .acoes {
                        flex-direction: column;
                    }

                    .btn-salvar,
                    .btn-cancelar {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
