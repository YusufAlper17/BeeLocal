import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 React app başlatılıyor...');

// Electron API'nin yüklenmesini bekle (preload script)
const waitForElectronAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.electronAPI) {
      console.log('✅ Electron API hazır');
      resolve();
      return;
    }
    
    // Preload script yüklenene kadar bekle (max 5 saniye)
    let attempts = 0;
    const maxAttempts = 50; // 5 saniye (50 * 100ms)
    
    const checkInterval = setInterval(() => {
      attempts++;
      if (window.electronAPI) {
        console.log('✅ Electron API yüklendi');
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        console.warn('⚠️ Electron API yüklenemedi, devam ediliyor...');
        clearInterval(checkInterval);
        resolve(); // Hata olsa bile devam et
      }
    }, 100);
  });
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element bulunamadı!');
} else {
  console.log('✅ Root element bulundu');
}

// Electron API yüklenene kadar bekle, sonra render et
waitForElectronAPI().then(() => {
  try {
    ReactDOM.createRoot(rootElement!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('✅ React render tamamlandı');
  } catch (error) {
    console.error('❌ React render hatası:', error);
  }
});














