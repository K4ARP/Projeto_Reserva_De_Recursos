
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import conectaBD from './src/config/dbConexao.js';
import usuarioRoute from './src/routes/usuarioRoute.js';
import loginRoute from './src/routes/loginRoute.js';
import recursoRoute from './src/routes/recursoRoute.js';
import { autenticarToken } from './src/middlewares/authMiddleware.js';

const app = express();
const PORTA = process.env.PORTA || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    return res.status(200).json({
        mensagem: 'API de Reserva de Laboratórios e Salas funcionando!',
    });
});

app.get('/teste-banco', async (req, res) => {
    try {
        const bd = await conectaBD();
        await bd.request().query('SELECT 1 AS teste');

        return res.status(200).json({
            mensagem: 'API conectada ao SQL Server com sucesso!',
        });
    } catch (erro) {
        console.error('Erro ao testar o banco:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao conectar ao banco de dados.',
        });
    }
});

// Cadastro e consulta de usuários.
app.use('/usuarios', usuarioRoute);

// Login.
app.use('/login', loginRoute);

// Cadastro e consulta de salas e laboratórios.
app.use('/recursos', recursoRoute);

// Rota protegida para testar a autenticação.
app.get('/perfil', autenticarToken, (req, res) => {
    return res.status(200).json({
        mensagem: 'Token válido!',
        usuario: req.usuarioAutenticado,
    });
});

// Retorna uma mensagem clara para rotas inexistentes.
app.use((req, res) => {
    return res.status(404).json({
        mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    });
});

app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
