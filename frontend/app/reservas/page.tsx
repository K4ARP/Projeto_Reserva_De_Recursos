
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

type ReservaForm = {
    tipo: string;
    recurso: string;
    data: string;
    inicio: string;
    fim: string;
};

const formularioInicial: ReservaForm = {
    tipo: 'Sala de Aula',
    recurso: '',
    data: '',
    inicio: '',
    fim: '',
};

export default function ReservasPage() {
    const [formulario, setFormulario] =
        useState<ReservaForm>(formularioInicial);

    const [confirmada, setConfirmada] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState('');

    const recursos: Record<string, string[]> = {
        'Sala de Aula': ['Sala 101', 'Sala 102', 'Sala 103'],
        Laboratório: [
            'Laboratório de Informática',
            'Laboratório de Eletrônica',
            'Laboratório de Química',
        ],
    };

    function alterarCampo(
        campo: keyof ReservaForm,
        valor: string
    ) {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor,
            ...(campo === 'tipo' ? { recurso: '' } : {}),
        }));

        setMensagem('');
    }

    function reservar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMensagem('');

        if (formulario.inicio >= formulario.fim) {
            setMensagem(
                'O horário de término deve ser posterior ao horário de início.'
            );
            return;
        }

        setCarregando(true);

        // Nesta primeira versão, a confirmação é apenas visual.
        // A gravação no banco será integrada posteriormente.
        setConfirmada(true);
        setCarregando(false);
    }

    function voltarFormulario() {
        setConfirmada(false);
        setMensagem('');
    }

    function sair() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
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
                        <span>⌂</span> Início
                    </Link>

                    <Link
                        href="/reservas"
                        className="item-menu ativo"
                    >
                        <span>▦</span> Reservar
                    </Link>

                    <Link
                        href="/consultar-reservas"
                        className="item-menu"
                    >
                        <span>⌕</span> Consultar Reservas
                    </Link>

                    <Link
                        href="/principal"
                        className="item-menu"
                    >
                        <span>＋</span> Cadastrar Recurso
                    </Link>

                    <Link
                        href="/login"
                        className="item-menu sair"
                        onClick={sair}
                    >
                        Sair
                    </Link>
                </aside>

                <main className="conteudo">
                    {!confirmada ? (
                        <section className="card-reserva">
                            <h2>Nova Reserva</h2>
                            <p className="subtitulo">
                                Preencha os dados para reservar um recurso.
                            </p>

                            {mensagem && (
                                <p className="mensagem erro" role="alert">
                                    {mensagem}
                                </p>
                            )}

                            <form onSubmit={reservar} className="formulario">
                                <div className="campo">
                                    <label htmlFor="tipo">
                                        Tipo de Recurso
                                    </label>

                                    <select
                                        id="tipo"
                                        value={formulario.tipo}
                                        onChange={(e) =>
                                            alterarCampo('tipo', e.target.value)
                                        }
                                        required
                                    >
                                        <option value="Sala de Aula">
                                            Sala de Aula
                                        </option>
                                        <option value="Laboratório">
                                            Laboratório
                                        </option>
                                    </select>
                                </div>

                                <div className="campo">
                                    <label htmlFor="recurso">Recurso</label>

                                    <select
                                        id="recurso"
                                        value={formulario.recurso}
                                        onChange={(e) =>
                                            alterarCampo(
                                                'recurso',
                                                e.target.value
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            Selecione um recurso
                                        </option>

                                        {recursos[formulario.tipo].map(
                                            (recurso) => (
                                                <option
                                                    key={recurso}
                                                    value={recurso}
                                                >
                                                    {recurso}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="campo-grupo">
                                    <div className="campo">
                                        <label htmlFor="data">Data</label>
                                        <input
                                            id="data"
                                            type="date"
                                            min={
                                                new Date()
                                                    .toISOString()
                                                    .split('T')[0]
                                            }
                                            value={formulario.data}
                                            onChange={(e) =>
                                                alterarCampo(
                                                    'data',
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="inicio">
                                            Horário de Início
                                        </label>
                                        <input
                                            id="inicio"
                                            type="time"
                                            value={formulario.inicio}
                                            onChange={(e) =>
                                                alterarCampo(
                                                    'inicio',
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="fim">
                                            Horário de Término
                                        </label>
                                        <input
                                            id="fim"
                                            type="time"
                                            value={formulario.fim}
                                            onChange={(e) =>
                                                alterarCampo(
                                                    'fim',
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="acoes">
                                    <button
                                        type="submit"
                                        className="btn-reservar"
                                        disabled={carregando}
                                    >
                                        {carregando
                                            ? 'Processando...'
                                            : 'Reservar'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    ) : (
                        <section className="card-confirmacao">
                            <div className="icone-sucesso">✓</div>

                            <h2>Reserva realizada!</h2>

                            <p className="subtitulo confirmacao-subtitulo">
                                Sua solicitação foi confirmada visualmente.
                            </p>

                            <div className="resumo">
                                <div className="linha-resumo">
                                    <span>Tipo</span>
                                    <strong>{formulario.tipo}</strong>
                                </div>

                                <div className="linha-resumo">
                                    <span>Recurso</span>
                                    <strong>{formulario.recurso}</strong>
                                </div>

                                <div className="linha-resumo">
                                    <span>Data</span>
                                    <strong>
                                        {formulario.data
                                            ? formulario.data.split('-').reverse().join('/')
                                            : ''}
                                    </strong>
                                </div>

                                <div className="linha-resumo">
                                    <span>Horário</span>
                                    <strong>
                                        {formulario.inicio} - {formulario.fim}
                                    </strong>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn-reservar"
                                onClick={voltarFormulario}
                            >
                                Voltar
                            </button>
                        </section>
                    )}
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
                    gap: 12px;
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
                    min-height: calc(100vh - 70px);
                    padding: 35px 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #000000;
                }

                .card-reserva,
                .card-confirmacao {
                    width: 100%;
                    max-width: 600px;
                    padding: 32px 30px;
                    background: #000000;
                    border: 1px solid #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
                }

                .card-reserva h2,
                .card-confirmacao h2 {
                    margin: 0 0 8px;
                    font-size: 24px;
                    text-align: center;
                }

                .subtitulo {
                    margin: 0 0 25px;
                    color: #aaaaaa;
                    font-size: 14px;
                    line-height: 1.5;
                    text-align: center;
                }

                .formulario {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .campo-grupo {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 12px;
                }

                .campo {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                    min-width: 0;
                }

                .campo label {
                    font-size: 13px;
                    color: #ffffff;
                }

                .campo input,
                .campo select {
                    width: 100%;
                    min-width: 0;
                    padding: 12px 10px;
                    border: 1px solid #444444;
                    border-radius: 4px;
                    background: #121212;
                    color: #ffffff;
                    font: inherit;
                    color-scheme: dark;
                }

                .campo input:focus,
                .campo select:focus {
                    outline: 1px solid #0070f3;
                    border-color: #0070f3;
                }

                .acoes {
                    display: flex;
                    margin-top: 4px;
                }

                .btn-reservar {
                    width: 100%;
                    padding: 13px;
                    border: none;
                    border-radius: 4px;
                    background: #0070f3;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .btn-reservar:hover {
                    background: #005ac1;
                }

                .btn-reservar:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .mensagem {
                    padding: 12px;
                    margin: 0 0 18px;
                    border-radius: 5px;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .mensagem.erro {
                    color: #fca5a5;
                    background: #2a1111;
                    border: 1px solid #7f2929;
                }

                .card-confirmacao {
                    max-width: 520px;
                    text-align: center;
                }

                .icone-sucesso {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 58px;
                    height: 58px;
                    margin: 0 auto 20px;
                    border-radius: 50%;
                    background: #16a765;
                    color: #ffffff;
                    font-size: 36px;
                    font-weight: bold;
                }

                .confirmacao-subtitulo {
                    margin-bottom: 24px;
                }

                .resumo {
                    padding: 18px;
                    margin-bottom: 24px;
                    background: #121212;
                    border: 1px solid #333333;
                    border-radius: 6px;
                    text-align: left;
                }

                .linha-resumo {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 12px 0;
                    border-bottom: 1px solid #2a2a2a;
                    font-size: 14px;
                }

                .linha-resumo:first-child {
                    padding-top: 0;
                }

                .linha-resumo:last-child {
                    padding-bottom: 0;
                    border-bottom: none;
                }

                .linha-resumo span {
                    color: #aaaaaa;
                }

                .linha-resumo strong {
                    text-align: right;
                    overflow-wrap: anywhere;
                }

                @media (max-width: 900px) {
                    .menu-lateral {
                        width: 230px;
                    }

                    .conteudo {
                        padding: 25px 20px;
                    }

                    .campo-grupo {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 600px) {
                    .estrutura {
                        flex-direction: column;
                    }

                    .menu-lateral {
                        width: 100%;
                        border-right: none;
                        border-bottom: 1px solid #2a2a2a;
                    }

                    .item-menu {
                        min-height: 46px;
                        padding: 13px 20px;
                    }

                    .item-menu.sair {
                        margin-top: 0;
                    }

                    .cabecalho {
                        padding: 16px;
                    }

                    .cabecalho h1 {
                        font-size: 16px;
                    }

                    .conteudo {
                        padding: 24px 14px;
                    }

                    .card-reserva,
                    .card-confirmacao {
                        padding: 24px 18px;
                    }

                    .linha-resumo {
                        font-size: 13px;
                    }
                }
            `}</style>
        </div>
    );
}
