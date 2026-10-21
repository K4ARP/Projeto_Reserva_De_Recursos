'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';

type Painel = 'inicio' | 'recurso' | 'reserva';

type FormRecurso = {
    codigo: string;
    nome: string;
    tipo: string;
    capacidade: string;
    localizacao: string;
};

type FormReserva = {
    tipo: string;
    recurso: string;
    data: string;
    inicio: string;
    fim: string;
};

const recursoInicial: FormRecurso = {
    codigo: '',
    nome: '',
    tipo: 'Laboratório',
    capacidade: '',
    localizacao: '',
};

const reservaInicial: FormReserva = {
    tipo: 'Sala de Aula',
    recurso: '',
    data: '',
    inicio: '',
    fim: '',
};

const recursos: Record<string, string[]> = {
    'Sala de Aula': ['Sala 101', 'Sala 102', 'Sala 103'],
    Laboratório: [
        'Laboratório de Informática',
        'Laboratório de Eletrônica',
        'Laboratório de Química',
    ],
};

// Envia um JSON por POST e lança erro se a API não responder com sucesso.
async function enviarJson(rota: string, corpo: unknown) {
    const resposta = await fetch(rota, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(corpo),
    });

    const texto = await resposta.text();

    let resultado: { mensagem?: string } = {};

    try {
        resultado = texto ? JSON.parse(texto) : {};
    } catch {
        resultado = {};
    }

    if (!resposta.ok) {
        throw new Error(
            resultado.mensagem ||
            `Não foi possível concluir. Erro HTTP ${resposta.status}.`
        );
    }
}

function mensagemDeErro(erro: unknown) {
    return erro instanceof Error
        ? erro.message
        : 'Erro inesperado.';
}

export default function Home() {
    const [painel, setPainel] = useState<Painel>('inicio');
    const [formRecurso, setFormRecurso] =
        useState<FormRecurso>(recursoInicial);
    const [formReserva, setFormReserva] =
        useState<FormReserva>(reservaInicial);
    const [carregando, setCarregando] = useState(false);
    const [confirmada, setConfirmada] = useState(false);
    const [mensagemReserva, setMensagemReserva] = useState('');

    const handleChangeRecurso = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormRecurso((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    };

    const handleChangeReserva = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormReserva((anterior) => ({
            ...anterior,
            [name]: value,
            // Ao trocar o tipo, limpa o recurso escolhido
            ...(name === 'tipo' ? { recurso: '' } : {}),
        }));

        setMensagemReserva('');
    };

    // Volta para a mensagem de boas-vindas e limpa os formulários.
    const fecharPainel = () => {
        setPainel('inicio');
        setFormRecurso(recursoInicial);
        setFormReserva(reservaInicial);
        setConfirmada(false);
        setMensagemReserva('');
    };

    const abrirPainel = (novo: Painel) => {
        setPainel(novo);
        setConfirmada(false);
        setMensagemReserva('');
    };

    const sair = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    };

    const handleSubmitRecurso = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const codigo = Number(formRecurso.codigo);
        const capacidade = Number(formRecurso.capacidade);

        if (
            !Number.isInteger(codigo) ||
            codigo <= 0 ||
            !Number.isInteger(capacidade) ||
            capacidade <= 0
        ) {
            alert('Informe um código e uma capacidade válidos.');
            return;
        }

        const recurso = {
            codigo,
            nome: formRecurso.nome.trim(),
            capacidade,
            localizacao: formRecurso.localizacao.trim(),
        };

        if (!recurso.nome || !recurso.localizacao) {
            alert('Preencha todos os campos.');
            return;
        }

        // Cada tipo é salvo na sua tabela correspondente.
        const rota =
            formRecurso.tipo === 'Sala de Aula'
                ? '/api/salas'
                : '/api/laboratorios';

        setCarregando(true);

        try {
            await enviarJson(rota, recurso);

            alert(`${formRecurso.tipo} cadastrado com sucesso!`);
            fecharPainel();
        } catch (erro) {
            console.error('Erro ao cadastrar recurso:', erro);

            alert(
                `Não foi possível cadastrar o recurso.\n${mensagemDeErro(erro)}`
            );
        } finally {
            setCarregando(false);
        }
    };

    const handleSubmitReserva = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMensagemReserva('');

        if (formReserva.inicio >= formReserva.fim) {
            setMensagemReserva(
                'O horário de término deve ser posterior ao horário de início.'
            );
            return;
        }

        // Nesta primeira versão, a confirmação é apenas visual.
        // A gravação no banco será integrada posteriormente.
        setConfirmada(true);
    };

    // Data de hoje no horário local (AAAA-MM-DD), para o mínimo do campo de data
    const hoje = new Date().toLocaleDateString('sv-SE');

    return (
        <div className="sistema">
            <header className="cabecalho">
                <h1>Reserva de Salas e Laboratórios</h1>
                <span className="usuario-info">Usuário</span>
            </header>

            <div className="estrutura">
                <aside className="menu-lateral">
                    <button
                        type="button"
                        className={`item-menu botao-menu ${
                            painel === 'inicio' ? 'ativo' : ''
                        }`}
                        onClick={fecharPainel}
                    >
                        Início
                    </button>

                    <button
                        type="button"
                        className={`item-menu botao-menu ${
                            painel === 'reserva' ? 'ativo' : ''
                        }`}
                        onClick={() => abrirPainel('reserva')}
                    >
                        Reservar
                    </button>

                    <Link
                        href="/consultar-reservas"
                        className="item-menu"
                    >
                        Consultar Reservas
                    </Link>

                    <button
                        type="button"
                        className={`item-menu botao-menu ${
                            painel === 'recurso' ? 'ativo' : ''
                        }`}
                        onClick={() => abrirPainel('recurso')}
                    >
                        Cadastrar Recurso
                    </button>

                    <Link
                        href="/login"
                        className="item-menu sair"
                        onClick={sair}
                    >
                        Sair
                    </Link>
                </aside>

                <main
                    className={`conteudo ${
                        painel !== 'inicio' ? 'com-form' : ''
                    }`}
                >
                    {painel === 'inicio' && (
                        <section className="boas-vindas">
                            <h2>Bem-vindo!</h2>

                            <p>
                                Escolha uma opção no menu ao lado
                                para começar.
                            </p>
                        </section>
                    )}

                    {painel === 'recurso' && (
                        <section className="card-cadastro">
                            <h2>Cadastrar Recurso</h2>

                            <p className="subtitulo">
                                Preencha os dados da sala ou do laboratório.
                            </p>

                            <form
                                onSubmit={handleSubmitRecurso}
                                className="formulario"
                            >
                                <div className="campo-grupo">
                                    <div className="campo">
                                        <label htmlFor="codigo">
                                            Código
                                        </label>

                                        <input
                                            type="number"
                                            id="codigo"
                                            name="codigo"
                                            placeholder="Ex.: 101"
                                            min="1"
                                            step="1"
                                            value={formRecurso.codigo}
                                            onChange={handleChangeRecurso}
                                            required
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="tipo">
                                            Tipo de Recurso
                                        </label>

                                        <select
                                            id="tipo"
                                            name="tipo"
                                            value={formRecurso.tipo}
                                            onChange={handleChangeRecurso}
                                            required
                                        >
                                            <option value="Laboratório">
                                                Laboratório
                                            </option>

                                            <option value="Sala de Aula">
                                                Sala de Aula
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="campo">
                                    <label htmlFor="nome">
                                        Nome do Recurso
                                    </label>

                                    <input
                                        type="text"
                                        id="nome"
                                        name="nome"
                                        placeholder="Ex.: Laboratório de Informática"
                                        value={formRecurso.nome}
                                        onChange={handleChangeRecurso}
                                        required
                                    />
                                </div>

                                <div className="campo-grupo">
                                    <div className="campo">
                                        <label htmlFor="capacidade">
                                            Capacidade (pessoas)
                                        </label>

                                        <input
                                            type="number"
                                            id="capacidade"
                                            name="capacidade"
                                            placeholder="Ex.: 30"
                                            min="1"
                                            step="1"
                                            value={formRecurso.capacidade}
                                            onChange={handleChangeRecurso}
                                            required
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="localizacao">
                                            Localização
                                        </label>

                                        <input
                                            type="text"
                                            id="localizacao"
                                            name="localizacao"
                                            placeholder="Ex.: Bloco A"
                                            value={formRecurso.localizacao}
                                            onChange={handleChangeRecurso}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="acoes">
                                    <button
                                        type="submit"
                                        className="btn-salvar"
                                        disabled={carregando}
                                    >
                                        {carregando
                                            ? 'Cadastrando...'
                                            : 'Cadastrar Recurso'}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-cancelar"
                                        onClick={fecharPainel}
                                        disabled={carregando}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    {painel === 'reserva' && !confirmada && (
                        <section className="card-cadastro">
                            <h2>Nova Reserva</h2>

                            <p className="subtitulo">
                                Preencha os dados para reservar um recurso.
                            </p>

                            {mensagemReserva && (
                                <p className="mensagem erro" role="alert">
                                    {mensagemReserva}
                                </p>
                            )}

                            <form
                                onSubmit={handleSubmitReserva}
                                className="formulario"
                            >
                                <div className="campo">
                                    <label htmlFor="tipoReserva">
                                        Tipo de Recurso
                                    </label>

                                    <select
                                        id="tipoReserva"
                                        name="tipo"
                                        value={formReserva.tipo}
                                        onChange={handleChangeReserva}
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
                                    <label htmlFor="recursoReserva">
                                        Recurso
                                    </label>

                                    <select
                                        id="recursoReserva"
                                        name="recurso"
                                        value={formReserva.recurso}
                                        onChange={handleChangeReserva}
                                        required
                                    >
                                        <option value="">
                                            Selecione um recurso
                                        </option>

                                        {recursos[formReserva.tipo].map(
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

                                <div className="campo-grupo tres">
                                    <div className="campo">
                                        <label htmlFor="dataReserva">
                                            Data
                                        </label>

                                        <input
                                            type="date"
                                            id="dataReserva"
                                            name="data"
                                            min={hoje}
                                            value={formReserva.data}
                                            onChange={handleChangeReserva}
                                            required
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="inicioReserva">
                                            Horário de Início
                                        </label>

                                        <input
                                            type="time"
                                            id="inicioReserva"
                                            name="inicio"
                                            value={formReserva.inicio}
                                            onChange={handleChangeReserva}
                                            required
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="fimReserva">
                                            Horário de Término
                                        </label>

                                        <input
                                            type="time"
                                            id="fimReserva"
                                            name="fim"
                                            value={formReserva.fim}
                                            onChange={handleChangeReserva}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="acoes">
                                    <button
                                        type="submit"
                                        className="btn-salvar"
                                    >
                                        Reservar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-cancelar"
                                        onClick={fecharPainel}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    {painel === 'reserva' && confirmada && (
                        <section className="card-cadastro card-confirmacao">
                            <div className="icone-sucesso">✓</div>

                            <h2>Reserva realizada!</h2>

                            <p className="subtitulo">
                                Sua solicitação foi confirmada visualmente.
                            </p>

                            <div className="resumo">
                                <div className="linha-resumo">
                                    <span>Tipo</span>
                                    <strong>{formReserva.tipo}</strong>
                                </div>

                                <div className="linha-resumo">
                                    <span>Recurso</span>
                                    <strong>{formReserva.recurso}</strong>
                                </div>

                                <div className="linha-resumo">
                                    <span>Data</span>
                                    <strong>
                                        {formReserva.data
                                            ? formReserva.data
                                                  .split('-')
                                                  .reverse()
                                                  .join('/')
                                            : ''}
                                    </strong>
                                </div>

                                <div className="linha-resumo">
                                    <span>Horário</span>
                                    <strong>
                                        {formReserva.inicio} -{' '}
                                        {formReserva.fim}
                                    </strong>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn-salvar"
                                onClick={fecharPainel}
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

                /* Cabeçalho */

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

                /* Estrutura da página */

                .estrutura {
                    display: flex;
                    min-height: calc(100vh - 70px);
                }

                /* Menu lateral */

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

                /* Itens do menu que são botões */

                .botao-menu {
                    width: 100%;
                    border: none;
                    background: transparent;
                    text-align: left;
                    font-family: inherit;
                    cursor: pointer;
                }

                .botao-menu.ativo {
                    background: #0070f3;
                }

                .item-menu.sair {
                    margin-top: auto;
                    color: #ff6b6b;
                    border-top: 1px solid #2a2a2a;
                }

                .item-menu.sair:hover {
                    background: #2a1515;
                }

                /* Área principal */

                .conteudo {
                    flex: 1;
                    min-width: 0;
                    min-height: calc(100vh - 70px);
                    padding: 140px 40px 28px;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    background: #000000;
                }

                /* Com um formulário aberto, ele fica no centro da área */

                .conteudo.com-form {
                    align-items: center;
                    padding: 28px 40px;
                }

                .boas-vindas {
                    width: 100%;
                    padding: 20px;
                    background: transparent;
                    border: none;
                    text-align: center;
                }

                .boas-vindas h2 {
                    margin: 0 0 18px;
                    font-size: 42px;
                    font-weight: bold;
                    color: #ffffff;
                }

                .boas-vindas p {
                    margin: 0;
                    color: #cccccc;
                    font-size: 20px;
                    line-height: 1.6;
                }

                /* Formulários (recurso e reserva) */

                .card-cadastro {
                    width: 100%;
                    max-width: 600px;
                    padding: 35px 30px;
                    background: #000000;
                    border: 1px solid #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
                }

                .card-cadastro h2 {
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

                .campo-grupo.tres {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 12px;
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
                    flex-direction: column;
                    gap: 10px;
                }

                .btn-salvar {
                    width: 100%;
                    padding: 12px;
                    background: #0070f3;
                    color: #ffffff;
                    border: none;
                    border-radius: 6px;
                    font-size: 15px;
                    font-weight: bold;
                    cursor: pointer;
                }

                .btn-salvar:hover:not(:disabled) {
                    background: #005bb5;
                }

                .btn-salvar:disabled {
                    opacity: 0.6;
                    cursor: wait;
                }

                .btn-cancelar {
                    width: 100%;
                    padding: 12px;
                    background: transparent;
                    color: #cccccc;
                    border: 1px solid #444444;
                    border-radius: 6px;
                    font-size: 15px;
                    cursor: pointer;
                }

                .btn-cancelar:hover:not(:disabled) {
                    border-color: #ffffff;
                    color: #ffffff;
                }

                /* Mensagem de erro da reserva */

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

                /* Confirmação da reserva */

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

                .card-confirmacao .subtitulo {
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

                /* Ajustes para telas pequenas */

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

                    .botao-menu {
                        width: auto;
                    }

                    .item-menu.sair {
                        margin-top: 0;
                        border-top: none;
                    }

                    .conteudo {
                        min-height: calc(100vh - 118px);
                        padding: 90px 14px 20px;
                    }

                    .conteudo.com-form {
                        padding: 20px 14px;
                    }

                    .boas-vindas {
                        padding: 15px 5px;
                    }

                    .boas-vindas h2 {
                        font-size: 32px;
                        margin-bottom: 14px;
                    }

                    .boas-vindas p {
                        font-size: 16px;
                    }

                    .campo-grupo,
                    .campo-grupo.tres {
                        grid-template-columns: 1fr;
                    }

                    .card-cadastro {
                        padding: 25px 20px;
                    }

                    .linha-resumo {
                        font-size: 13px;
                    }
                }
            `}</style>
        </div>
    );
}