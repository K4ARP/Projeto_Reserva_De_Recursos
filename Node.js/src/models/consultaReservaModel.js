// Node.js/src/models/consultaReservaModel.js
//
// Consulta de reservas para a página "Consultar reservas".
//
// IMPORTANTE: a consulta é SEMPRE das reservas do usuário logado.
// O id dele vem do token (controller) e nunca de um campo digitado,
// então ninguém consegue ver as reservas de outra pessoa.
//
// Filtros opcionais:
//   data         -> data (ou início do período)
//   dataFinal    -> fim do período (usado junto com "data")
//   horario      -> reservas que estão em andamento nesse horário do dia
//   tipoRecurso  -> 'sala' ou 'laboratorio'
//   recurso      -> código OU parte do nome do recurso
import mssql from 'mssql';
import conectaBD from '../config/dbConexao.js';

// Confere o formato AAAA-MM-DD (ano com 4 dígitos)
function validarData(texto, nomeCampo) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto || '')) {
        throw new Error(`${nomeCampo} inválida. Use um ano com 4 dígitos.`);
    }

    const ano = Number(texto.slice(0, 4));
    const data = new Date(`${texto}T00:00:00Z`);

    if (
        Number.isNaN(data.getTime()) ||
        data.toISOString().slice(0, 10) !== texto ||
        ano < 2000 ||
        ano > 2100
    ) {
        throw new Error(`${nomeCampo} inválida.`);
    }
}

export async function consultarReservas(idUsuario, filtros = {}) {
    if (!idUsuario) {
        throw new Error('Usuário não identificado. Faça login novamente.');
    }

    const bd = await conectaBD();
    const request = bd.request();

    // Só as reservas do usuário logado
    request.input('idUsuario', mssql.Int, Number(idUsuario));

    // "WHERE ..." vai crescendo com os filtros preenchidos
    let where = 'WHERE r.idUsuario = @idUsuario';

    // Data ou período: mostra as reservas que PASSAM por esse intervalo
    // (uma reserva de 10/11 a 14/11 aparece ao buscar o dia 12/11).
    if (filtros.data) {
        validarData(filtros.data, 'Data');
        request.input('data', mssql.VarChar(10), filtros.data);

        let dataFinal = filtros.data;

        if (filtros.dataFinal) {
            validarData(filtros.dataFinal, 'Data final');

            if (filtros.dataFinal < filtros.data) {
                throw new Error('A data final não pode ser anterior à inicial.');
            }

            dataFinal = filtros.dataFinal;
        }

        request.input('dataFinal', mssql.VarChar(10), dataFinal);
        where += ` AND r.dataReserva <= CONVERT(date, @dataFinal, 23)
                   AND ISNULL(r.dataFim, r.dataReserva) >= CONVERT(date, @data, 23)`;
    }

    // Tipo: sala ou laboratório
    if (filtros.tipoRecurso === 'sala') {
        where += ' AND r.codigoSala IS NOT NULL';
    } else if (filtros.tipoRecurso === 'laboratorio') {
        where += ' AND r.codigoLaboratorio IS NOT NULL';
    }

    // Recurso: pelo nome; se for só número, também pelo código
    if (filtros.recurso?.trim()) {
        const texto = filtros.recurso.trim().slice(0, 100);

        request.input('recursoNome', mssql.VarChar(100), `%${texto}%`);

        if (/^\d{1,9}$/.test(texto)) {
            request.input('recursoCodigo', mssql.Int, Number(texto));
            where += ` AND (COALESCE(s.nome, l.nome) LIKE @recursoNome
                       OR COALESCE(s.codigo, l.codigo) = @recursoCodigo)`;
        } else {
            where += ' AND COALESCE(s.nome, l.nome) LIKE @recursoNome';
        }
    }


    // Horário do dia: a reserva "cobre" esse horário?
    //  - reserva normal (ex.: 08:00 às 10:00): início <= horário < fim
    //  - reserva que vira a noite (ex.: 23:00 às 05:00): horário >= início
    //    OU horário < fim
    //  - dia inteiro (00:00 às 23:59): cobre quase todos os horários
    if (filtros.horario) {
        if (!/^\d{2}:\d{2}(:\d{2})?$/.test(filtros.horario)) {
            throw new Error('Horário inválido. Use o formato HH:mm.');
        }

        request.input('horario', mssql.VarChar(8), filtros.horario);
        where += `
            AND (
                (r.horarioInicio <= r.horarioFim
                    AND CONVERT(time, @horario, 108) >= r.horarioInicio
                    AND CONVERT(time, @horario, 108) < r.horarioFim)
                OR
                (r.horarioInicio > r.horarioFim
                    AND (CONVERT(time, @horario, 108) >= r.horarioInicio
                         OR CONVERT(time, @horario, 108) < r.horarioFim))
            )
        `;
    }

    const resultado = await request.query(`
        SELECT
            r.idReserva,
            u.nomeCompleto AS nomeUsuario,
            -- datas e horários voltam como texto simples (sem fuso horário)
            CONVERT(VARCHAR(10), r.dataReserva, 23) AS dataReserva,
            CONVERT(VARCHAR(10), ISNULL(r.dataFim, r.dataReserva), 23) AS dataFim,
            CONVERT(VARCHAR(5), r.horarioInicio, 108) AS horarioInicio,
            CONVERT(VARCHAR(5), r.horarioFim, 108) AS horarioFim,
            st.nomeStatus,
            CASE
                WHEN r.codigoSala IS NOT NULL
                    THEN 'Sala de Aula'
                ELSE 'Laboratório'
            END AS tipoRecurso,
            COALESCE(s.codigo, l.codigo) AS codigoRecurso,
            COALESCE(s.nome, l.nome) AS nomeRecurso
        FROM dbo.Reserva AS r
        INNER JOIN dbo.Usuario AS u
            ON u.id = r.idUsuario
        INNER JOIN dbo.Status AS st
            ON st.idStatus = r.idStatus
        LEFT JOIN dbo.Sala AS s
            ON s.codigo = r.codigoSala
        LEFT JOIN dbo.Laboratorio AS l
            ON l.codigo = r.codigoLaboratorio
        ${where}
        ORDER BY r.dataReserva DESC, r.horarioInicio;
    `);

    return resultado.recordset;
}

