// Node.js/src/models/reservaModel.js
//
// Model de reservas: tudo que conversa com o banco sobre reservas.
//  - listarRecursosDisponiveis: recursos LIVRES em um período
//  - criarReserva:              grava uma reserva (sem conflito)
//  - listarReservas:            consulta reservas com filtros
//
// DOIS MODOS DE RESERVA
//  "horario": um dia, de uma hora até outra. Se a hora final for MENOR
//             que a inicial, a reserva termina no DIA SEGUINTE
//             (ex.: 23:00 até 05:00 = da noite até a madrugada).
//  "dias":    do dia inicial ao dia final (inclusive), DIA INTEIRO.
//
// Como a reserva é guardada na tabela dbo.Reserva:
//   dataReserva + horarioInicio  = começo
//   dataFim     + horarioFim     = fim
// (dia inteiro = 00:00:00 até 23:59:59)
import mssql from 'mssql';
import conectaBD from '../config/dbConexao.js';

// ---------------------------------------------------------------------
// Funções de apoio (validações)
// ---------------------------------------------------------------------

// Aceita "HH:mm" ou "HH:mm:ss" e devolve sempre "HH:mm:ss"
function normalizarHorario(horario) {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario || '')) {
        throw new Error('Horário inválido. Use o formato HH:mm.');
    }

    return horario.length === 5 ? `${horario}:00` : horario;
}

// Confere se a data está no formato AAAA-MM-DD, com ano de 4 dígitos
// e uma data que realmente existe (ex.: não aceita 2026-02-31).
// Evita o erro técnico do SQL Server ("Out of range") e devolve uma
// mensagem clara para o usuário.
function validarData(data) {
    const texto = String(data || '');
    const formatoOk = /^\d{4}-\d{2}-\d{2}$/.test(texto);
    const ano = Number(texto.slice(0, 4));
    const existe = formatoOk &&
        !Number.isNaN(new Date(`${texto}T00:00:00Z`).getTime()) &&
        new Date(`${texto}T00:00:00Z`).toISOString().slice(0, 10) === texto;

    if (!existe || ano < 2000 || ano > 2100) {
        throw new Error(
            'Data inválida. Use o formato AAAA-MM-DD com um ano de 4 dígitos.'
        );
    }
}

// Soma (ou subtrai) dias em uma data AAAA-MM-DD
function somarDias(data, dias) {
    const d = new Date(`${data}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + dias);
    return d.toISOString().slice(0, 10);
}

// Transforma o que o usuário escolheu no período real da reserva.
// Devolve: dataInicio, horarioInicio, dataFim, horarioFim.
function montarPeriodo({ modo, data, dataFinal, inicio, fim }) {
    validarData(data);

    // ---- Por dias: dia inteiro, do dia inicial ao final (inclusive)
    if (modo === 'dias') {
        const dataFim = dataFinal || data;
        validarData(dataFim);

        if (dataFim < data) {
            throw new Error('A data final não pode ser anterior à data inicial.');
        }

        return {
            dataInicio: data,
            horarioInicio: '00:00:00',
            dataFim,
            horarioFim: '23:59:59'
        };
    }

    // ---- Por horário: um dia, de uma hora até outra
    const horarioInicio = normalizarHorario(inicio);
    const horarioFim = normalizarHorario(fim);

    if (horarioInicio === horarioFim) {
        throw new Error('O horário final deve ser diferente do inicial.');
    }

    // Hora final menor que a inicial = termina no dia seguinte
    const dataFim = horarioFim < horarioInicio ? somarDias(data, 1) : data;

    return { dataInicio: data, horarioInicio, dataFim, horarioFim };
}

// Expressões SQL que montam o começo e o fim de uma reserva já gravada
// (data + horário juntos), para comparar períodos que atravessam a meia-noite.
function inicioDaReserva(alias) {
    return `DATEADD(DAY, DATEDIFF(DAY, 0, ${alias}.dataReserva),
                    CAST(${alias}.horarioInicio AS DATETIME2(0)))`;
}

function fimDaReserva(alias) {
    return `DATEADD(DAY, DATEDIFF(DAY, 0, ISNULL(${alias}.dataFim, ${alias}.dataReserva)),
                    CAST(${alias}.horarioFim AS DATETIME2(0)))`;
}

// Descobre a tabela e a coluna da reserva a partir do tipo do recurso
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

// ---------------------------------------------------------------------
// Recursos disponíveis em um período
// dados: { tipo, modo, data, dataFinal, inicio, fim }
// ---------------------------------------------------------------------
export async function listarRecursosDisponiveis(dados) {
    const bd = await conectaBD();
    const recurso = obterTabela(dados.tipo);
    const periodo = montarPeriodo(dados);

    const pedido = bd.request();
    // Datas e horários vão como TEXTO e o próprio SQL converte.
    // Assim não existe diferença de fuso horário entre Node e banco.
    pedido.input(
        'inicioPedido',
        mssql.VarChar(19),
        `${periodo.dataInicio} ${periodo.horarioInicio}`
    );
    pedido.input(
        'fimPedido',
        mssql.VarChar(19),
        `${periodo.dataFim} ${periodo.horarioFim}`
    );

    // Um recurso está disponível quando:
    //  - está ativo, E
    //  - NÃO existe reserva dele que se sobreponha ao período pedido
    //    (começo da reserva < fim do pedido E fim da reserva > começo do pedido).
    // Só uma reserva com status 'Livre' libera o recurso; qualquer outro
    // status (Reservado, Ocupado, Bloqueado) deixa o recurso indisponível.
    const resultado = await pedido.query(`
        SELECT
            r.codigo,
            r.nome,
            r.capacidade,
            r.localizacao,
            '${dados.tipo}' AS tipo
        FROM ${recurso.tabela} AS r
        WHERE r.ativo = 1
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.Reserva AS reserva
              INNER JOIN dbo.Status AS st
                  ON st.idStatus = reserva.idStatus
              WHERE reserva.${recurso.colunaReserva} = r.codigo
                AND ${inicioDaReserva('reserva')}
                        < CONVERT(DATETIME2(0), @fimPedido, 120)
                AND ${fimDaReserva('reserva')}
                        > CONVERT(DATETIME2(0), @inicioPedido, 120)
                AND st.nomeStatus <> 'Livre'
          )
        ORDER BY r.nome;
    `);

    return resultado.recordset;
}

// ---------------------------------------------------------------------
// Cria uma reserva
// ---------------------------------------------------------------------
export async function criarReserva(dados) {
    const bd = await conectaBD();

    const {
        idUsuario,
        codigoSala,
        codigoLaboratorio,
        modo,
        dataReserva,
        dataFinal,
        horarioInicio,
        horarioFim
    } = dados;

    // O idUsuario vem do token (controller). Se faltar, o login expirou.
    if (!idUsuario || !dataReserva) {
        throw new Error('Preencha todos os dados da reserva.');
    }

    if (modo !== 'dias' && (!horarioInicio || !horarioFim)) {
        throw new Error('Preencha todos os dados da reserva.');
    }

    // Tem que vir uma sala OU um laboratório (nunca os dois, nem nenhum)
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

    // Período real da reserva (já trata dia inteiro e virada de dia)
    const periodo = montarPeriodo({
        modo,
        data: dataReserva,
        dataFinal,
        inicio: horarioInicio,
        fim: horarioFim
    });

    const coluna = temSala ? 'codigoSala' : 'codigoLaboratorio';

    // Busca o id do status 'Reservado'
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

    const inicioPedido = `${periodo.dataInicio} ${periodo.horarioInicio}`;
    const fimPedido = `${periodo.dataFim} ${periodo.horarioFim}`;

    // ------------------------------------------------------------------
    // CONFLITO DE HORÁRIO
    // Conferir e gravar acontecem na MESMA transação. Com UPDLOCK e
    // HOLDLOCK, se duas pessoas tentarem reservar o mesmo recurso ao
    // mesmo tempo, a segunda espera a primeira terminar e então enxerga
    // a reserva dela, recebendo o aviso de conflito em vez de duplicar.
    // ------------------------------------------------------------------
    const transacao = new mssql.Transaction(bd);
    await transacao.begin();

    try {
        const conflito = await new mssql.Request(transacao)
            .input('codigo', mssql.Int, codigo)
            .input('inicioPedido', mssql.VarChar(19), inicioPedido)
            .input('fimPedido', mssql.VarChar(19), fimPedido)
            .query(`
                SELECT TOP 1 r.idReserva
                FROM dbo.Reserva AS r WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.Status AS st
                    ON st.idStatus = r.idStatus
                WHERE r.${coluna} = @codigo
                  AND ${inicioDaReserva('r')}
                          < CONVERT(DATETIME2(0), @fimPedido, 120)
                  AND ${fimDaReserva('r')}
                          > CONVERT(DATETIME2(0), @inicioPedido, 120)
                  AND st.nomeStatus <> 'Livre';
            `);

        if (conflito.recordset.length) {
            throw new Error('Esse recurso já está reservado nesse período.');
        }

        const resultado = await new mssql.Request(transacao)
            .input('idUsuario', mssql.Int, Number(idUsuario))
            .input('codigo', mssql.Int, codigo)
            .input('dataInicio', mssql.VarChar(10), periodo.dataInicio)
            .input('dataFim', mssql.VarChar(10), periodo.dataFim)
            .input('horarioInicio', mssql.VarChar(8), periodo.horarioInicio)
            .input('horarioFim', mssql.VarChar(8), periodo.horarioFim)
            .input('idStatus', mssql.Int, idStatus)
            .query(`
                INSERT INTO dbo.Reserva (
                    idUsuario,
                    codigoSala,
                    codigoLaboratorio,
                    dataReserva,
                    dataFim,
                    horarioInicio,
                    horarioFim,
                    idStatus
                )
                OUTPUT INSERTED.idReserva
                VALUES (
                    @idUsuario,
                    ${temSala ? '@codigo' : 'NULL'},
                    ${temLaboratorio ? '@codigo' : 'NULL'},
                    CONVERT(date, @dataInicio, 23),
                    CONVERT(date, @dataFim, 23),
                    CONVERT(time, @horarioInicio, 108),
                    CONVERT(time, @horarioFim, 108),
                    @idStatus
                );
            `);

        await transacao.commit();

        return { idReserva: resultado.recordset[0].idReserva };
    } catch (erro) {
        // Qualquer erro desfaz tudo o que a transação tinha feito
        try {
            await transacao.rollback();
        } catch {
            // se o rollback também falhar, mostra o erro original
        }

        throw erro;
    }
}

// ---------------------------------------------------------------------
// Consulta de reservas (rota GET /reservas)
// Filtros opcionais: tipo, codigo, data
// (a tela "Consultar reservas" usa a rota /consulta-reservas)
// ---------------------------------------------------------------------
export async function listarReservas(filtros = {}) {
    const bd = await conectaBD();

    const { tipo, codigo, data } = filtros;
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

    // Reservas que passam pela data informada
    if (data) {
        validarData(data);
        pedido.input('dataReserva', mssql.VarChar(10), data);
        condicoes.push(`CONVERT(date, @dataReserva, 23) BETWEEN r.dataReserva
                        AND ISNULL(r.dataFim, r.dataReserva)`);
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
            CONVERT(VARCHAR(10), r.dataReserva, 23) AS dataReserva,
            CONVERT(VARCHAR(10), ISNULL(r.dataFim, r.dataReserva), 23) AS dataFim,
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
