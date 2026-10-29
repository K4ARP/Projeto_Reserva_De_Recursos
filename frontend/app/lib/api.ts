// frontend/app/lib/api.ts  (ARQUIVO NOVO)
//
// Funções e constantes que várias páginas usavam copiadas dentro do próprio
// arquivo. Agora ficam num lugar só e as páginas importam daqui.

// Endereço da API (o servidor Node).
export const API = 'http://localhost:8080';

// Lê o token JWT guardado no navegador pela tela de login.
// O "typeof window" evita erro quando o Next roda no servidor
// (lá não existe localStorage).
export function obterToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

// Lê a resposta da API. Se vier erro (status diferente de 2xx), lança um
// Error com a mensagem enviada pelo Node, para a tela poder exibir.
export async function lerResposta(resposta: Response) {
  const texto = await resposta.text();

  let dados: any = {};
  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    // Se não for JSON, usa o texto puro como mensagem
    dados = { mensagem: texto };
  }

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem || dados.erro || `Erro HTTP ${resposta.status}`
    );
  }

  return dados;
}

// Garante que sempre teremos uma lista (array), mesmo que a API
// devolva a lista dentro de um objeto.
export function extrairLista(dados: any): any[] {
  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados.recursos)) return dados.recursos;
  if (Array.isArray(dados.reservas)) return dados.reservas;
  if (Array.isArray(dados.resultado)) return dados.resultado;
  if (Array.isArray(dados.dados)) return dados.dados;
  return [];
}

// ---------------------------------------------------------------------
// LIMITES de caracteres dos campos (iguais aos das colunas do banco).
// Usados no atributo maxLength dos inputs: o navegador simplesmente
// não deixa digitar além do limite.
// ---------------------------------------------------------------------
export const LIMITES = {
  cpf: 14,           // 000.000.000-00
  nomeCompleto: 150,
  celular: 15,       // (00) 00000-0000
  email: 150,
  login: 50,
  senha: 72,         // limite do bcrypt
  nomeRecurso: 100,
  localizacao: 150,
  codigoRecurso: 9,  // cabe em INT
  capacidade: 4,     // até 9999 lugares
  nomeStatus: 30,
};

// Deixa só os números de um texto
export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

// Máscara de CPF enquanto digita: 12345678901 -> 123.456.789-01
export function mascararCpf(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 11);

  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

// Máscara de celular enquanto digita: 19999998888 -> (19) 99999-8888
export function mascararCelular(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 11);

  if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 0) return `(${d}`;
  return '';
}

// Data de hoje no formato AAAA-MM-DD (para o atributo max/min dos campos de data)
export function dataDeHoje(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
