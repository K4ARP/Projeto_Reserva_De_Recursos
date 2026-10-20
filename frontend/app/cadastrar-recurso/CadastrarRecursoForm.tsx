'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';

type FormData = {
    codigo: string;
    nome: string;
    tipo: string;
    capacidade: string;
    localizacao: string;
};

const formInicial: FormData = {
    codigo: '',
    nome: '',
    tipo: 'Laboratório',
    capacidade: '',
    localizacao: '',
};

export default function Home() {
    const [mostrarForm, setMostrarForm] = useState(false);
    const [formData, setFormData] = useState<FormData>(formInicial);
    const [carregando, setCarregando] = useState(false);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    };

    const fecharForm = () => {
        setMostrarForm(false);
        setFormData(formInicial);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const codigo = Number(formData.codigo);
        const capacidade = Number(formData.capacidade);

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
            nome: formData.nome.trim(),
            capacidade,
            localizacao: formData.localizacao.trim(),
        };

        if (!recurso.nome || !recurso.localizacao) {
            alert('Preencha todos os campos.');
            return;
        }

        // Cada tipo é salvo na sua tabela correspondente.
        const rota =
            formData.tipo === 'Sala de Aula'
                ? '/api/salas'
                : '/api/laboratorios';

        setCarregando(true);

        try {
            const resposta = await fetch(rota, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recurso),
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
                    `Não foi possível cadastrar. Erro HTTP ${resposta.status}.`
                );
            }

            alert(`${formData.tipo} cadastrado com sucesso!`);

            // Deu certo: o formulário some e a mensagem volta.
            fecharForm();
        } catch (erro) {
            console.error('Erro ao cadastrar recurso:', erro);

            const mensagem =
                erro instanceof Error
                    ? erro.message
                    : 'Erro inesperado ao cadastrar recurso.';

            alert(`Não foi possível cadastrar o recurso.\n${mensagem}`);
        } finally {
            setCarregando(false);
        }
    };

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
                            !mostrarForm ? 'ativo' : ''
                        }`}
                        onClick={fecharForm}
                    >
                        Início
                    </button>

                    <Link href="/reservas" className="item-menu">
                        Reservar
                    </Link>

                    <Link
                        href="/consultar-reservas"
                        className="item-menu"
                    >
                        Consultar Reservas
                    </Link>

                    <button
                        type="button"
                        className={`item-menu botao-menu ${
                            mostrarForm ? 'ativo' : ''
                        }`}
                        onClick={() => setMostrarForm(true)}
                    >
                        Cadastrar Recurso
                    </button>

                    <Link href="/login" className="item-menu sair">
                        Sair
                    </Link>
                </aside>

                <main
                    className={`conteudo ${mostrarForm ? 'com-form' : ''}`}
                >
                    {!mostrarForm ? (
                        <section className="boas-vindas">
                            <h2>Bem-vindo!</h2>

                            <p>
                                Escolha uma opção no menu ao lado
                                para começar.
                            </p>
                        </section>
                    ) : (
                        <section className="card-cadastro">
                            <h2>Cadastrar Recurso</h2>

                            <p className="subtitulo">
                                Preencha os dados da sala ou do laboratório.
                            </p>

                            <form
                                onSubmit={handleSubmit}
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
                                            value={formData.codigo}
                                            onChange={handleChange}
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
                                            value={formData.tipo}
                                            onChange={handleChange}
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
                                        value={formData.nome}
                                        onChange={handleChange}
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
                                            value={formData.capacidade}
                                            onChange={handleChange}
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
                                            value={formData.localizacao}
                                            onChange={handleChange}
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
                                        onClick={fecharForm}
                                        disabled={carregando}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
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

                .conteudo.com-form {
                    padding-top: 40px;
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

                /* Formulário de cadastro de recurso */

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
                        padding-top: 20px;
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

                    .campo-grupo {
                        grid-template-columns: 1fr;
                    }

                    .card-cadastro {
                        padding: 25px 20px;
                    }
                }
            `}</style>
        </div>
    );
}