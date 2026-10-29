// Node.js/src/models/statusModel.js
//
// Cadastro e listagem de Status de reserva (Livre, Ocupado, Bloqueado,
// Reservado ...). A tabela dbo.Status tem idStatus (automático) e
// nomeStatus (até 30 caracteres, único).
import mssql from 'mssql';
import conectaBD from '../config/dbConexao.js';

// Lista todos os status
export async function listarStatus() {
    const bd = await conectaBD();

    const resultado = await bd.request().query(`
        SELECT idStatus, nomeStatus
        FROM dbo.Status
        ORDER BY idStatus;
    `);

    return resultado.recordset;
}

// Cadastra um novo status
export async function cadastrarStatus(nomeStatus) {
    const bd = await conectaBD();

    // Não deixa cadastrar o mesmo nome duas vezes (sem diferenciar
    // maiúsculas de minúsculas)
    const existente = await bd.request()
        .input('nomeStatus', mssql.VarChar(30), nomeStatus)
        .query(`
            SELECT idStatus
            FROM dbo.Status
            WHERE nomeStatus = @nomeStatus;
        `);

    if (existente.recordset.length) {
        throw new Error('Já existe um status com esse nome.');
    }

    const resultado = await bd.request()
        .input('nomeStatus', mssql.VarChar(30), nomeStatus)
        .query(`
            INSERT INTO dbo.Status (nomeStatus)
            OUTPUT INSERTED.idStatus, INSERTED.nomeStatus
            VALUES (@nomeStatus);
        `);

    return resultado.recordset[0];
}
