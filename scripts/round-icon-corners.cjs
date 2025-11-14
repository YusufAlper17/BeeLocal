const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const assetsIcon = path.join(__dirname, '../assets/icon.png');
const tempDir = path.join(__dirname, '../assets/temp_round');
const platform = process.platform;

console.log('🎨 Icon kenarları yuvarlatılıyor...');
console.log('📂 Kaynak:', assetsIcon);

if (!fs.existsSync(assetsIcon)) {
  console.error('❌ assets/icon.png bulunamadı!');
  process.exit(1);
}

// Geçici klasör oluştur
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

try {
  // Icon boyutunu al
  const sizeInfo = execSync(`sips -g pixelWidth -g pixelHeight "${assetsIcon}"`, { encoding: 'utf8' });
  const widthMatch = sizeInfo.match(/pixelWidth: (\d+)/);
  const heightMatch = sizeInfo.match(/pixelHeight: (\d+)/);
  
  if (!widthMatch || !heightMatch) {
    throw new Error('Icon boyutu alınamadı');
  }
  
  const width = parseInt(widthMatch[1]);
  const height = parseInt(heightMatch[1]);
  const radius = Math.min(width, height) * 0.15; // %15 yuvarlatma (profesyonel görünüm)
  
  console.log(`   Boyut: ${width}x${height}`);
  console.log(`   Yuvarlatma yarıçapı: ${Math.round(radius)}px`);
  
  // macOS'ta sips kullanarak yuvarlatma
  // Sips ile direkt yuvarlatma yapamıyoruz, bu yüzden Python scripti kullanacağız
  // Ama önce Python'un PIL'i olup olmadığını kontrol edelim
  
  const pythonScript = `
import sys
import os
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("PIL bulunamadı")
    sys.exit(1)

# Icon'u yükle
img = Image.open('${assetsIcon}').convert('RGBA')
width, height = img.size
radius = int(min(width, height) * 0.15)

# Yuvarlatılmış köşeli mask oluştur
mask = Image.new('L', (width, height), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([(0, 0), (width, height)], radius=radius, fill=255)

# Mask'ı uygula
output = Image.new('RGBA', (width, height), (0, 0, 0, 0))
output.paste(img, (0, 0))
output.putalpha(mask)

# Kaydet
output.save('${assetsIcon}', 'PNG')
print("Başarılı")
`;
  
  const scriptPath = path.join(tempDir, 'round_corners.py');
  fs.writeFileSync(scriptPath, pythonScript);
  
  try {
    const result = execSync(`python3 "${scriptPath}"`, { encoding: 'utf8', stdio: 'pipe' });
    if (result.includes('Başarılı')) {
      console.log('✅ Python/PIL ile yuvarlatılmış köşeler eklendi');
    }
  } catch (pyError) {
    // PIL yoksa, basit bir Node.js çözümü kullan
    console.log('   PIL bulunamadı, alternatif yöntem deneniyor...');
    
    // ImageMagick'i kontrol et
    try {
      execSync(`which magick`, { stdio: 'ignore' });
      
      // ImageMagick ile yuvarlatma
      const maskPath = path.join(tempDir, 'mask.png');
      execSync(`magick -size ${width}x${height} xc:none -draw "roundrectangle 0,0 ${width-1},${height-1} ${radius},${radius}" "${maskPath}"`);
      execSync(`magick "${assetsIcon}" "${maskPath}" -alpha off -compose CopyOpacity -composite "${assetsIcon}"`);
      
      if (fs.existsSync(maskPath)) {
        fs.unlinkSync(maskPath);
      }
      
      console.log('✅ ImageMagick ile yuvarlatılmış köşeler eklendi');
    } catch (imgError) {
      // Son çare: sips ile basit bir işlem
      console.log('   ImageMagick de bulunamadı, sips ile basit işlem yapılıyor...');
      
      // Sips ile direkt yuvarlatma yapamıyoruz, bu yüzden kullanıcıya bilgi verelim
      console.warn('⚠️  Yuvarlatma için PIL veya ImageMagick gerekli');
      console.warn('   Kurulum için:');
      console.warn('   • PIL: python3 -m pip install --user Pillow --break-system-packages');
      console.warn('   • ImageMagick: brew install imagemagick');
      console.warn('');
      console.warn('   Şimdilik icon olduğu gibi bırakılıyor.');
      throw new Error('Yuvarlatma araçları bulunamadı');
    }
  }
  
  // Geçici dosyaları temizle
  if (fs.existsSync(scriptPath)) {
    fs.unlinkSync(scriptPath);
  }
  
  console.log('✅ Icon güncellendi (yuvarlatılmış köşeler)');
  console.log('📁 Güncellenen dosya: assets/icon.png');
  
} catch (error) {
  console.error('❌ Hata:', error.message);
  
  // Geçici klasörü temizle
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
  
  process.exit(1);
}

// Geçici klasörü temizle
if (fs.existsSync(tempDir)) {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}
