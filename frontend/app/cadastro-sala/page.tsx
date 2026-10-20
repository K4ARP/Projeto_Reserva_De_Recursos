'use client';
import { useState } from 'react';

export default function CadastroSala() {
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    capacidade: '',
    localizacao: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dados da Sala:', formData);
    alert('Sala cadastrada com sucesso!');
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Cadastro de Sala de Aula</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Código da Sala:</label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            placeholder="Ex: SALA-201"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nome / Identificação:</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: Sala de Aula Teórica 05"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Capacidade (Nº de alunos):</label>
          <input
            type="number"
            name="capacidade"
            value={formData.capacidade}
            onChange={handleChange}
            placeholder="Ex: 40"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Localização / Bloco:</label>
          <input
            type="text"
            name="localizacao"
            value={formData.localizacao}
            onChange={handleChange}
            placeholder="Ex: Bloco A - Térreo"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Cadastrar Sala
        </button>
      </form>
    </div>
  );
}