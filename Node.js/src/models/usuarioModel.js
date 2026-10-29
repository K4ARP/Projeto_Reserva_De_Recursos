// Node.js/src/models/usuarioModel.js
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

// Diz se já existe usuário com o mesmo CPF e/ou o mesmo login
export async function verificarDuplicidade(cpf, login) {
    const bd = await conectaBD();

    const resultado = await bd.request()
        .input('cpf', mssql.VarChar(14), cpf)
        .input('login', mssql.VarChar(50), login)
        .query(`
            SELECT
                CASE WHEN EXISTS (SELECT 1 FROM Usuario WHERE cpf = @cpf)
                     THEN 1 ELSE 0 END AS cpf,
                CASE WHEN EXISTS (SELECT 1 FROM Usuario WHERE [login] = @login)
                     THEN 1 ELSE 0 END AS [login];
        `);

    return {
        cpf: Boolean(resultado.recordset[0].cpf),
        login: Boolean(resultado.recordset[0].login)
    };
}

// Cadastra um novo usuário com senha criptografada
export async function cadastrarUsuario(dados) {
    const bd = await conectaBD();

    // A senha nunca é guardada pura: vira um "hash" com bcrypt
    const senhaCriptografada = await bcrypt.hash(dados.senha, 10);

    // Cada parâmetro tem o mesmo tamanho da coluna da tabela
    const resultado = await bd.request()
        .input('cpf', mssql.VarChar(14), dados.cpf)
        .input('nomeCompleto', mssql.VarChar(150), dados.nomeCompleto)
        // data como texto AAAA-MM-DD; o SQL converte (sem fuso horário)
        .input('dataAniversario', mssql.VarChar(10), dados.dataAniversario)
        .input('celular', mssql.VarChar(20), dados.celular)
        .input('email', mssql.VarChar(150), dados.email)
        .input('login', mssql.VarChar(50), dados.login)
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
                CONVERT(date, @dataAniversario, 23),
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
