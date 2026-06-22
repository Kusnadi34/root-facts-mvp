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

