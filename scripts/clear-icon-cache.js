const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧹 Icon cache temizleniyor...');

const platform = process.platform;

if (platform === 'darwin') {
  console.log('🍎 macOS icon cache temizleniyor...');
  
  try {
    // Icon cache klasörlerini temizle
    const cachePaths = [
      path.join(os.homedir(), 'Library/Caches/com.apple.iconservices'),
      '/Library/Caches/com.apple.iconservices.store',
    ];

    cachePaths.forEach(cachePath => {
      if (fs.existsSync(cachePath)) {
        try {
          fs.rmSync(cachePath, { recursive: true, force: true });
          console.log(`✅ Temizlendi: ${cachePath}`);
        } catch (err) {
          console.warn(`⚠️ Temizlenemedi: ${cachePath} (yetki gerekebilir)`);
        }
      }
    });

    // Launch Services veritabanını yenile
    try {
      execSync('/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user', { stdio: 'ignore' });
      console.log('✅ Launch Services veritabanı yenilendi');
    } catch (err) {
      console.warn('⚠️ Launch Services yenilenemedi (yetki gerekebilir)');
    }

    // Finder ve Dock'u yeniden başlat
    try {
      execSync('killall Finder', { stdio: 'ignore' });
      console.log('✅ Finder yeniden başlatıldı');
    } catch (err) {
      // Finder zaten çalışmıyor olabilir
    }

    try {
      execSync('killall Dock', { stdio: 'ignore' });
      console.log('✅ Dock yeniden başlatıldı');
    } catch (err) {
      // Dock zaten çalışmıyor olabilir
    }

  } catch (error) {
    console.error('❌ Cache temizleme hatası:', error.message);
  }
} else if (platform === 'win32') {
  console.log('🪟 Windows icon cache temizleniyor...');
  
  try {
    // Windows icon cache'i genellikle otomatik temizlenir
    // Ancak thumbnail cache'i temizleyebiliriz
    const thumbnailCache = path.join(os.homedir(), 'AppData/Local/Microsoft/Windows/Explorer');
    
    if (fs.existsSync(thumbnailCache)) {
      console.log('ℹ️ Windows thumbnail cache konumu:', thumbnailCache);
      console.log('   Manuel olarak temizlemek için:');
      console.log('   Disk Temizleme aracını kullanın veya');
      console.log('   %LOCALAPPDATA%\\Microsoft\\Windows\\Explorer klasöründeki thumbnail dosyalarını silin');
    }
  } catch (error) {
    console.error('❌ Cache temizleme hatası:', error.message);
  }
} else {
  console.log('🐧 Linux icon cache temizleniyor...');
  
  try {
    // Linux'ta icon cache genellikle ~/.cache/icons altında
    const iconCache = path.join(os.homedir(), '.cache/icons');
    
    if (fs.existsSync(iconCache)) {
      fs.rmSync(iconCache, { recursive: true, force: true });
      console.log('✅ Icon cache temizlendi');
    }

    // GTK icon cache'i yenile
    try {
      execSync('gtk-update-icon-cache -f -t ~/.local/share/icons', { stdio: 'ignore' });
      console.log('✅ GTK icon cache yenilendi');
    } catch (err) {
      // GTK yüklü olmayabilir
    }
  } catch (error) {
    console.error('❌ Cache temizleme hatası:', error.message);
  }
}

console.log('\n✅ Icon cache temizleme tamamlandı!');
console.log('💡 Eğer icon hala görünmüyorsa, uygulamayı yeniden başlatın.');

