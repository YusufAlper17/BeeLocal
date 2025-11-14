# Ekran Görüntüleri Klasörü

Bu klasörde web sitesinde kullanılacak ekran görüntüleri bulunur.

## Gerekli Ekran Görüntüleri

Lütfen aşağıdaki ekran görüntülerini bu klasöre ekleyin:

### 1. Giriş Ekranı
**Dosya adı:** `screenshot-login.png`
- BeeLocal giriş ekranı
- İTÜ kullanıcı adı ve şifre alanları
- "Beni Hatırla" checkbox'ı
- Giriş butonu

### 2. Ana Ekran (Dashboard)
**Dosya adı:** `screenshot-dashboard.png`
- Sol panelde ders listesi
- Sağ panelde dosya listesi
- İndirilmiş ve indirilmemiş dosyaların renk kodlaması
- Üst menü (Yenile, Ayarlar, Çıkış)

### 3. Ayarlar Sayfası
**Dosya adı:** `screenshot-settings.png`
- İndirme klasörü seçimi
- Klasör yapısı seçenekleri
- Tema seçimi (Light/Dark/System)
- Bildirim ayarları

### 4. İndirme İşlemi (Opsiyonel)
**Dosya adı:** `screenshot-download.png`
- Dosya indirme modal'ı
- Progress bar
- İndirme durumu göstergesi

## Önerilen Özellikler

- **Format:** PNG veya JPG
- **Boyut:** Minimum 1200x800 piksel (web için optimize edilmiş)
- **Dosya Boyutu:** 500KB altında (hızlı yükleme için)
- **Ekran:** Tam ekran ekran görüntüleri yerine, sadece uygulama penceresi
- **Arka Plan:** Mümkünse temiz bir masaüstü arka planı ile

## Ekran Görüntülerini Ekledikten Sonra

`docs/index.html` dosyasında placeholder'ları güncelleyin:

```html
<!-- ŞU AN: -->
<div class="screenshot-placeholder">
    <svg>...</svg>
</div>

<!-- DEĞİŞTİRİN: -->
<img src="images/screenshot-login.png" alt="Giriş Ekranı">
```

### Güncelleme Adımları

1. Ekran görüntülerini bu klasöre ekleyin
2. `docs/index.html` dosyasını açın
3. Her screenshot-card içindeki `<div class="screenshot-placeholder">` elementini silin
4. Yerine `<img src="images/screenshot-XXX.png" alt="Açıklama">` ekleyin
5. Değişiklikleri kaydedin ve GitHub'a push edin

## Mevcut Dosyalar

- `icon.png` - BeeLocal logosu (✅ Eklendi)
- `screenshot-login.png` - ⏳ Bekleniyor
- `screenshot-dashboard.png` - ⏳ Bekleniyor
- `screenshot-settings.png` - ⏳ Bekleniyor
- `screenshot-download.png` - ⏳ Opsiyonel

---

**Not:** Ekran görüntülerini eklemeden de web sitesi çalışır. Placeholder'lar görünür durumda olacaktır.











