// Fonction pour vérifier si un fichier est compressible
function isCompressibleFile(filename) {
  const nonCompressibleExtensions = [".jpg", ".jpeg", ".png", ".mp3", ".mp4", ".zip", ".rar", ".7z"];
  const extension = "." + filename.split('.').pop().toLowerCase();
  
  return !nonCompressibleExtensions.includes(extension);
}

// Fonction de compression (simulation)
function compressFile(downloadId) {
  browser.downloads.search({ id: downloadId }).then(downloads => {
    if (downloads.length === 0) return;
    
    const download = downloads[0];
    if (!download.filename) return;
    
    // Ici, nous simulons une compression
    setTimeout(() => {
      // Mettre à jour l'historique avec le statut de compression
      browser.storage.local.get("downloadHistory", (result) => {
        let history = result.downloadHistory || [];
        const index = history.findIndex(item => item.id === downloadId);
        
        if (index !== -1) {
          history[index].compressed = true;
          browser.storage.local.set({ downloadHistory: history });
        }
      });
    }, 1000);
  });
}