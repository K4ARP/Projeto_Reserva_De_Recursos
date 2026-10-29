// Node.js/src/controllers/consultaReservaController.js
//
// GET /consulta-reservas?data=&dataFinal=&horario=&tipoRecurso=&recurso=&status=
// Exige token (a rota usa o middleware autenticarToken).
// Devolve SÓ as reservas do usuário logado: o id vem do token.
import { consultarReservas } from '../models/consultaReservaModel.js';

export async function listarReservas(req, res) {
    try {
        const idUsuario = req.usuarioAutenticado?.id;

        const reservas = await consultarReservas(idUsuario, req.query);

        return res.status(200).json(reservas);
    } catch (erro) {
        console.error('Erro ao consultar reservas:', erro);

        // Erros de validação (data/horário inválidos) são do pedido
        // do usuário: respondemos 400 com a mensagem explicando.
        const validacao = /inválid|anterior|posterior|Usuário não/i.test(erro.message);

        return res.status(validacao ? 400 : 500).json({
            mensagem: validacao
                ? erro.message
                : 'Erro ao consultar reservas.'
        });
    }
}
