document.addEventListener('DOMContentLoaded', function() {
  // Gestion des onglets
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Désactiver tous les onglets
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activer l'onglet sélectionné
      button.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
  
  // Charger la configuration
  loadConfig();
  
  // Charger les téléchargements récents
  loadRecentDownloads();
  
  // Charger les téléchargements programmés
  loadScheduledDownloads();
  
  // Écouteur pour le bouton d'enregistrement des paramètres
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  
  // Écouteur pour le bouton de mode sombre
  document.getElementById('toggle-theme').addEventListener('click', toggleTheme);
  
  // Écouteur pour le bouton de vidage de l'historique
  document.getElementById('clear-history').addEventListener('click', clearHistory);
  
  // Écouteur pour le bouton d'ajout de téléchargement programmé
  document.getElementById('add-scheduled').addEventListener('click', addScheduledDownload);
  
  // Écouteurs pour les boutons d'outils
  document.getElementById('compress-selected').addEventListener('click', compressSelected);
  document.getElementById('scan-selected').addEventListener('click', scanSelected);
  document.getElementById('share-selected').addEventListener('click', shareSelected);
});

// Fonction pour charger la configuration
function loadConfig() {
  browser.storage.local.get("config", (result) => {
    const config = result.config || {
      userFolders: {
        images: "Images",
        documents: "Documents",
        audio: "Audio",
        video: "Video",
        archives: "Archives",
        other: "Autres"
      },
      darkMode: false,
      autoVirusScan: false,
      cloudSync: false,
      autoCompress: false,
      virusTotalApiKey: ""
    };
    
    // Appliquer le thème
    if (config.darkMode) {
      document.body.classList.add('dark-theme');
    }
    
    // Remplir les champs de configuration
    document.getElementById('images-folder').value = config.userFolders.images;
    document.getElementById('documents-folder').value = config.userFolders.documents;
    document.getElementById('audio-folder').value = config.userFolders.audio;
    document.getElementById('video-folder').value = config.userFolders.video;
    document.getElementById('archives-folder').value = config.userFolders.archives;
    document.getElementById('other-folder').value = config.userFolders.other;
    
    document.getElementById('auto-scan').checked = config.autoVirusScan;
    document.getElementById('virustotal-key').value = config.virusTotalApiKey;
    document.getElementById('auto-compress').checked = config.autoCompress;
    document.getElementById('cloud-sync').checked = config.cloudSync;
  });
}

// Fonction pour basculer le thème
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  
  browser.storage.local.get("config", (result) => {
    const config = result.config || {};
    config.darkMode = document.body.classList.contains('dark-theme');
    browser.storage.local.set({ config });
  });
}

// Fonction pour charger les téléchargements récents
function loadRecentDownloads() {
  const downloadsList = document.getElementById('recent-downloads');
  
  browser.storage.local.get("downloadHistory", (result) => {
    const history = result.downloadHistory || [];
    
    if (history.length === 0) {
      downloadsList.innerHTML = '<p class="empty-message">Aucun téléchargement récent</p>';
      return;
    }
    
    downloadsList.innerHTML = '';
    
    // Afficher les téléchargements du plus récent au plus ancien
    history.reverse().forEach(item => {
      const downloadItem = document.createElement('div');
      downloadItem.className = 'download-item';
      downloadItem.dataset.id = item.id;
      
      const filename = item.filename.split('/').pop();
      const date = new Date(item.timestamp).toLocaleString();
      
      // Ajouter des icônes pour les statuts
      let statusIcons = '';
      if (item.scanned) {
        const icon = item.scanResult && item.scanResult.positives === 0 ? '✅' : '⚠️';
        statusIcons += `<span title="Scanné avec VirusTotal">${icon}</span>`;
      }
      if (item.compressed) {
        statusIcons += '<span title="Compressé">🗜️</span>';
      }
      if (item.cloudSynced) {
        statusIcons += '<span title="Synchronisé">☁️</span>';
      }
      
      downloadItem.innerHTML = `
        <div class="download-info">
          <div class="download-name">${filename}</div>
          <div class="download-date">${date}</div>
        </div>
        <div class="download-meta">
          <div class="download-category">${item.category}</div>
          <div class="download-status">${statusIcons}</div>
        </div>
        <div class="download-actions">
          <button class="small-btn share-btn" title="Partager">📤</button>
          <button class="small-btn scan-btn" title="Vérifier avec VirusTotal">🔍</button>
        </div>
      `;
      
      // Ajouter des écouteurs pour les boutons d'action
      downloadItem.querySelector('.share-btn').addEventListener('click', () => {
        shareDownload(item);
      });
      
      downloadItem.querySelector('.scan-btn').addEventListener('click', () => {
        scanDownload(item);
      });
      
      downloadsList.appendChild(downloadItem);
    });
  });
}

// Fonction pour charger les téléchargements programmés
function loadScheduledDownloads() {
  const scheduledList = document.getElementById('scheduled-downloads');
  
  browser.storage.local.get("scheduledDownloads", (result) => {
    const scheduled = result.scheduledDownloads || [];
    
    if (scheduled.length === 0) {
      scheduledList.innerHTML = '<p class="empty-message">Aucun téléchargement programmé</p>';
      return;
    }
    
    scheduledList.innerHTML = '';
    
    scheduled.forEach(item => {
      const scheduledItem = document.createElement('div');
      scheduledItem.className = 'download-item';
      
      const filename = item.filename || item.url.split('/').pop();
      const scheduledDate = new Date(item.scheduledTime).toLocaleString();
      
      scheduledItem.innerHTML = `
        <div class="download-info">
          <div class="download-name">${filename}</div>
          <div class="download-date">Prévu: ${scheduledDate}</div>
        </div>
        <div class="download-actions">
          <button class="small-btn cancel-btn" data-id="${item.id}" title="Annuler">❌</button>
        </div>
      `;
      
      scheduledItem.querySelector('.cancel-btn').addEventListener('click', (e) => {
        cancelScheduledDownload(e.target.dataset.id);
      });
      
      scheduledList.appendChild(scheduledItem);
    });
  });
}

// Fonction pour enregistrer les paramètres
function saveSettings() {
  browser.storage.local.get("config", (result) => {
    const config = result.config || {};
    
    config.userFolders = {
      images: document.getElementById('images-folder').value,
      documents: document.getElementById('documents-folder').value,
      audio: document.getElementById('audio-folder').value,
      video: document.getElementById('video-folder').value,
      archives: document.getElementById('archives-folder').value,
      other: document.getElementById('other-folder').value
    };
    
    config.autoVirusScan = document.getElementById('auto-scan').checked;
    config.virusTotalApiKey = document.getElementById('virustotal-key').value;
    config.autoCompress = document.getElementById('auto-compress').checked;
    config.cloudSync = document.getElementById('cloud-sync').checked;
    
    browser.storage.local.set({ config }, () => {
      // Afficher un message de confirmation temporaire
      const saveBtn = document.getElementById('save-settings');
      const originalText = saveBtn.textContent;
      
      saveBtn.textContent = 'Enregistré !';
      saveBtn.disabled = true;
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 1500);
    });
  });
}