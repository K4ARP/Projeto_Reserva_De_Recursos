// frontend/app/components/MenuLateral.tsx  (ARQUIVO NOVO)
//
// Menu lateral que aparece em todas as páginas do painel.
// Antes, o menu eram botões que trocavam de "seção" dentro da página
// principal. Agora cada item é um link para a sua própria página.
'use client';

import Link from 'next/link';
import styles from './painel.module.css';

export default function MenuLateral() {
  // Apaga os dados de login e volta para a tela de login
  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }

  return (
    <aside className={styles.menu}>
      <h2>Reserva de Recursos</h2>

      <Link href="/principal">⌂ Início</Link>
      <Link href="/reservas">▣ Reservar</Link>
      <Link href="/consultar-reservas">▤ Consultar reservas</Link>
      <Link href="/cadastrar-recurso">＋ Cadastrar recurso</Link>

      <button className={styles.sair} onClick={sair}>
        Sair
      </button>
    </aside>
  );
}
