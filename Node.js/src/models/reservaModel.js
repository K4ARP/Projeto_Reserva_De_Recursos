
import mssql from 'mssql';
import conectaBD from '../config/dbConexao.js';

function normalizarHorario(horario) {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario || '')) {
        throw new Error('Horário inválido. Use o formato HH:mm.');
    }

    return horario.length === 5 ? `${horario}:00` : horario;
}

function validarIntervalo(inicio, fim) {
    if (inicio >= fim) {
        throw new Error('O horário final deve ser posterior ao inicial.');
    }
}

// Confere se a data está no formato AAAA-MM-DD e com um ano razoável.
// Evita o erro técnico do SQL Server ("Out of range") quando chega uma
// data como 22026-09-28 e devolve uma mensagem clara para o usuário.
function validarData(data) {
    const valida = /^\d{4}-\d{2}-\d{2}$/.test(data || '');
    const ano = Number(String(data || '').slice(0, 4));

    if (!valida || ano < 2000 || ano > 2100) {
        throw new Error('Data inválida. Use o formato AAAA-MM-DD com um ano de 4 dígitos.');
    }
}

function obterTabela(tipo) {
    if (tipo === 'sala') {
        return { tabela: 'dbo.Sala', colunaReserva: 'codigoSala' };
    }

    if (tipo === 'laboratorio') {
        return {
            tabela: 'dbo.Laboratorio',
            colunaReserva: 'codigoLaboratorio'
        };
    }

    throw new Error('Tipo de recurso inválido.');
}

export async function listarRecursosDisponiveis(tipo, data, inicio, fim) {
    const bd = await conectaBD();
    const recurso = obterTabela(tipo);
    const horarioInicio = normalizarHorario(inicio);
    const horarioFim = normalizarHorario(fim);

    validarIntervalo(horarioInicio, horarioFim);
    validarData(data);

    const pedido = bd.request();
    pedido.input('dataReserva', mssql.Date, data);
    pedido.input('horarioInicio', mssql.VarChar(8), horarioInicio);
    pedido.input('horarioFim', mssql.VarChar(8), horarioFim);

    const resultado = await pedido.query(`
        SELECT
            r.codigo,
            r.nome,
            r.capacidade,
            r.localizacao,
            '${tipo}' AS tipo
        FROM ${recurso.tabela} AS r
        WHERE r.ativo = 1
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.Reserva AS reserva
              INNER JOIN dbo.Status AS st
                  ON st.idStatus = reserva.idStatus
              WHERE reserva.${recurso.colunaReserva} = r.codigo
                AND reserva.dataReserva = @dataReserva
                AND reserva.horarioInicio < @horarioFim
                AND reserva.horarioFim > @horarioInicio
                -- Só uma reserva com status 'Livre' libera o recurso.
                -- Qualquer outro status (Reservado, Ocupado, Bloqueado)
                -- deixa o recurso indisponível naquele horário.
                AND st.nomeStatus <> 'Livre'
          )
        ORDER BY r.nome;
    `);

    return resultado.recordset;
}

export async function criarReserva(dados) {
    const bd = await conectaBD();

    const {
        idUsuario,
        codigoSala,
        codigoLaboratorio,
        dataReserva,
        horarioInicio,
        horarioFim
    } = dados;

    if (
        !idUsuario ||
        !dataReserva ||
        !horarioInicio ||
        !horarioFim
    ) {
        throw new Error('Preencha todos os dados da reserva.');
    }

    const temSala = codigoSala !== undefined &&
        codigoSala !== null && codigoSala !== '';

    const temLaboratorio = codigoLaboratorio !== undefined &&
        codigoLaboratorio !== null && codigoLaboratorio !== '';

    if (temSala === temLaboratorio) {
        throw new Error('Selecione uma sala ou um laboratório.');
    }

    const codigo = Number(temSala ? codigoSala : codigoLaboratorio);

    if (!Number.isInteger(codigo) || codigo <= 0) {
        throw new Error('Código de recurso inválido.');
    }

    const inicio = normalizarHorario(horarioInicio);
    const fim = normalizarHorario(horarioFim);
    validarIntervalo(inicio, fim);
    validarData(dataReserva);

    const coluna = temSala ? 'codigoSala' : 'codigoLaboratorio';

    const statusResultado = await bd.request()
        .input('nomeStatus', mssql.VarChar(50), 'Reservado')
        .query(`
            SELECT idStatus
            FROM dbo.Status
            WHERE nomeStatus = @nomeStatus;
        `);

    if (!statusResultado.recordset.length) {
        throw new Error("O status 'Reservado' não existe na tabela Status.");
    }

    const idStatus = statusResultado.recordset[0].idStatus;

    const pedido = bd.request();
    pedido.input('codigo', mssql.Int, codigo);
    pedido.input('dataReserva', mssql.Date, dataReserva);
    pedido.input('horarioInicio', mssql.VarChar(8), inicio);
    pedido.input('horarioFim', mssql.VarChar(8), fim);

    const conflito = await pedido.query(`
        SELECT TOP 1 r.idReserva
        FROM dbo.Reserva AS r
        INNER JOIN dbo.Status AS st
            ON st.idStatus = r.idStatus
        WHERE r.${coluna} = @codigo
          AND r.dataReserva = @dataReserva
          AND r.horarioInicio < @horarioFim
          AND r.horarioFim > @horarioInicio
          -- Mesma regra da lista de disponíveis: só 'Livre' não bloqueia.
          AND st.nomeStatus <> 'Livre';
    `);

    if (conflito.recordset.length) {
        throw new Error('Esse recurso já está reservado nesse horário.');
    }

    const insercao = bd.request();
    insercao.input('idUsuario', mssql.Int, Number(idUsuario));
    insercao.input('dataReserva', mssql.Date, dataReserva);
    insercao.input('horarioInicio', mssql.VarChar(8), inicio);
    insercao.input('horarioFim', mssql.VarChar(8), fim);
    insercao.input('idStatus', mssql.Int, idStatus);
    insercao.input('codigo', mssql.Int, codigo);

    const resultado = await insercao.query(`
        INSERT INTO dbo.Reserva (
            idUsuario,
            codigoSala,
            codigoLaboratorio,
            dataReserva,
            horarioInicio,
            horarioFim,
            idStatus
        )
        OUTPUT INSERTED.idReserva
        VALUES (
            @idUsuario,
            ${temSala ? '@codigo' : 'NULL'},
            ${temLaboratorio ? '@codigo' : 'NULL'},
            @dataReserva,
            @horarioInicio,
            @horarioFim,
            @idStatus
        );
    `);

    return { idReserva: resultado.recordset[0].idReserva };
}

export async function listarReservas(filtros = {}) {
    const bd = await conectaBD();

    const { tipo, codigo, data, inicio, fim } = filtros;
    const pedido = bd.request();
    const condicoes = [];

    if (tipo && tipo !== 'todos') {
        if (tipo !== 'sala' && tipo !== 'laboratorio') {
            throw new Error('Tipo de recurso inválido.');
        }

        condicoes.push(
            tipo === 'sala'
                ? 'r.codigoSala IS NOT NULL'
                : 'r.codigoLaboratorio IS NOT NULL'
        );
    }

    if (codigo !== undefined && codigo !== '') {
        const codigoNumero = Number(codigo);

        if (!Number.isInteger(codigoNumero) || codigoNumero <= 0) {
            throw new Error('Código de recurso inválido.');
        }

        pedido.input('codigo', mssql.Int, codigoNumero);

        if (tipo === 'sala') {
            condicoes.push('r.codigoSala = @codigo');
        } else if (tipo === 'laboratorio') {
            condicoes.push('r.codigoLaboratorio = @codigo');
        } else {
            condicoes.push(
                '(r.codigoSala = @codigo OR r.codigoLaboratorio = @codigo)'
            );
        }
    }

    if (data) {
        pedido.input('dataReserva', mssql.Date, data);
        condicoes.push('r.dataReserva = @dataReserva');
    }

    if (inicio || fim) {
        if (!inicio || !fim) {
            throw new Error('Informe o horário inicial e o horário final.');
        }

        const horarioInicio = normalizarHorario(inicio);
        const horarioFim = normalizarHorario(fim);
        validarIntervalo(horarioInicio, horarioFim);

        pedido.input('horarioInicio', mssql.VarChar(8), horarioInicio);
        pedido.input('horarioFim', mssql.VarChar(8), horarioFim);

        condicoes.push('r.horarioInicio < @horarioFim');
        condicoes.push('r.horarioFim > @horarioInicio');
    }

    const where = condicoes.length
        ? `WHERE ${condicoes.join(' AND ')}`
        : '';

    const resultado = await pedido.query(`
        SELECT
            r.idReserva,
            r.idUsuario,
            u.nomeCompleto,
            r.codigoLaboratorio,
            r.codigoSala,
            CASE
                WHEN r.codigoLaboratorio IS NOT NULL THEN l.nome
                WHEN r.codigoSala IS NOT NULL THEN s.nome
                ELSE 'Recurso não identificado'
            END AS nomeRecurso,
            CASE
                WHEN r.codigoLaboratorio IS NOT NULL THEN 'laboratorio'
                WHEN r.codigoSala IS NOT NULL THEN 'sala'
                ELSE 'desconhecido'
            END AS tipoRecurso,
            CASE
                WHEN r.codigoLaboratorio IS NOT NULL
                    THEN r.codigoLaboratorio
                ELSE r.codigoSala
            END AS codigo,
            r.dataReserva,
            CONVERT(VARCHAR(5), r.horarioInicio, 108) AS horarioInicio,
            CONVERT(VARCHAR(5), r.horarioFim, 108) AS horarioFim,
            r.idStatus,
            st.nomeStatus AS status
        FROM dbo.Reserva AS r
        LEFT JOIN dbo.Usuario AS u ON u.id = r.idUsuario
        LEFT JOIN dbo.Status AS st ON st.idStatus = r.idStatus
        LEFT JOIN dbo.Laboratorio AS l
            ON l.codigo = r.codigoLaboratorio
        LEFT JOIN dbo.Sala AS s
            ON s.codigo = r.codigoSala
        ${where}
        ORDER BY r.dataReserva DESC, r.horarioInicio DESC;
    `);

    return resultado.recordset;
}
