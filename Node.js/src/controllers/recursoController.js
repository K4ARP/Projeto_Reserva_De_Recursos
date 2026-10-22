
import {
    listarRecursos,
    cadastrarRecurso,
    atualizarAtivoRecurso
} from '../models/recursoModel.js';

// Lista todos os recursos (salas e laboratórios)
export async function listarTodos(req, res) {
    try {
        const laboratorios = await listarRecursos('laboratorio');
        const salas = await listarRecursos('sala');

        const recursos = [
            ...laboratorios.map((item) => ({
                ...item,
                tipo: 'laboratorio'
            })),
            ...salas.map((item) => ({
                ...item,
                tipo: 'sala'
            }))
        ];

        return res.status(200).json(recursos);
    } catch (erro) {
        console.error('Erro ao listar recursos:', erro);

        return res.status(500).json({
            mensagem: erro.message || 'Erro ao listar recursos.'
        });
    }
}

// Lista os recursos de um tipo específico
export async function listar(req, res) {
    try {
        const { tipo } = req.params;

        const recursos = await listarRecursos(tipo);

        return res.status(200).json(
            recursos.map((item) => ({
                ...item,
                tipo: tipo.toLowerCase()
            }))
        );
    } catch (erro) {
        console.error('Erro ao listar recursos:', erro);

        return res.status(400).json({
            mensagem: erro.message || 'Erro ao listar recursos.'
        });
    }
}

// Cadastra uma sala ou laboratório
export async function cadastrar(req, res) {
    try {
        const { tipo } = req.params;
        const { codigo, nome, capacidade, localizacao, ativo } = req.body;

        if (
            codigo === undefined ||
            !nome?.trim() ||
            capacidade === undefined ||
            !localizacao?.trim()
        ) {
            return res.status(400).json({
                mensagem: 'Preencha código, nome, capacidade e localização.'
            });
        }

        if (
            !Number.isInteger(Number(codigo)) ||
            Number(codigo) <= 0 ||
            !Number.isInteger(Number(capacidade)) ||
            Number(capacidade) <= 0
        ) {
            return res.status(400).json({
                mensagem: 'Código e capacidade devem ser números inteiros positivos.'
            });
        }

        const recurso = await cadastrarRecurso(tipo, {
            codigo,
            nome,
            capacidade,
            localizacao,
            ativo
        });

        return res.status(201).json({
            mensagem: 'Recurso cadastrado com sucesso!',
            recurso: {
                ...recurso,
                tipo: tipo.toLowerCase()
            }
        });
    } catch (erro) {
        console.error('Erro ao cadastrar recurso:', erro);

        return res.status(400).json({
            mensagem: erro.message || 'Erro ao cadastrar recurso.'
        });
    }
}

// Ativa ou desativa uma sala ou laboratório
export async function alterarAtivo(req, res) {
    try {
        const { tipo, codigo } = req.params;
        const { ativo } = req.body;

        if (typeof ativo !== 'boolean') {
            return res.status(400).json({
                mensagem: 'Informe ativo como true ou false.'
            });
        }

        const recurso = await atualizarAtivoRecurso(
            tipo,
            codigo,
            ativo
        );

        if (!recurso) {
            return res.status(404).json({
                mensagem: 'Recurso não encontrado.'
            });
        }

        return res.status(200).json({
            mensagem: ativo
                ? 'Recurso ativado com sucesso!'
                : 'Recurso desativado com sucesso!',
            recurso: {
                ...recurso,
                tipo: tipo.toLowerCase()
            }
        });
    } catch (erro) {
        console.error('Erro ao alterar status do recurso:', erro);

        return res.status(400).json({
            mensagem: erro.message || 'Erro ao alterar status do recurso.'
        });
    }
}
