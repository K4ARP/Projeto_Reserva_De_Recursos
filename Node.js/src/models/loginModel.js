
import mssql from 'mssql';
import bcrypt from 'bcrypt';
import conectaBD from '../config/dbConexao.js';

export async function buscarUsuarioPorLogin(login) {
    const bd = await conectaBD();

    const resultado = await bd.request()
        .input('login', mssql.VarChar, login.trim())
        .query(`
            SELECT id, nomeCompleto, email, login, senha
            FROM Usuario
            WHERE LTRIM(RTRIM(login)) = @login
        `);

    return resultado.recordset[0] || null;
}

export async function verificarSenha(usuario, senhaDigitada) {
    if (!usuario || !usuario.senha || !senhaDigitada) {
        return false;
    }

    const senhaSalva = String(usuario.senha);

    // Verifica se a senha salva tem o formato de um hash bcrypt.
    if (/^\$2[aby]\$/.test(senhaSalva)) {
        try {
            return await bcrypt.compare(senhaDigitada, senhaSalva);
        } catch (erro) {
            console.error('Erro ao comparar senha:', erro.message);
            return false;
        }
    }

    // Compatibilidade com senhas antigas em texto simples.
    if (senhaDigitada !== senhaSalva) {
        return false;
    }

    // Converte a senha antiga para hash bcrypt após validar.
    const senhaCriptografada = await bcrypt.hash(senhaDigitada, 10);
    const bd = await conectaBD();

    await bd.request()
        .input('idUsuario', mssql.Int, usuario.id)
        .input('senha', mssql.VarChar(255), senhaCriptografada)
        .query(`
            UPDATE Usuario
            SET senha = @senha
            WHERE id = @idUsuario
        `);

    return true;
}

export async function registrarAcesso(idUsuario, sucesso) {
    const bd = await conectaBD();

    await bd.request()
        .input('idUsuario', mssql.Int, idUsuario ?? null)
        .input('sucesso', mssql.Bit, sucesso)
        .query(`
            INSERT INTO AcessoLogin (idUsuario, sucesso)
            VALUES (@idUsuario, @sucesso)
        `);
}

export async function atualizarDataAcesso(idUsuario) {
    const bd = await conectaBD();

    await bd.request()
        .input('idUsuario', mssql.Int, idUsuario)
        .query(`
            UPDATE Usuario
            SET dataAcesso = SYSDATETIME()
            WHERE id = @idUsuario
        `);
}
