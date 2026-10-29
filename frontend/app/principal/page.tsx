// frontend/app/principal/page.tsx
//
// Página inicial do sistema, depois do login. Só mostra atalhos; cada
// função tem a sua própria página:
//   /reservas            -> fazer uma reserva
//   /consultar-reservas  -> consultar reservas
//   /cadastrar-recurso   -> cadastrar salas e laboratórios (juntos)
import Link from 'next/link';
import LayoutPainel from '../components/LayoutPainel';
import styles from '../components/painel.module.css';

// Cada atalho: endereço, ícone, título e descrição
const atalhos = [
  { href: '/reservas', icone: '▣', titulo: 'Reservar', texto: 'Escolha uma sala ou laboratório livre, a data e o horário.' },
  { href: '/consultar-reservas', icone: '▤', titulo: 'Consultar reservas', texto: 'Veja as reservas por data, horário, usuário, recurso e status.' },
  { href: '/cadastrar-recurso', icone: '＋', titulo: 'Cadastrar recurso', texto: 'Cadastre salas e laboratórios e ative ou desative cada um.' },
];

export default function Principal() {
  return (
    <LayoutPainel titulo="Página Principal">
      <section className={styles.painel}>
        <h2>Bem-vindo ao sistema</h2>
        <p>Escolha uma das opções abaixo ou use o menu ao lado.</p>

        <div className={styles.cartoes}>
          {atalhos.map((a) => (
            <Link key={a.href} href={a.href} className={styles.cartao}>
              <span>{a.icone}</span>
              <strong>{a.titulo}</strong>
              <small>{a.texto}</small>
            </Link>
          ))}
        </div>
      </section>
    </LayoutPainel>
  );
}

