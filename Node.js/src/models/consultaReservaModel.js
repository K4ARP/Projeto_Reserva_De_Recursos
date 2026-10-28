// Node.js/src/models/consultaReservaModel.js
//
// Consulta de reservas para a página "Consultar reservas".
// Filtros aceitos (todos opcionais): data, usuario, tipoRecurso, horario.
import mssql from 'mssql';
import conectaBD from '../config/dbConexao.js';

export async function consultarReservas(filtros = {}) {
    const bd = await conectaBD();
    const request = bd.request();

    // "WHERE 1 = 1" é um truque: permite ir acrescentando "AND ..." só dos
    // filtros que o usuário preencheu.
    let where = 'WHERE 1 = 1';

    // Filtro por data exata
    if (filtros.data) {
        request.input('data', mssql.Date, filtros.data);
        where += ' AND r.dataReserva = @data';
    }

    // Filtro por parte do nome do usuário (LIKE %texto%)
    if (filtros.usuario?.trim()) {
        request.input(
            'usuario',
            mssql.VarChar(150),
            `%${filtros.usuario.trim()}%`
        );
        where += ' AND u.nomeCompleto LIKE @usuario';
    }

    // Filtro por tipo: sala ou laboratório
    if (filtros.tipoRecurso === 'sala') {
        where += ' AND r.codigoSala IS NOT NULL';
    } else if (filtros.tipoRecurso === 'laboratorio') {
        where += ' AND r.codigoLaboratorio IS NOT NULL';
    }

    // Filtro por horário: reservas que estão em andamento nesse horário
    if (filtros.horario) {
        request.input('horario', mssql.VarChar(8), filtros.horario);
        where += `
            AND CONVERT(time, @horario, 108) >= r.horarioInicio
            AND CONVERT(time, @horario, 108) < r.horarioFim
        `;
    }

    const resultado = await request.query(`
        SELECT
            r.idReserva,
            u.nomeCompleto AS nomeUsuario,
            r.dataReserva,
            -- CORREÇÃO: antes o horário voltava como data completa
            -- (1970-01-01T08:00:00Z). Agora volta no formato 08:00.
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
