
import {
    listarUsuarios,
    cadastrarUsuario
} from '../models/usuarioModel.js';

export async function listar(req, res) {
    try {
        const usuarios = await listarUsuarios();

        return res.status(200).json(usuarios);
    } catch (erro) {
        console.error('Erro ao listar usuários:', erro.message);

        return res.status(500).json({
            mensagem: 'Erro ao buscar usuários.'
        });
    }
}

export async function cadastrar(req, res) {
    try {
        const {
            cpf,
            nomeCompleto,
            dataAniversario,
            celular,
            email,
            login,
            senha
        } = req.body;

        if (
            !cpf ||
            !nomeCompleto ||
            !dataAniversario ||
            !celular ||
            !email ||
            !login ||
            !senha
        ) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }

        const novoUsuario = await cadastrarUsuario({
            cpf,
            nomeCompleto,
            dataAniversario,
            celular,
            email,
            login,
            senha
        });

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: novoUsuario
        });
    } catch (erro) {
        console.error('Erro ao cadastrar usuário:', erro.message);

        return res.status(500).json({
            mensagem: 'Erro ao cadastrar usuário. Verifique os dados enviados e o banco.'
        });
    }
}
