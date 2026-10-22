
import { Router } from 'express';

import {
    listarDisponiveis,
    cadastrarReserva,
    listarReservasController
} from '../controllers/reservaController.js';

import { autenticarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Consulta recursos livres para uma data e um intervalo de horário.
router.get('/disponiveis', listarDisponiveis);

// Consulta reservas com filtros; exige usuário autenticado.
router.get('/', autenticarToken, listarReservasController);

// Cadastra uma reserva; exige usuário autenticado.
router.post('/', autenticarToken, cadastrarReserva);

export default router;
