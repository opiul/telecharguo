// Configuration des dossiers par défaut pour chaque type de fichier
const defaultFolders = {
  images: "Images",
  documents: "Documents",
  audio: "Audio",
  video: "Video",
  archives: "Archives",
  other: "Autres"
};

// Types de fichiers par catégorie
const fileTypes = {
  images: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"],
  documents: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".odt", ".ods", ".odp"],
  audio: [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"],
  video: [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"],
  archives: [".zip", ".rar", ".7z", ".tar", ".gz"]
};

// Configuration globale
const defaultConfig = {
  userFolders: defaultFolders,
  darkMode: false,
  autoVirusScan: false,
  cloudSync: false,
  autoCompress: false,
  scheduledDownloads: [],
  virusTotalApiKey: ""
};

// Charger la configuration utilisateur ou utiliser les valeurs par défaut
let config = defaultConfig;

browser.storage.local.get("config", (result) => {
  if (result.config) {
    config = { ...defaultConfig, ...result.config };
  } else {
    // Sauvegarder la configuration par défaut
    browser.storage.local.set({ config: defaultConfig });
  }
});

// Fonction pour déterminer la catégorie d'un fichier
function getFileCategory(filename) {
  const extension = "." + filename.split('.').pop().toLowerCase();
  
  for (const category in fileTypes) {
    if (fileTypes[category].includes(extension)) {
      return category;
    }
  }
  
  return "other";
}

// Écouteur d'événement pour les nouveaux téléchargements
browser.downloads.onCreated.addListener((downloadItem) => {
  // Extraire le nom du fichier de l'URL
  const filename = downloadItem.filename || 
                   downloadItem.url.split('/').pop() || 
                   "fichier";
  
  // Déterminer la catégorie
  const category = getFileCategory(filename);
  
  // Obtenir le dossier correspondant
  const targetFolder = config.userFolders[category];
  
  // Stocker l'information sur ce téléchargement
  const downloadInfo = {
    id: downloadItem.id,
    filename: filename,
    url: downloadItem.url,
    category: category,
    suggestedFolder: targetFolder,
    timestamp: Date.now(),
    size: downloadItem.fileSize || 0,
    scanned: false,
    scanResult: null,
    compressed: false
  };
  
  // Stocker cette information dans l'historique des téléchargements
  browser.storage.local.get("downloadHistory", (result) => {
    let history = result.downloadHistory || [];
    history.push(downloadInfo);
    // Limiter l'historique à 100 entrées
    if (history.length > 100) {
      history = history.slice(-100);
    }
    browser.storage.local.set({ downloadHistory: history });
  });

  // Vérification automatique avec VirusTotal si activée
  if (config.autoVirusScan && config.virusTotalApiKey) {
    downloadItem.onComplete.addListener(() => {
      scanFileWithVirusTotal(downloadItem.id, config.virusTotalApiKey);
    });
  }

  // Compression automatique si activée et fichier applicable
  if (config.autoCompress && isCompressibleFile(filename)) {
    downloadItem.onComplete.addListener(() => {
      compressFile(downloadItem.id);
    });
  }

  // Synchronisation cloud si activée
  if (config.cloudSync) {
    downloadItem.onComplete.addListener(() => {
      syncToCloud(downloadItem.id);
    });
  }
});

// Gestionnaire des téléchargements programmés
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('scheduledDownload_')) {
    const downloadId = alarm.name.split('_')[1];
    startScheduledDownload(downloadId);
  }
});

// Fonction pour démarrer un téléchargement programmé
function startScheduledDownload(id) {
  browser.storage.local.get("scheduledDownloads", (result) => {
    const downloads = result.scheduledDownloads || [];
    const download = downloads.find(d => d.id === id);
    
    if (download) {
      browser.downloads.download({
        url: download.url,
        filename: download.filename,
        conflictAction: 'uniquify'
      });
      
      // Retirer de la liste des téléchargements programmés
      const updatedDownloads = downloads.filter(d => d.id !== id);
      browser.storage.local.set({ scheduledDownloads: updatedDownloads });
    }
  });
}