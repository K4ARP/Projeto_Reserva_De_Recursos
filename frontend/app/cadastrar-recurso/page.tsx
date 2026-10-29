// frontend/app/cadastrar-recurso/page.tsx
//
// Cadastro de recursos (salas e laboratórios, com o campo "Tipo").
// Toda a tela está em components/GerenciarRecurso.tsx.
import GerenciarRecurso from '../components/GerenciarRecurso';

export default function CadastrarRecurso() {
  return <GerenciarRecurso titulo="Cadastrar Recurso" />;
}
