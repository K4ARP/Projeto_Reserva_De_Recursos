# Projeto_Reserva_De_Laboratorio_E_Salas_De_Aula
Projeto de reserva de salas e laboratórios do 2 semestre do cotuca

## Como executar

1. **Banco de dados (SQL Server):** abra `Banco_De_Dados/Tabelas_SQL/Tabelas.sql` no SSMS e execute.
   O script pode ser executado mais de uma vez sem dar erro.
2. **API (Node.js):** na pasta `Node.js` rode `npm install` e depois `npm run dev`
   (usa o arquivo `.env` com `CONNECTION_STRING`, `JWT_SECRET` e `PORTA`).
3. **Front-end (Next.js):** na pasta `frontend` rode `npm install` e depois `npm run dev`
   e abra `http://localhost:3000`.

## Funcionalidades

- Cadastro de usuário e login (todo acesso é registrado na tabela `AcessoLogin`)
- Cadastro de salas, laboratórios e status
- Reserva de recursos por horário (inclusive virando a noite, ex.: 23:00 às 05:00) ou por dias seguidos (dia inteiro), com verificação de conflito
- Consulta das reservas do usuário logado por data/período, horário, recurso, tipo e status

## Bibliografia

Preencha com as fontes consultadas durante o projeto (livros, sites, vídeos e ferramentas de IA).
Exemplo, conforme exigido no enunciado:

- Anthropic. Claude (assistente de IA). Usado como apoio para organizar o código e corrigir erros.
