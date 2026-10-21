
import mssql from 'mssql';
import bcrypt from 'bcryptjs';
import conectaBD from '../config/dbConexao.js';

// Lista usuários sem retornar suas senhas
export async function listarUsuarios() {
    const bd = await conectaBD();

    const resultado = await bd.request().query(`
        SELECT
            id,
            cpf,
            nomeCompleto,
            dataAniversario,
            celular,
            email,
            login,
            dataCadastro,
            dataAcesso
        FROM Usuario
    `);

    return resultado.recordset;
}

// Cadastra um novo usuário com senha criptografada
export async function cadastrarUsuario(dados) {
    const bd = await conectaBD();

    const senhaCriptografada = await bcrypt.hash(dados.senha, 10);

    const resultado = await bd.request()
        .input('cpf', mssql.VarChar, dados.cpf)
        .input('nomeCompleto', mssql.VarChar, dados.nomeCompleto)
        .input('dataAniversario', mssql.Date, dados.dataAniversario)
        .input('celular', mssql.VarChar, dados.celular)
        .input('email', mssql.VarChar, dados.email)
        .input('login', mssql.VarChar, dados.login)
        .input('senha', mssql.VarChar(255), senhaCriptografada)
        .query(`
            INSERT INTO Usuario (
                cpf,
                nomeCompleto,
                dataAniversario,
                celular,
                email,
                login,
                senha,
                dataCadastro,
                dataAcesso
            )
            VALUES (
                @cpf,
                @nomeCompleto,
                @dataAniversario,
                @celular,
                @email,
                @login,
                @senha,
                GETDATE(),
                NULL
            );

            SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
        `);

    return resultado.recordset[0];
}
