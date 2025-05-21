// Fonction de synchronisation cloud (simulation)
function syncToCloud(downloadId) {
  browser.downloads.search({ id: downloadId }).then(downloads => {
    if (downloads.length === 0) return;
    
    const download = downloads[0];
    if (!download.filename) return;
    
    // Ici, nous simulons une synchronisation cloud
    setTimeout(() => {
      // Mettre à jour l'historique avec le statut de synchronisation
      browser.storage.local.get("downloadHistory", (result) => {
        let history = result.downloadHistory || [];
        const index = history.findIndex(item => item.id === downloadId);
        
        if (index !== -1) {
          history[index].cloudSynced = true;
          browser.storage.local.set({ downloadHistory: history });
        }
      });
    }, 1200);
  });
}