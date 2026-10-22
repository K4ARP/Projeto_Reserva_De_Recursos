
import { Router } from 'express';
import { listarReservas } from '../controllers/consultaReservaController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', autenticarToken, listarReservas);

export default router;
