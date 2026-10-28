// frontend/app/principal/page.tsx  (REESCRITO: de 973 linhas para menos de 50)
//
// Página inicial do sistema, depois do login.
// Antes ela tinha TUDO dentro (reservar, consultar, cadastrar recurso e
// os estilos). Agora cada função tem a sua própria página e esta só mostra
// o resumo com atalhos:
//   /reservas            -> fazer uma reserva
//   /consultar-reservas  -> consultar reservas
//   /cadastrar-recurso   -> cadastrar/ativar salas e laboratórios
import Link from 'next/link';
import LayoutPainel from '../components/LayoutPainel';
import styles from '../components/painel.module.css';

export default function Principal() {
  return (
    <LayoutPainel titulo="Página Principal">
      <section className={styles.painel}>
        <h2>Bem-vindo ao sistema</h2>
        <p>Escolha uma das opções abaixo ou use o menu ao lado.</p>

        {/* Cada cartão é um link para a página da função */}
        <div className={styles.cartoes}>
          <Link href="/reservas" className={styles.cartao}>
            <span>▣</span>
            <strong>Reservar</strong>
            <small>Escolha uma sala ou laboratório livre, a data e o horário.</small>
          </Link>

          <Link href="/consultar-reservas" className={styles.cartao}>
            <span>▤</span>
            <strong>Consultar reservas</strong>
            <small>Veja as reservas já feitas, filtrando por data, horário e usuário.</small>
          </Link>

          <Link href="/cadastrar-recurso" className={styles.cartao}>
            <span>＋</span>
            <strong>Cadastrar recurso</strong>
            <small>Cadastre salas de aula e laboratórios e ative ou desative cada um.</small>
          </Link>
        </div>
      </section>
    </LayoutPainel>
  );
}
