
import conectaBD from '../config/dbConexao.js';

import {
    listarRecursos,
    cadastrarRecurso,
    atualizarAtivoRecurso,
} from '../models/recursoModel.js';

// Lista salas ou laboratórios
export async function listar(req, res) {
    try {
        const recursos = await listarRecursos(req.params.tipo);
        return res.status(200).json(recursos);
    } catch (erro) {
        console.error('Erro ao listar recursos:', erro);

        if (erro.message === 'Tipo de recurso inválido.') {
            return res.status(400).json({ mensagem: erro.message });
        }

        return res.status(500).json({
            mensagem: 'Erro ao listar recursos.',
        });
    }
}

// Lista salas e laboratórios juntos
export async function listarTodos(req, res) {
    try {
        const bd = await conectaBD();

        const salas = await bd.request().query(`
            SELECT codigo, nome, capacidade, localizacao, ativo,
                   'Sala' AS tipo
            FROM dbo.Sala
        `);

        const laboratorios = await bd.request().query(`
            SELECT codigo, nome, capacidade, localizacao, ativo,
                   'Laboratorio' AS tipo
            FROM dbo.Laboratorio
        `);

        return res.status(200).json([
            ...salas.recordset,
            ...laboratorios.recordset,
        ]);
    } catch (erro) {
        console.error('Erro ao listar todos os recursos:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao consultar os recursos.',
        });
    }
}

// Cadastra sala ou laboratório
export async function cadastrar(req, res) {
    try {
        const { codigo, nome, capacidade, localizacao, ativo } = req.body;

        if (
            codigo === undefined ||
            codigo === '' ||
            !Number.isInteger(Number(codigo)) ||
            Number(codigo) <= 0
        ) {
            return res.status(400).json({
                mensagem: 'Informe um código numérico positivo.',
            });
        }

        if (typeof nome !== 'string' || !nome.trim()) {
            return res.status(400).json({
                mensagem: 'Informe o nome do recurso.',
            });
        }

        if (
            capacidade === undefined ||
            capacidade === '' ||
            !Number.isInteger(Number(capacidade)) ||
            Number(capacidade) <= 0
        ) {
            return res.status(400).json({
                mensagem: 'A capacidade deve ser um número inteiro positivo.',
            });
        }

        if (typeof localizacao !== 'string' || !localizacao.trim()) {
            return res.status(400).json({
                mensagem: 'Informe a localização do recurso.',
            });
        }

        if (ativo !== undefined && typeof ativo !== 'boolean') {
            return res.status(400).json({
                mensagem: 'O campo ativo deve ser verdadeiro ou falso.',
            });
        }

        const recurso = await cadastrarRecurso(req.params.tipo, {
            codigo,
            nome,
            capacidade,
            localizacao,
            ativo: ativo !== false,
        });

        return res.status(201).json({
            mensagem: 'Recurso cadastrado com sucesso!',
            recurso,
        });
    } catch (erro) {
        console.error('Erro ao cadastrar recurso:', erro);

        if (erro.message === 'Tipo de recurso inválido.') {
            return res.status(400).json({ mensagem: erro.message });
        }

        if (erro.number === 2627 || erro.number === 2601) {
            return res.status(409).json({
                mensagem: 'Já existe um recurso com esse código.',
            });
        }

        return res.status(500).json({
            mensagem: 'Erro ao cadastrar recurso. Verifique o banco de dados.',
        });
    }
}

// Ativa ou desativa sala ou laboratório
export async function alterarAtivo(req, res) {
    try {
        const { tipo, codigo } = req.params;
        const { ativo } = req.body;

        if (ativo !== true && ativo !== false) {
            return res.status(400).json({
                mensagem: 'Informe se o recurso deve ficar ativo ou inativo.',
            });
        }

        const recurso = await atualizarAtivoRecurso(tipo, codigo, ativo);

        if (!recurso) {
            return res.status(404).json({
                mensagem: 'Recurso não encontrado.',
            });
        }

        return res.status(200).json({
            mensagem: ativo
                ? 'Recurso ativado com sucesso!'
                : 'Recurso desativado com sucesso!',
            recurso,
        });
    } catch (erro) {
        console.error('Erro ao alterar situação do recurso:', erro);

        if (erro.message === 'Tipo de recurso inválido.') {
            return res.status(400).json({ mensagem: erro.message });
        }

        return res.status(500).json({
            mensagem: 'Erro ao alterar a situação do recurso.',
        });
    }
}
