// Node.js/src/controllers/reservaController.js
//
// Controller de reservas: recebe a requisição HTTP (req), chama o model
// (que conversa com o banco) e devolve a resposta (res).

// Importa as funções do model. O "as buscarReservas" é só um apelido, para
// não bater com o nome da função do controller (listarReservasController).
import {
    listarRecursosDisponiveis,
    criarReserva,
    listarReservas as buscarReservas
} from '../models/reservaModel.js';

// ---------------------------------------------------------------------
// GET /reservas/disponiveis?tipo=sala&data=2026-10-30&inicio=08:00&fim=10:00
// Lista os recursos (salas ou laboratórios) LIVRES naquele dia e horário.
// ---------------------------------------------------------------------
export async function listarDisponiveis(req, res) {
    try {
        // Os parâmetros vêm na URL (query string)
        //   modo = 'horario' (um dia, de uma hora a outra)  ou
        //          'dias'    (do dia inicial ao final, dia inteiro)
        const { tipo, data, dataFinal, inicio, fim } = req.query;
        const modo = req.query.modo === 'dias' ? 'dias' : 'horario';

        // Campos obrigatórios de cada modo; se faltar algum, responde 400
        const faltando = modo === 'dias'
            ? !tipo || !data || !dataFinal
            : !tipo || !data || !inicio || !fim;

        if (faltando) {
            return res.status(400).json({
                mensagem: 'Informe o tipo, as datas e os horários da consulta.'
            });
        }

        // O model faz o SELECT no banco
        const recursos = await listarRecursosDisponiveis({
            tipo,
            modo,
            data,
            dataFinal,
            inicio,
            fim
        });

        return res.status(200).json(recursos);
    } catch (erro) {
        console.error('Erro ao consultar recursos disponíveis:', erro);

        return res.status(400).json({
            mensagem: erro.message || 'Erro ao consultar recursos.'
        });
    }
}

// ---------------------------------------------------------------------
// POST /reservas
// Cadastra uma reserva. A rota usa o middleware autenticarToken, que já
// validou o token JWT antes de chegar aqui.
// ---------------------------------------------------------------------
export async function cadastrarReserva(req, res) {
    try {
        // Dados enviados pelo React no corpo (body) da requisição.
        // Aceita dois formatos de nomes (tipo/codigo/data/inicio/fim OU
        // codigoSala/codigoLaboratorio/dataReserva/horarioInicio/horarioFim).
        const {
            tipo,
            codigo,
            modo,
            data,
            dataFinal,
            inicio,
            fim,
            codigoSala,
            codigoLaboratorio,
            dataReserva,
            horarioInicio,
            horarioFim
        } = req.body;

        // =============================================================
        // CORREÇÃO DO ERRO AO RESERVAR
        // O middleware (authMiddleware.js) guarda os dados do token em
        // "req.usuarioAutenticado". Antes, este código lia "req.usuario",
        // que nunca existe: o id ficava undefined e o model respondia
        // "Preencha todos os dados da reserva.".
        //
        // O id do usuário vem SOMENTE do token. Não aceitamos mais
        // "idUsuario" do body, senão qualquer pessoa poderia reservar
        // em nome de outro usuário.
        // =============================================================
        const idUsuario = req.usuarioAutenticado?.id;

        // Monta o objeto no formato que o model espera
        const dados = {
            idUsuario,
            // Se o tipo é sala, o "codigo" enviado é o da sala
            codigoSala: tipo === 'sala'
                ? (codigoSala ?? codigo)
                : codigoSala,
            // Se o tipo é laboratório, o "codigo" enviado é o do laboratório
            codigoLaboratorio: tipo === 'laboratorio'
                ? (codigoLaboratorio ?? codigo)
                : codigoLaboratorio,
            // 'dias' = dia inteiro do dia inicial ao final; senão, por horário
            modo: modo === 'dias' ? 'dias' : 'horario',
            dataReserva: dataReserva ?? data,
            dataFinal,
            horarioInicio: horarioInicio ?? inicio,
            horarioFim: horarioFim ?? fim
        };

        // O model valida, confere conflito de horário e faz o INSERT
        const reserva = await criarReserva(dados);

        // 201 = criado com sucesso
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

// ---------------------------------------------------------------------
// GET /reservas?tipo=&codigo=&data=&inicio=&fim=
// Consulta reservas com filtros opcionais (exige token).
// ---------------------------------------------------------------------
export async function listarReservasController(req, res) {
    try {
        // Os filtros vão direto para o model, que monta o WHERE
        const reservas = await buscarReservas(req.query);

        return res.status(200).json(reservas);
    } catch (erro) {
        console.error('Erro ao consultar reservas:', erro);

        return res.status(400).json({
            mensagem: erro.message || 'Erro ao consultar reservas.'
        });
    }
}
