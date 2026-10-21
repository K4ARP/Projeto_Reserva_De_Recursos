
import mssql from 'mssql';
import conectaBD from '../config/dbConexao.js';

const tabelas = {
    laboratorio: 'Laboratorio',
    sala: 'Sala',
};

function obterTabela(tipo) {
    const tabela = tabelas[tipo];

    if (!tabela) {
        throw new Error('Tipo de recurso inválido.');
    }

    return tabela;
}

// Lista salas ou laboratórios
export async function listarRecursos(tipo) {
    const tabela = obterTabela(tipo);
    const bd = await conectaBD();

    const resultado = await bd.request().query(`
        SELECT codigo, nome, capacidade, localizacao, ativo
        FROM dbo.${tabela}
        ORDER BY codigo
    `);

    return resultado.recordset;
}

// Cadastra uma sala ou laboratório
export async function cadastrarRecurso(tipo, dados) {
    const tabela = obterTabela(tipo);
    const bd = await conectaBD();

    const resultado = await bd.request()
        .input('codigo', mssql.Int, Number(dados.codigo))
        .input('nome', mssql.VarChar(100), dados.nome.trim())
        .input('capacidade', mssql.Int, Number(dados.capacidade))
        .input('localizacao', mssql.VarChar(150), dados.localizacao.trim())
        .input('ativo', mssql.Bit, dados.ativo !== false)
        .query(`
            INSERT INTO dbo.${tabela}
                (codigo, nome, capacidade, localizacao, ativo)
            OUTPUT
                INSERTED.codigo,
                INSERTED.nome,
                INSERTED.capacidade,
                INSERTED.localizacao,
                INSERTED.ativo
            VALUES
                (@codigo, @nome, @capacidade, @localizacao, @ativo)
        `);

    return resultado.recordset[0];
}

// Ativa ou desativa uma sala ou laboratório
export async function atualizarAtivoRecurso(tipo, codigo, ativo) {
    const tabela = obterTabela(tipo);
    const bd = await conectaBD();

    const resultado = await bd.request()
        .input('codigo', mssql.Int, Number(codigo))
        .input('ativo', mssql.Bit, ativo)
        .query(`
            UPDATE dbo.${tabela}
            SET ativo = @ativo
            OUTPUT
                INSERTED.codigo,
                INSERTED.nome,
                INSERTED.capacidade,
                INSERTED.localizacao,
                INSERTED.ativo
            WHERE codigo = @codigo;
        `);

    return resultado.recordset[0] || null;
}
