const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const assetsIcon = path.join(__dirname, '../assets/icon.png');
const buildDir = path.join(__dirname, '../build');
const publicDir = path.join(__dirname, '../public');
const docsImagesDir = path.join(__dirname, '../docs/images');

// Build klasörünü oluştur
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('🎨 Icon dosyaları hazırlanıyor...');
console.log('📂 Kaynak:', assetsIcon);

if (!fs.existsSync(assetsIcon)) {
  console.error('❌ assets/icon.png bulunamadı!');
  process.exit(1);
}

const platform = process.platform;

// 1. Linux için PNG (1024x1024)
console.log('\n📦 Linux icon (PNG) hazırlanıyor...');
try {
  if (platform === 'darwin') {
    execSync(`sips -z 1024 1024 "${assetsIcon}" --out "${path.join(buildDir, 'icon.png')}"`);
  } else {
    try {
      execSync(`convert "${assetsIcon}" -resize 1024x1024 "${path.join(buildDir, 'icon.png')}"`);
    } catch {
      fs.copyFileSync(assetsIcon, path.join(buildDir, 'icon.png'));
    }
  }
  console.log('✅ build/icon.png oluşturuldu');
} catch (error) {
  console.warn('⚠️ PNG oluşturulamadı, direkt kopyalanıyor...');
  fs.copyFileSync(assetsIcon, path.join(buildDir, 'icon.png'));
}

// 2. macOS için ICNS
console.log('\n🍎 macOS icon (ICNS) hazırlanıyor...');
try {
  const iconsetDir = path.join(buildDir, 'icon.iconset');
  
  // Eski iconset'i temizle
  if (fs.existsSync(iconsetDir)) {
    fs.rmSync(iconsetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(iconsetDir, { recursive: true });

  const sizes = [
    { size: 16, scale: 1, name: 'icon_16x16.png' },
    { size: 16, scale: 2, name: 'icon_16x16@2x.png' },
    { size: 32, scale: 1, name: 'icon_32x32.png' },
    { size: 32, scale: 2, name: 'icon_32x32@2x.png' },
    { size: 128, scale: 1, name: 'icon_128x128.png' },
    { size: 128, scale: 2, name: 'icon_128x128@2x.png' },
    { size: 256, scale: 1, name: 'icon_256x256.png' },
    { size: 256, scale: 2, name: 'icon_256x256@2x.png' },
    { size: 512, scale: 1, name: 'icon_512x512.png' },
    { size: 512, scale: 2, name: 'icon_512x512@2x.png' },
  ];

  sizes.forEach(({ size, scale, name }) => {
    const actualSize = size * scale;
    const outputPath = path.join(iconsetDir, name);

    try {
      if (platform === 'darwin') {
        execSync(`sips -z ${actualSize} ${actualSize} "${assetsIcon}" --out "${outputPath}"`, { stdio: 'ignore' });
      } else {
        try {
          execSync(`convert "${assetsIcon}" -resize ${actualSize}x${actualSize} "${outputPath}"`, { stdio: 'ignore' });
        } catch {
          if (actualSize >= 512) {
            fs.copyFileSync(assetsIcon, outputPath);
          }
        }
      }
    } catch (err) {
      // Hata durumunda devam et
    }
  });

  if (platform === 'darwin') {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(buildDir, 'icon.icns')}"`);
    console.log('✅ build/icon.icns oluşturuldu');
  } else {
    console.warn('⚠️ ICNS oluşturma macOS gerektirir.');
    console.log(`   icon.iconset klasörü hazır, macOS'ta şu komutu çalıştırın:`);
    console.log(`   iconutil -c icns "${iconsetDir}" -o "${path.join(buildDir, 'icon.icns')}"`);
  }
} catch (error) {
  console.error('❌ ICNS oluşturulamadı:', error.message);
}

// 3. Windows için ICO
console.log('\n🪟 Windows icon (ICO) hazırlanıyor...');
(async () => {
  try {
    const toIco = require('to-ico');
    const sizes = [256, 128, 64, 48, 32, 16];
    const pngBuffers = [];

    for (const size of sizes) {
      const tempPath = path.join(buildDir, `icon-${size}-temp.png`);
      try {
        if (platform === 'darwin') {
          execSync(`sips -z ${size} ${size} "${assetsIcon}" --out "${tempPath}"`, { stdio: 'ignore' });
        } else {
          try {
            execSync(`convert "${assetsIcon}" -resize ${size}x${size} "${tempPath}"`, { stdio: 'ignore' });
          } catch {
            if (size >= 256) {
              fs.copyFileSync(assetsIcon, tempPath);
            }
          }
        }
        if (fs.existsSync(tempPath)) {
          pngBuffers.push(fs.readFileSync(tempPath));
          fs.unlinkSync(tempPath);
        }
      } catch (err) {
        // Devam et
      }
    }

    if (pngBuffers.length > 0) {
      const icoBuffer = await toIco(pngBuffers);
      fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
      console.log('✅ build/icon.ico oluşturuldu');
    } else {
      fs.copyFileSync(path.join(buildDir, 'icon.png'), path.join(buildDir, 'icon.ico'));
      console.log('⚠️ build/icon.ico fallback olarak PNG kopyalandı');
    }
  } catch (error) {
    console.error('❌ ICO oluşturulamadı:', error.message);
    fs.copyFileSync(path.join(buildDir, 'icon.png'), path.join(buildDir, 'icon.ico'));
    console.log('⚠️ build/icon.ico fallback olarak PNG kopyalandı');
  }

  // 4. Public klasörüne kopyala (web favicon)
  console.log('\n🌐 Web favicon hazırlanıyor...');
  try {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.copyFileSync(path.join(buildDir, 'icon.png'), path.join(publicDir, 'icon.png'));
    console.log('✅ public/icon.png güncellendi');
  } catch (error) {
    console.warn('⚠️ public/icon.png güncellenemedi:', error.message);
  }

  // 5. Docs/images klasörüne kopyala (web sitesi için)
  console.log('\n📄 Docs icon hazırlanıyor...');
  try {
    if (!fs.existsSync(docsImagesDir)) {
      fs.mkdirSync(docsImagesDir, { recursive: true });
    }
    fs.copyFileSync(path.join(buildDir, 'icon.png'), path.join(docsImagesDir, 'icon.png'));
    console.log('✅ docs/images/icon.png güncellendi');
  } catch (error) {
    console.warn('⚠️ docs/images/icon.png güncellenemedi:', error.message);
  }

  console.log('\n✅ Tüm icon dosyaları hazırlandı!');
  console.log('📁 Build klasörü:', buildDir);
  console.log('   - icon.icns (macOS)');
  console.log('   - icon.ico (Windows)');
  console.log('   - icon.png (Linux)');
  console.log('📁 Public klasörü:', publicDir);
  console.log('   - icon.png (Web favicon)');
  console.log('📁 Docs/images klasörü:', docsImagesDir);
  console.log('   - icon.png (Web sitesi)');
})();

