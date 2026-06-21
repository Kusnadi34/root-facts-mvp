import '../styles/styles.css';
import App from './pages/app.js';

document.addEventListener('DOMContentLoaded', async () => {
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ SW registered:', registration);
    } catch (error) {
      console.warn('⚠️ SW gagal:', error);
    }
  }

  
  if (!navigator.onLine) {
    const statusEl = document.getElementById('status-text');
    if (statusEl) statusEl.innerText = '⚠️ Offline - tidak bisa scan';
    const dotEl = document.getElementById('status-dot');
    if (dotEl) dotEl.className = 'status-dot';
    
  }

  const app = new App({
    container: document.querySelector('#main-content'),
  });
  await app.renderPage();

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  } else {
    console.warn('Lucide gak ada');
  }
});


/**
import '../styles/styles.css';
import App from './pages/app.js';

document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
    } catch (error) {
      console.warn('⚠️ SW registration gagal:', error);
    }
  }

  const app = new App({
    container: document.querySelector('#main-content'),
  });
  await app.renderPage();

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  } else {
    console.warn('Lucide gak ada');
  }
});
**/
