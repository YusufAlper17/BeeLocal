# GitHub Actions - Otomatik Build ve Release

Bu workflow, tüm platformlar için otomatik olarak build yapar ve GitHub Releases'e yükler.

## 🚀 Nasıl Çalışır?

### Otomatik Tetikleme
Workflow şu durumlarda otomatik olarak çalışır:
- Bir tag push edildiğinde (örn: `v1.0.0`, `v1.0.1`)
- Manuel olarak GitHub Actions sekmesinden tetiklenebilir

### Build Edilen Platformlar
- **macOS**: Apple Silicon (arm64) ve Intel (x64)
- **Windows**: x64 (Installer ve Portable)
- **Linux**: x64 (AppImage ve DEB)

## 📝 Kullanım

### 1. Yeni Release Oluşturma

```bash
# 1. package.json'da versiyonu güncelle
# "version": "1.0.1"

# 2. Değişiklikleri commit et
git add .
git commit -m "chore: Bump version to 1.0.1"

# 3. Tag oluştur ve push et
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

### 2. Workflow Otomatik Çalışır

Tag push edildiğinde:
1. Tüm platformlar için build başlar (paralel)
2. Build dosyaları artifact olarak kaydedilir
3. Tüm build'ler tamamlandığında release oluşturulur
4. Dosyalar otomatik olarak release'e yüklenir

### 3. Web Sitesi Otomatik Güncellenir

Web sitesi (`docs/index.html`) GitHub API'yi kullanarak en son release'i otomatik olarak algılar ve indirme linklerini günceller.

## 🔍 Kontrol

1. **GitHub Actions**: Repository > Actions sekmesinden workflow durumunu kontrol edin
2. **Releases**: Repository > Releases sekmesinden release'i kontrol edin
3. **Web Sitesi**: https://yusufalper17.github.io/BeeLocal adresinden indirme linklerini test edin

## ⚠️ Notlar

- İlk build yaklaşık 15-20 dakika sürebilir
- Sonraki build'ler daha hızlı olacaktır (cache sayesinde)
- macOS build'leri için code signing gerekmez (identity: null)
- Windows build'leri için code signing gerekmez

## 🐛 Sorun Giderme

### Build başarısız olursa
- GitHub Actions loglarını kontrol edin
- Node.js versiyonu uyumlu mu kontrol edin
- Dependencies eksik mi kontrol edin

### Release oluşturulmadıysa
- Tag doğru formatta mı? (`v1.0.0` formatında olmalı)
- Tüm build'ler başarılı mı?
- GitHub Actions loglarını kontrol edin

