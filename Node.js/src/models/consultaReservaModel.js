
import mssql from 'mssql';
import conectaBD from '../config/dbConexao.js';

export async function consultarReservas(filtros = {}) {
    const bd = await conectaBD();
    const request = bd.request();

    let where = 'WHERE 1 = 1';

    if (filtros.data) {
        request.input('data', mssql.Date, filtros.data);
        where += ' AND r.dataReserva = @data';
    }

    if (filtros.usuario?.trim()) {
        request.input(
            'usuario',
            mssql.VarChar(150),
            `%${filtros.usuario.trim()}%`
        );
        where += ' AND u.nomeCompleto LIKE @usuario';
    }

    if (filtros.tipoRecurso === 'sala') {
        where += ' AND r.codigoSala IS NOT NULL';
    } else if (filtros.tipoRecurso === 'laboratorio') {
        where += ' AND r.codigoLaboratorio IS NOT NULL';
    }

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
            r.horarioInicio,
            r.horarioFim,
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
