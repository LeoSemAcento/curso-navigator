const React = require('react');
const { useState, useEffect } = React;
const { ipcRenderer } = require('electron');

// Componente principal do aplicativo
function App() {
  // Estados para gerenciar os dados
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Buscar perfis ao iniciar o componente
  useEffect(() => {
    loadProfiles();
  }, []);
  
  // Função para carregar perfis do armazenamento
  async function loadProfiles() {
    const loadedProfiles = await ipcRenderer.invoke('get-profiles');
    setProfiles(loadedProfiles);
  }
  
  // Filtrar perfis com base no termo de busca
  const filteredProfiles = profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Função para executar um perfil
  async function runProfile(profileId) {
    await ipcRenderer.invoke('run-profile', profileId);
  }
  
  // Função para adicionar um novo perfil
  async function addProfile(profile) {
    const updatedProfiles = await ipcRenderer.invoke('add-profile', profile);
    setProfiles(updatedProfiles);
    setShowAddModal(false);
  }
  
  return (
    <>
      {/* Cabeçalho do App */}
      <div className="header">
        <div className="title">Curso Navigator</div>
      </div>
      
      {/* Barra de ferramentas com busca e botão de adicionar */}
      <div className="toolbar">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar perfis..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button className="add-button" onClick={() => setShowAddModal(true)}>
          + Adicionar perfil
        </button>
      </div>
      
      {/* Tabela de perfis */}
      <table className="profiles-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th></th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {filteredProfiles.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center' }}>
                Nenhum perfil encontrado. Adicione seu primeiro perfil.
              </td>
            </tr>
          ) : (
            filteredProfiles.map(profile => (
              <tr key={profile.id}>
                <td>{profile.name}</td>
                <td>
                  <button 
                    className="execute-button"
                    onClick={() => runProfile(profile.id)}
                  >
                    Executar
                  </button>
                </td>
                <td>{profile.notes || ''}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {/* Modal de adicionar perfil */}
      {showAddModal && (
        <AddProfileModal 
          onSave={addProfile}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}

// Componente do modal para adicionar perfil
function AddProfileModal({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  
  // Função para lidar com o envio do formulário
  function handleSubmit(e) {
    e.preventDefault();
    
    // Validação básica
    if (!name || !url) {
      alert('Nome e URL são obrigatórios!');
      return;
    }
    
    // Garanta que o URL começa com http:// ou https://
    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    // Salvar o novo perfil
    onSave({ name, url: finalUrl, notes });
  }
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Adicionar Novo Perfil</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome:</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Curso de JavaScript"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">URL:</label>
            <input
              type="text"
              className="form-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ex: https://meusite.com/curso"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Notas (opcional):</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Módulo 3 em andamento"
            />
          </div>
          
          <div className="modal-footer">
            <button type="button" className="button button-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="button button-primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

module.exports = App;