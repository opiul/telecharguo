// Fonction de vérification avec VirusTotal
function scanFileWithVirusTotal(downloadId, apiKey) {
  browser.downloads.search({ id: downloadId }).then(downloads => {
    if (downloads.length === 0) return;
    
    const download = downloads[0];
    if (!download.filename) return;
    
    // Ici, nous simulons l'envoi à VirusTotal
    // Dans une implémentation réelle, il faudrait utiliser l'API de VirusTotal
    setTimeout(() => {
      const scanResult = {
        scanId: "scan_" + Math.random().toString(36).substr(2, 9),
        positives: 0,
        total: 58,
        scanDate: new Date().toISOString()
      };
      
      // Mettre à jour l'historique avec le résultat du scan
      browser.storage.local.get("downloadHistory", (result) => {
        let history = result.downloadHistory || [];
        const index = history.findIndex(item => item.id === downloadId);
        
        if (index !== -1) {
          history[index].scanned = true;
          history[index].scanResult = scanResult;
          browser.storage.local.set({ downloadHistory: history });
        }
      });
    }, 1500);
  });
}

// Fonction pour ouvrir un fichier dans VirusTotal
function openInVirusTotal(fileHash) {
  browser.tabs.create({
    url: `https://www.virustotal.com/gui/file/${fileHash}/detection`
  });
}
