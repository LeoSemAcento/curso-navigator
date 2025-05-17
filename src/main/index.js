const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const Store = require('electron-store');

// Configuração do armazenamento local
const store = new Store({
  defaults: {
    profiles: [],
    settings: {
      chrome_path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    }
  }
});

// Variável para a janela principal
let mainWindow;

// Função para criar a janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#232432',
  });

  // Carrega o arquivo HTML principal
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // Descomente para abrir DevTools em caso de problemas
  // mainWindow.webContents.openDevTools();
}

// Cria a janela quando o Electron estiver pronto
app.whenReady().then(createWindow);

// Fecha a aplicação quando todas as janelas forem fechadas (exceto no macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// No macOS, recria a janela quando o ícone do dock for clicado
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Função para abrir o Chrome com um URL específico
function openChrome(url) {
  const chromePath = store.get('settings.chrome_path');
  
  exec(`"${chromePath}" "${url}"`, (error) => {
    if (error) {
      console.error(`Erro ao abrir o Chrome: ${error}`);
      return;
    }
    console.log(`Chrome aberto com o URL: ${url}`);
  });
}

// Responder às solicitações para obter perfis
ipcMain.handle('get-profiles', () => {
  return store.get('profiles');
});

// Responder às solicitações para adicionar um perfil
ipcMain.handle('add-profile', (event, profile) => {
  const profiles = store.get('profiles');
  profile.id = Date.now().toString(); // ID único baseado na data/hora
  profile.created_at = new Date().toISOString();
  profile.last_accessed = new Date().toISOString();
  
  profiles.push(profile);
  store.set('profiles', profiles);
  
  return profiles;
});

// Responder às solicitações para executar um perfil
ipcMain.handle('run-profile', (event, profileId) => {
  const profiles = store.get('profiles');
  const profile = profiles.find(p => p.id === profileId);
  
  if (profile) {
    // Atualiza o último acesso
    profile.last_accessed = new Date().toISOString();
    store.set('profiles', profiles);
    
    // Abre o Chrome com o URL do perfil
    openChrome(profile.url);
    
    return true;
  }
  
  return false;
});

// Responder às solicitações para excluir um perfil
ipcMain.handle('delete-profile', (event, profileId) => {
  const profiles = store.get('profiles');
  const updatedProfiles = profiles.filter(p => p.id !== profileId);
  store.set('profiles', updatedProfiles);
  
  return updatedProfiles;
});