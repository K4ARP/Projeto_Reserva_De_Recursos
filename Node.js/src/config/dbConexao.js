
import 'dotenv/config';
import mssql from 'mssql';

const stringSQL = process.env.CONNECTION_STRING;

async function conectaBD() {
    try {
        const conexao = await mssql.connect(stringSQL);
        console.log('Conexao com o banco de dados realizada com sucesso!');
        return conexao;
    } catch (erro) {
        console.error('Erro no acesso ao BD:', erro.message);
        throw erro;
    }
}

export default conectaBD;
