
import { consultarReservas } from '../models/consultaReservaModel.js';

export async function listarReservas(req, res) {
    try {
        const reservas = await consultarReservas(req.query);

        return res.status(200).json(reservas);
    } catch (erro) {
        console.error('Erro ao consultar reservas:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao consultar reservas.'
        });
    }
}
