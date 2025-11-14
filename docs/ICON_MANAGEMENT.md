# 🎨 Icon Yönetimi Rehberi

Bu dokümantasyon, BeeLocal uygulamasında icon dosyalarının nasıl yönetildiğini ve yeni icon ekleme sürecini açıklar.

## 📁 Icon Dosya Yapısı

### Kaynak Dosya
- **Konum**: `assets/icon.png`
- **Açıklama**: Ana icon kaynak dosyası (1024x1024 veya daha büyük PNG formatında)
- **Kullanım**: Tüm platform icon'ları bu dosyadan oluşturulur

### Build Klasörü (`build/`)
Electron-builder tarafından kullanılan platform-specific icon dosyaları:

- **`build/icon.icns`** - macOS uygulama icon'u
- **`build/icon.ico`** - Windows uygulama icon'u  
- **`build/icon.png`** - Linux uygulama icon'u
- **`build/icon.iconset/`** - macOS ICNS oluşturma için geçici klasör

### Public Klasörü (`public/`)
- **`public/icon.png`** - Web uygulaması favicon'u (index.html'de kullanılır)

### Docs Klasörü (`docs/images/`)
- **`docs/images/icon.png`** - Web sitesi için icon (docs/index.html'de kullanılır)

## 🔄 Icon Güncelleme Süreci

### 1. Yeni Icon Ekleme

1. Yeni icon dosyanızı `assets/icon.png` olarak kaydedin
   - Format: PNG
   - Önerilen boyut: 1024x1024 veya daha büyük (kare)
   - Arka plan: Şeffaf veya dolu (tercihinize göre)

2. Icon hazırlama scriptini çalıştırın:
```bash
npm run prepare-icons
```

Bu script otomatik olarak:
- ✅ Linux için PNG oluşturur (1024x1024)
- ✅ macOS için ICNS oluşturur (tüm gerekli boyutlarda)
- ✅ Windows için ICO oluşturur (çoklu boyutlarda)
- ✅ Public klasörüne favicon kopyalar
- ✅ Docs/images klasörüne web sitesi icon'u kopyalar

### 2. Build İşlemi

Icon'lar otomatik olarak build sırasında hazırlanır:
```bash
npm run electron:build
```

Build script'leri otomatik olarak `prepare-icons` script'ini çalıştırır.

## 🛠️ Script'ler

### `npm run prepare-icons`
Tüm platform icon'larını `assets/icon.png`'den oluşturur.

**Ne yapar:**
1. `build/icon.png` oluşturur (Linux için)
2. `build/icon.icns` oluşturur (macOS için - tüm boyutlarda)
3. `build/icon.ico` oluşturur (Windows için - çoklu boyutlarda)
4. `public/icon.png` günceller (Web favicon)
5. `docs/images/icon.png` günceller (Web sitesi)

### `npm run clear-icon-cache`
İşletim sistemi icon cache'ini temizler (icon görünmüyorsa kullanın).

**Platform'a göre:**
- **macOS**: Icon cache, Launch Services ve Finder/Dock'u yeniler
- **Windows**: Thumbnail cache bilgisi verir
- **Linux**: GTK icon cache'i temizler

## 📦 Build Konfigürasyonu

### package.json
```json
{
  "build": {
    "mac": {
      "icon": "build/icon.icns"
    },
    "win": {
      "icon": "build/icon.ico"
    },
    "linux": {
      "icon": "build/icon.png"
    },
    "extraResources": [
      {
        "from": "build/icon.icns",
        "to": "icon.icns"
      },
      {
        "from": "build/icon.ico",
        "to": "icon.ico"
      },
      {
        "from": "build/icon.png",
        "to": "icon.png"
      }
    ]
  }
}
```

### vite.config.ts
Development modunda icon'ları `dist-electron/build/` klasörüne kopyalar.

### electron/main.ts
Runtime'da icon'ları yükler:
- Development: `build/` klasöründen
- Production: `extraResources` ile kopyalanan dosyalardan

## 🔍 Icon Yükleme Mantığı

`electron/main.ts` dosyasındaki `getIconPath()` fonksiyonu:

1. **Platform tespiti**: macOS (icns), Windows (ico), Linux (png)
2. **Development modu**: `build/` klasöründen direkt okur
3. **Production modu**: `extraResources` ile kopyalanan dosyalardan okur
4. **Fallback**: Birden fazla olası konumu dener

## ⚠️ Sorun Giderme

### Icon Görünmüyorsa

1. **Icon dosyalarını kontrol edin:**
```bash
ls -lh build/icon.*
```

2. **Icon hazırlama scriptini çalıştırın:**
```bash
npm run prepare-icons
```

3. **Cache'i temizleyin:**
```bash
npm run clear-icon-cache
```

4. **Uygulamayı yeniden başlatın**

5. **Build klasörünü temizleyip yeniden build yapın:**
```bash
rm -rf dist dist-electron release
npm run electron:build
```

### macOS'ta Icon Görünmüyorsa

1. Icon cache'i temizleyin:
```bash
npm run clear-icon-cache
```

2. Uygulamayı tamamen kaldırıp yeniden yükleyin

3. Info.plist'i kontrol edin:
```bash
plutil -p BeeLocal.app/Contents/Info.plist | grep CFBundleIconFile
```

### Windows'ta Icon Görünmüyorsa

1. `.ico` dosyasının geçerli olduğundan emin olun
2. Uygulamayı yeniden yükleyin
3. Thumbnail cache'i temizleyin

### Linux'ta Icon Görünmüyorsa

1. Icon dosyasının 512x512 veya 1024x1024 olduğundan emin olun
2. GTK icon cache'i yenileyin:
```bash
gtk-update-icon-cache -f -t ~/.local/share/icons
```

## 📝 Notlar

- Icon dosyaları build sırasında otomatik hazırlanır
- Yeni icon ekledikten sonra mutlaka `npm run prepare-icons` çalıştırın
- macOS'ta ICNS oluşturma için macOS gereklidir (diğer platformlarda iconset hazırlanır, ICNS oluşturulamaz)
- Windows ICO oluşturma için `to-ico` paketi kullanılır
- Tüm icon dosyaları `assets/icon.png`'den türetilir, tek kaynak prensibi

## 🔗 İlgili Dosyalar

- `assets/icon.png` - Kaynak icon
- `build/icon.*` - Platform icon'ları
- `scripts/prepare-icons.cjs` - Icon hazırlama scripti
- `scripts/clear-icon-cache.cjs` - Cache temizleme scripti
- `package.json` - Build konfigürasyonu
- `electron/main.ts` - Runtime icon yükleme
- `vite.config.ts` - Development icon kopyalama

