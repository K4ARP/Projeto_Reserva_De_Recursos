// frontend/app/components/LayoutPainel.tsx
//
// "Moldura" padrão das páginas: menu lateral + título + faixa de mensagem.
// Cada página só informa o título, a mensagem e o conteúdo (children).
import type { ReactNode } from 'react';
import MenuLateral from './MenuLateral';
import styles from './painel.module.css';

type Props = {
  titulo: string;      // título grande no topo da página
  mensagem?: string;   // aviso ou erro (some quando vazio)
  children: ReactNode; // conteúdo específico de cada página
};

// Palavras que indicam que a mensagem é um erro/aviso (fica vermelha).
// Qualquer outra mensagem é tratada como sucesso (fica verde).
const PADRAO_ERRO =
  /erro|não foi|não é|não pode|inválid|preencha|já existe|já está|faça login|deve|escolha|informe|selecione|nenhum|limites/i;

export default function LayoutPainel({ titulo, mensagem, children }: Props) {
  return (
    <main className={styles.pagina}>
      <MenuLateral />

      <section className={styles.conteudo}>
        <header className={styles.cabecalho}>
          <h1>{titulo}</h1>
          <p>Sistema de reserva de salas de aula e laboratórios</p>
        </header>

        {mensagem && (
          <div
            className={`${styles.mensagem} ${
              PADRAO_ERRO.test(mensagem) ? styles.erro : styles.sucesso
            }`}
            role="status"
            aria-live="polite"
          >
            {mensagem}
          </div>
        )}

        {children}
      </section>
    </main>
  );
}
