// Node.js/src/controllers/usuarioController.js
//
// Cadastro e listagem de usuários do sistema.
// Os limites de tamanho abaixo são os mesmos das colunas da tabela
// dbo.Usuario e os mesmos usados pelo formulário do React.
import {
    listarUsuarios,
    cadastrarUsuario,
    verificarDuplicidade
} from '../models/usuarioModel.js';

// Fica só com os números de um texto ("123.456" -> "123456")
function somenteDigitos(texto) {
    return String(texto || '').replace(/\D/g, '');
}

// 12345678901 -> 123.456.789-01
function formatarCpf(d) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// 19999998888 -> (19) 99999-8888   |   1933334444 -> (19) 3333-4444
function formatarCelular(d) {
    return d.length === 11
        ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
        : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

// GET /usuarios -> lista (sem as senhas)
export async function listar(req, res) {
    try {
        const usuarios = await listarUsuarios();

        return res.status(200).json(usuarios);
    } catch (erro) {
        console.error('Erro ao listar usuários:', erro.message);

        return res.status(500).json({
            mensagem: 'Erro ao buscar usuários.'
        });
    }
}

// POST /usuarios -> cadastra um usuário novo
export async function cadastrar(req, res) {
    try {
        const {
            cpf,
            nomeCompleto,
            dataAniversario,
            celular,
            email,
            login,
            senha
        } = req.body;

        // 1) Campos obrigatórios
        if (
            !cpf ||
            !nomeCompleto ||
            !dataAniversario ||
            !celular ||
            !email ||
            !login ||
            !senha
        ) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }

        // 2) CPF: 11 números (guardado como 000.000.000-00)
        const cpfDigitos = somenteDigitos(cpf);
        if (cpfDigitos.length !== 11) {
            return res.status(400).json({
                mensagem: 'CPF inválido. Informe os 11 números.'
            });
        }

        // 3) Nome completo: de 3 a 150 caracteres, só letras e separadores
        const nome = String(nomeCompleto).trim().replace(/\s+/g, ' ');
        if (
            nome.length < 3 ||
            nome.length > 150 ||
            !/^[\p{L}][\p{L} .'-]*$/u.test(nome)
        ) {
            return res.status(400).json({
                mensagem:
                    'Nome inválido. Use apenas letras (de 3 a 150 caracteres).'
            });
        }

        // 4) Data de nascimento: AAAA-MM-DD, existente, entre 1900 e hoje
        const textoData = String(dataAniversario);
        const data = new Date(`${textoData}T00:00:00Z`);
        const hoje = new Date().toISOString().slice(0, 10);

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(textoData) ||
            Number.isNaN(data.getTime()) ||
            data.toISOString().slice(0, 10) !== textoData ||
            textoData < '1900-01-01' ||
            textoData > hoje
        ) {
            return res.status(400).json({
                mensagem: 'Data de nascimento inválida.'
            });
        }

        // 5) Celular: 10 ou 11 números (guardado como (00) 00000-0000)
        const celularDigitos = somenteDigitos(celular);
        if (celularDigitos.length < 10 || celularDigitos.length > 11) {
            return res.status(400).json({
                mensagem: 'Celular inválido. Informe o DDD e o número.'
            });
        }

        // 6) E-mail: formato válido, até 150 caracteres
        const emailLimpo = String(email).trim();
        if (
            emailLimpo.length > 150 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)
        ) {
            return res.status(400).json({
                mensagem: 'E-mail inválido.'
            });
        }

        // 7) Login: de 3 a 50 caracteres, sem espaços
        const loginLimpo = String(login).trim();
        if (
            loginLimpo.length < 3 ||
            loginLimpo.length > 50 ||
            !/^[A-Za-z0-9._-]+$/.test(loginLimpo)
        ) {
            return res.status(400).json({
                mensagem:
                    'Login inválido. Use de 3 a 50 letras, números, ponto, hífen ou sublinhado.'
            });
        }

        // 8) Senha: no máximo 72 caracteres (limite do bcrypt)
        if (String(senha).length > 72) {
            return res.status(400).json({
                mensagem: 'A senha deve ter no máximo 72 caracteres.'
            });
        }

        const cpfFormatado = formatarCpf(cpfDigitos);

        // 9) CPF e login não podem se repetir
        const duplicado = await verificarDuplicidade(cpfFormatado, loginLimpo);

        if (duplicado.cpf) {
            return res.status(409).json({
                mensagem: 'Já existe um usuário cadastrado com esse CPF.'
            });
        }

        if (duplicado.login) {
            return res.status(409).json({
                mensagem: 'Esse login já está em uso. Escolha outro.'
            });
        }

        const novoUsuario = await cadastrarUsuario({
            cpf: cpfFormatado,
            nomeCompleto: nome,
            dataAniversario: textoData,
            celular: formatarCelular(celularDigitos),
            email: emailLimpo,
            login: loginLimpo,
            senha
        });

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: novoUsuario
        });
    } catch (erro) {
        console.error('Erro ao cadastrar usuário:', erro.message);

        return res.status(500).json({
            mensagem: 'Erro ao cadastrar usuário. Verifique os dados enviados e o banco.'
        });
    }
}
