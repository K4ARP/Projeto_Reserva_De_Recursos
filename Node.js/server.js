
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import usuarioRoute from './src/routes/usuarioRoute.js';
import loginRoute from './src/routes/loginRoute.js';
import recursoRoute from './src/routes/recursoRoute.js';
import reservaRoute from './src/routes/reservaRoute.js';
import consultaReservaRoute from './src/routes/consultaReservaRoute.js';

const app = express();
const PORTA = process.env.PORTA || 8080;

// Configurações gerais
app.use(cors());
app.use(express.json());

// Rota inicial para verificar se a API está funcionando
app.get('/', (req, res) => {
    res.status(200).json({
        mensagem: 'API de Reserva de Salas e Laboratórios funcionando!'
    });
});

// Rotas de usuários
app.use('/usuarios', usuarioRoute);

// Rota de login
app.use('/login', loginRoute);

// Rotas de cadastro e consulta de recursos
app.use('/recursos', recursoRoute);

// Rotas de cadastro e disponibilidade de reservas
app.use('/reservas', reservaRoute);

// Rota separada para consultar reservas cadastradas
app.use('/consulta-reservas', consultaReservaRoute);

// Tratamento de rotas não encontradas
app.use((req, res) => {
    res.status(404).json({
        mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}`
    });
});

// Inicialização do servidor
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
