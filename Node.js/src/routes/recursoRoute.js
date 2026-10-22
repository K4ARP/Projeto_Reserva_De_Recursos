
import { Router } from 'express';

import {
  listar,
  listarTodos,
  cadastrar,
  alterarAtivo,
} from '../controllers/recursoController.js';

const router = Router();

router.get('/', listarTodos);
router.get('/:tipo', listar);
router.post('/:tipo', cadastrar);
router.patch('/:tipo/:codigo/ativo', alterarAtivo);

export default router;
