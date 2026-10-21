
import jwt from 'jsonwebtoken';

import {
    buscarUsuarioPorLogin,
    verificarSenha,
    registrarAcesso,
    atualizarDataAcesso
} from '../models/loginModel.js';

export async function login(req, res) {
    try {
        const { login: loginDigitado, senha } = req.body;

        if (
            typeof loginDigitado !== 'string' ||
            typeof senha !== 'string' ||
            !loginDigitado.trim() ||
            !senha
        ) {
            return res.status(400).json({
                mensagem: 'Informe o login e a senha.'
            });
        }

        const usuario = await buscarUsuarioPorLogin(loginDigitado);

        if (!usuario) {
            await registrarAcesso(null, false);

            return res.status(401).json({
                mensagem: 'Login ou senha inválidos.'
            });
        }

        const senhaValida = await verificarSenha(usuario, senha);

        if (!senhaValida) {
            await registrarAcesso(usuario.id, false);

            return res.status(401).json({
                mensagem: 'Login ou senha inválidos.'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET não configurado no .env.');
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                login: usuario.login
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        await registrarAcesso(usuario.id, true);
        await atualizarDataAcesso(usuario.id);

        return res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            token,
            usuario: {
                id: usuario.id,
                nomeCompleto: usuario.nomeCompleto,
                email: usuario.email,
                login: usuario.login
            }
        });
    } catch (erro) {
        console.error('Erro no login:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno ao realizar login.'
        });
    }
}
