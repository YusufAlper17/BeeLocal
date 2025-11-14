# BeeLocal Web Sitesi

Bu klasör BeeLocal'in resmi web sitesini içerir. Site GitHub Pages üzerinden yayınlanmaktadır.

## 📂 Dosya Yapısı

```
docs/
├── index.html          # Ana sayfa
├── styles.css          # Custom CSS stilleri
├── script.js           # JavaScript fonksiyonları
├── .nojekyll          # Jekyll'i devre dışı bırakır
├── images/            # Görseller klasörü
│   ├── icon.png       # Logo
│   └── README.md      # Ekran görüntüleri talimatları
└── README.md          # Bu dosya
```

## 🚀 Yayınlama

### GitHub Pages'i Aktifleştirme

1. GitHub repository Settings > Pages bölümüne gidin
2. Source olarak `main` branch ve `/docs` klasörünü seçin
3. Save'e tıklayın
4. Site `https://[kullanıcıadınız].github.io/BeeLocal` adresinde yayınlanacaktır

### Yerel Olarak Test Etme

Yerel olarak test etmek için basit bir HTTP sunucusu kullanabilirsiniz:

```bash
# Python 3 ile:
cd docs
python3 -m http.server 8000

# Node.js http-server ile:
npx http-server docs -p 8000

# PHP ile:
cd docs
php -S localhost:8000
```

Tarayıcınızda `http://localhost:8000` adresini açın.

## 🖼️ Ekran Görüntülerini Ekleme

1. Ekran görüntülerinizi `images/` klasörüne ekleyin:
   - `screenshot-login.png`
   - `screenshot-dashboard.png`
   - `screenshot-settings.png`

2. `index.html` dosyasında placeholder bölümlerini güncelleyin:

```html
<!-- ŞU ANKİ: -->
<div class="screenshot-placeholder">
    <!-- SVG icon -->
</div>

<!-- DEĞİŞTİRİN: -->
<img src="images/screenshot-login.png" alt="Giriş Ekranı">
```

3. Tüm placeholder'ları (3 adet) bu şekilde güncelleyin.

## 🔗 İndirme Linklerini Güncelleme

`index.html` dosyasında aşağıdaki yerleri güncelleyin:

1. **GitHub bağlantıları**: Varsayılan olarak `https://github.com/YusufAlper17/BeeLocal` adresine yönlendirilir. Kendi fork'unuzu yayınlıyorsanız bu adresleri repo URL'nizle değiştirin.
2. **Versiyon numaraları**: `v1.0.0` kısımlarını güncel versiyonla değiştirin.
3. **Release dosya adları**: Dosya adlarının GitHub Releases'deki dosyalarla eşleştiğinden emin olun.

Örnek arama-değiştirme:
- `BeeLocal-1.0.0` → `BeeLocal-1.1.0`
- `arm64` → `x64` (Intel macOS paketi eklediğinizde)

## 🎨 Özelleştirme

### Renkleri Değiştirme

`styles.css` dosyasındaki CSS değişkenlerini düzenleyin:

```css
:root {
    --primary-color: #f59e0b;  /* Ana renk (turuncu/sarı) */
    --primary-dark: #d97706;   /* Koyu ana renk */
    --secondary-color: #3b82f6; /* İkincil renk (mavi) */
}
```

### Logo Değiştirme

`images/icon.png` dosyasını kendi logonuzla değiştirin. Önerilen boyut: 512x512px.

### İçerik Güncelleme

`index.html` dosyasını doğrudan düzenleyerek:
- Özellik açıklamalarını
- SSS sorularını
- Footer bilgilerini
- İletişim linklerini

güncelleyebilirsiniz.

## 🌐 Özel Domain

Kendi domain adınızı kullanmak için:

1. `docs/` klasöründe `CNAME` dosyası oluşturun:
```
beelocal.app
```

2. Domain sağlayıcınızda DNS ayarlarını yapın:
```
A Record: 185.199.108.153
A Record: 185.199.109.153
A Record: 185.199.110.153
A Record: 185.199.111.153
```

3. GitHub Pages ayarlarından "Enforce HTTPS" seçeneğini aktifleştirin.

## 📊 Analytics (Opsiyonel)

Google Analytics eklemek için `index.html` dosyasının `<head>` bölümüne şunu ekleyin:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

`G-XXXXXXXXXX` kısmını kendi tracking ID'nizle değiştirin.

## 🔍 SEO İyileştirmeleri

Site zaten temel SEO optimizasyonlarına sahip:
- ✅ Meta açıklamalar
- ✅ Open Graph etiketleri
- ✅ Twitter Card etiketleri
- ✅ Semantic HTML
- ✅ Mobile responsive
- ✅ Fast loading (CDN kullanımı)

Ek iyileştirmeler için:
1. `sitemap.xml` dosyası ekleyin
2. `robots.txt` dosyası ekleyin
3. Ekran görüntülerine `alt` metinleri ekleyin

## 📱 Responsive Tasarım

Site aşağıdaki cihazlarda test edilmiştir:
- 📱 Mobile (320px - 767px)
- 📱 Tablet (768px - 1023px)
- 💻 Desktop (1024px+)

Tailwind CSS breakpoint'leri:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

## 🐛 Sorun Giderme

### Site görünmüyor
- GitHub Pages'in aktif olduğunu kontrol edin
- `/docs` klasörünün seçili olduğunu kontrol edin
- Birkaç dakika bekleyin (ilk yayınlama 5-10 dakika sürebilir)

### Stiller yüklenmiyor
- Tailwind CDN linkinin doğru olduğunu kontrol edin
- `styles.css` dosyasının doğru path'te olduğunu kontrol edin
- Browser cache'i temizleyin

### JavaScript çalışmıyor
- Browser konsolunu kontrol edin (F12)
- `script.js` dosyasının doğru yüklendiğini kontrol edin
- JavaScript hatalarını kontrol edin

### İndirme linkleri çalışmıyor
- GitHub Releases'in oluşturulduğunu kontrol edin
- Dosya adlarının eşleştiğini kontrol edin
- URL'lerin doğru formatda olduğunu kontrol edin

## 📝 Lisans

Bu web sitesi BeeLocal projesinin bir parçasıdır ve aynı MIT lisansı altındadır.

## 💡 İpuçları

- Değişikliklerinizi test etmek için yerel sunucu kullanın
- Commit'lemeden önce responsive tasarımı kontrol edin
- Ekran görüntülerini optimize edin (TinyPNG, ImageOptim vb.)
- Link'lerin çalıştığından emin olun
- SEO için anlamlı alt metinler kullanın

---

Made with ❤️ by İTÜ Students









