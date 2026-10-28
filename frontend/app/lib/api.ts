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
