// Node.js/src/routes/statusRoute.js
import { Router } from 'express';
import { listar, cadastrar } from '../controllers/statusController.js';

const router = Router();

router.get('/', listar);
router.post('/', cadastrar);

export default router;
