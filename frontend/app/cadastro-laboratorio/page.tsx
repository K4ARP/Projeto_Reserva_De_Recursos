'use client';
import { useState } from 'react';

export default function CadastroLaboratorio() {
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
    console.log('Dados do Laboratório:', formData);
    alert('Laboratório cadastrado com sucesso!');
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Cadastro de Laboratório</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Código do Laboratório:</label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            placeholder="Ex: LAB-01"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nome:</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: Laboratório de Informática 01"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Capacidade (Nº de pessoas):</label>
          <input
            type="number"
            name="capacidade"
            value={formData.capacidade}
            onChange={handleChange}
            placeholder="Ex: 30"
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
            placeholder="Ex: Bloco B - 2º Andar"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Cadastrar Laboratório
        </button>
      </form>
    </div>
  );
}