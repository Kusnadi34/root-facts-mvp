import '../styles/styles.css';
import App from './pages/app.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    container: document.querySelector('#main-content'),
  });
  await app.renderPage();

  // Pastikan lucide tersedia sebelum dipanggil
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  } else {
    console.warn('Lucide tidak tersedia, icon mungkin tidak tampil.');
  }
});
