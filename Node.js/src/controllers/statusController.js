// Node.js/src/controllers/statusController.js
import { listarStatus, cadastrarStatus } from '../models/statusModel.js';

// GET /status  -> lista os status
export async function listar(req, res) {
    try {
        const status = await listarStatus();

        return res.status(200).json(status);
    } catch (erro) {
        console.error('Erro ao listar status:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao listar os status.'
        });
    }
}

// POST /status  { nomeStatus }  -> cadastra um status
export async function cadastrar(req, res) {
    try {
        const nomeStatus = String(req.body.nomeStatus || '').trim();

        if (!nomeStatus) {
            return res.status(400).json({
                mensagem: 'Informe o nome do status.'
            });
        }

        // O banco guarda no máximo 30 caracteres
        if (nomeStatus.length > 30) {
            return res.status(400).json({
                mensagem: 'O nome do status deve ter no máximo 30 caracteres.'
            });
        }

        const status = await cadastrarStatus(nomeStatus);

        return res.status(201).json({
            mensagem: 'Status cadastrado com sucesso!',
            status
        });
    } catch (erro) {
        console.error('Erro ao cadastrar status:', erro);

        const duplicado = /Já existe/.test(erro.message);

        return res.status(duplicado ? 409 : 500).json({
            mensagem: duplicado
                ? erro.message
                : 'Erro ao cadastrar o status.'
        });
    }
}
