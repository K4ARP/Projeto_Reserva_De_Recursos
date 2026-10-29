// frontend/app/components/MenuLateral.tsx
//
// Menu lateral que aparece em todas as páginas do painel.
// Cada item é um link para a sua própria página; o item da página
// atual fica destacado em azul (usePathname diz em qual página estamos).
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './painel.module.css';

// Itens do menu: endereço da página e texto exibido
const itens = [
  { href: '/principal', texto: '⌂ Início' },
  { href: '/reservas', texto: '▣ Reservar' },
  { href: '/consultar-reservas', texto: '▤ Consultar reservas' },
  { href: '/cadastrar-recurso', texto: '＋ Cadastrar recurso' },
];

export default function MenuLateral() {
  const pagina = usePathname();

  // Apaga os dados de login e volta para a tela de login
  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }

  return (
    <aside className={styles.menu}>
      <h2>Reserva de Recursos</h2>

      {itens.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pagina === item.href ? styles.ativo : undefined}
        >
          {item.texto}
        </Link>
      ))}

      <button className={styles.sair} onClick={sair}>
        Sair
      </button>
    </aside>
  );
}

