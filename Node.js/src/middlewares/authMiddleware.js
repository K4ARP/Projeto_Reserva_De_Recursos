
import jwt from 'jsonwebtoken';

export function autenticarToken(req, res, next) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
        return res.status(401).json({
            mensagem: 'Token não informado.'
        });
    }

    const token = cabecalho.slice(7);
    const segredo = process.env.JWT_SECRET;

    if (!segredo) {
        return res.status(500).json({
            mensagem: 'Autenticação não configurada no servidor.'
        });
    }

    try {
        req.usuarioAutenticado = jwt.verify(token, segredo);
        return next();
    } catch {
        return res.status(401).json({
            mensagem: 'Token inválido ou expirado.'
        });
    }
}
