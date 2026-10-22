
import {
    listarRecursosDisponiveis,
    criarReserva,
    listarReservas as buscarReservas
} from '../models/reservaModel.js';

export async function listarDisponiveis(req, res) {
    try {
        const { tipo, data, inicio, fim } = req.query;

        if (!tipo || !data || !inicio || !fim) {
            return res.status(400).json({
                mensagem: 'Informe o tipo, a data e os horários da consulta.'
            });
        }

        const recursos = await listarRecursosDisponiveis(
            tipo,
            data,
            inicio,
            fim
        );

        return res.status(200).json(recursos);
    } catch (erro) {
        console.error('Erro ao consultar recursos disponíveis:', erro);

        return res.status(400).json({
            mensagem: erro.message || 'Erro ao consultar recursos.'
        });
    }
}

export async function cadastrarReserva(req, res) {
    try {
        const {
            tipo,
            codigo,
            data,
            inicio,
            fim,
            codigoSala,
            codigoLaboratorio,
            dataReserva,
            horarioInicio,
            horarioFim
        } = req.body;

        const idUsuario = req.usuario?.id ?? req.body.idUsuario;

        const dados = {
            idUsuario,
            codigoSala: tipo === 'sala'
                ? (codigoSala ?? codigo)
                : codigoSala,
            codigoLaboratorio: tipo === 'laboratorio'
                ? (codigoLaboratorio ?? codigo)
                : codigoLaboratorio,
            dataReserva: dataReserva ?? data,
            horarioInicio: horarioInicio ?? inicio,
            horarioFim: horarioFim ?? fim
        };

        const reserva = await criarReserva(dados);

        return res.status(201).json({
            mensagem: 'Reserva cadastrada com sucesso!',
            reserva
        });
    } catch (erro) {
        console.error('Erro ao cadastrar reserva:', erro);

        return res.status(400).json({
            mensagem: erro.message || 'Erro ao cadastrar reserva.'
        });
    }
}

export async function listarReservasController(req, res) {
    try {
        const reservas = await buscarReservas(req.query);

        return res.status(200).json(reservas);
    } catch (erro) {
        console.error('Erro ao consultar reservas:', erro);

        return res.status(400).json({
            mensagem: erro.message || 'Erro ao consultar reservas.'
        });
    }
}
