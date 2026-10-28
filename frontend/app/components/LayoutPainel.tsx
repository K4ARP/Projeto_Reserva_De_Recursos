// frontend/app/components/LayoutPainel.tsx  (ARQUIVO NOVO)
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

export default function LayoutPainel({ titulo, mensagem, children }: Props) {
  return (
    <main className={styles.pagina}>
      <MenuLateral />

      <section className={styles.conteudo}>
        <header className={styles.cabecalho}>
          <div>
            <h1>{titulo}</h1>
            <p>Sistema de reserva de salas de aula e laboratórios</p>
          </div>
        </header>

        {mensagem && (
          <div className={styles.mensagem} role="status">
            {mensagem}
          </div>
        )}

        {children}
      </section>
    </main>
  );
}
