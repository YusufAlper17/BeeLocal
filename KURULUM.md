# BeeLocal Kurulum Rehberi

## Gereksinimler

Uygulamayı çalıştırmak için şu yazılımların sisteminizde kurulu olması gerekmektedir:

- **Node.js** 18 veya üzeri ([İndir](https://nodejs.org/))
- **npm** veya **yarn** (Node.js ile birlikte gelir)

## Kurulum Adımları

### 1. Bağımlılıkları Yükleyin

Proje klasöründe terminal açın ve aşağıdaki komutu çalıştırın:

```bash
npm install
```

veya yarn kullanıyorsanız:

```bash
yarn install
```

Bu işlem birkaç dakika sürebilir. Tüm gerekli paketler indirilip kurulacaktır.

### 2. Geliştirme Modunda Çalıştırma

Uygulamayı geliştirme modunda çalıştırmak için:

```bash
npm run electron:dev
```

Bu komut:
- React geliştirme sunucusunu başlatır
- Electron penceresini açar
- Hot reload özelliği ile değişiklikleri anında gösterir

### 3. Production Build Oluşturma

Uygulamanın kurulabilir versiyonunu oluşturmak için:

```bash
npm run electron:build
```

Build tamamlandığında `release` klasöründe platforma özel kurulum dosyalarını bulabilirsiniz:

- **macOS**: `.dmg` ve `.zip` dosyaları
- **Windows**: `.exe` ve portable versiyon
- **Linux**: `.AppImage` ve `.deb` dosyaları

## İlk Kullanım

### 1. Giriş Yapın

- Uygulamayı açın
- İTÜ kullanıcı adı ve şifrenizi girin
- "Beni Hatırla" seçeneğini işaretleyerek bir sonraki açılışta otomatik giriş yapabilirsiniz

### 2. İndirme Klasörünü Ayarlayın

- Sağ üst köşedeki "Ayarlar" butonuna tıklayın
- "İndirme Klasörü" bölümünden dosyaların indirileceği klasörü seçin
- İstediğiniz klasör yapısını seçin:
  - **Ders Adı**: Dosyalar ders adına göre klasörlere ayrılır
  - **Dönem / Ders**: Önce dönem, sonra ders klasörleri oluşturulur
  - **Özel Klasör**: Tüm dosyalar seçtiğiniz klasöre doğrudan indirilir

### 3. Dosyaları İndirin

- Dashboard'da sol taraftan bir ders seçin
- İndirilmemiş dosyalar mavi renkle gösterilir
- Tek dosya indirmek için dosyanın yanındaki "İndir" butonuna tıklayın
- Birden fazla dosya seçip "Seçilenleri İndir" butonuna tıklayabilirsiniz
- Veya "Tümünü İndir" ile tüm dosyaları tek seferde indirebilirsiniz

## Sorun Giderme

### Uygulama açılmıyor

1. Terminal'de `npm run electron:dev` komutunu çalıştırın
2. Hata mesajlarını kontrol edin
3. Node.js versiyonunun 18 veya üzeri olduğundan emin olun: `node --version`

### Giriş yapamıyorum

1. İnternet bağlantınızı kontrol edin
2. İTÜ kullanıcı adı ve şifrenizin doğru olduğundan emin olun
3. Ninova'nın erişilebilir olduğunu kontrol edin

### Dosyalar indirilmiyor

1. Ayarlar'dan indirme klasörünün seçildiğinden emin olun
2. Seçilen klasöre yazma izniniz olduğunu kontrol edin
3. Disk alanınızın yeterli olduğundan emin olun

### Database hatası alıyorum

1. Uygulamayı tamamen kapatın
2. Şu klasörü silin: `~/Library/Application Support/beelocal/` (macOS) veya `%APPDATA%/beelocal/` (Windows)
3. Uygulamayı yeniden başlatın

## Güvenlik

- Şifreleriniz Electron'un `safeStorage` API'si ile şifrelenerek saklanır
- Hiçbir veri üçüncü parti sunuculara gönderilmez
- Tüm veriler local olarak saklanır

## Destek

Sorun yaşıyorsanız veya öneriniz varsa:

- GitHub Issues bölümünden yeni bir issue açabilirsiniz
- README.md dosyasındaki iletişim bilgilerini kullanabilirsiniz

## Sistem Gereksinimleri

- **macOS**: 10.13 veya üzeri
- **Windows**: Windows 10 veya üzeri
- **Linux**: Ubuntu 18.04 veya eşdeğeri
- **RAM**: Minimum 4GB (8GB önerilir)
- **Disk**: Minimum 500MB boş alan

## Güncellemeler

Uygulama otomatik güncelleme özelliğine sahiptir. Yeni bir versiyon çıktığında bildirim alacaksınız.

---

**Not**: Bu uygulama resmi bir İTÜ uygulaması değildir. Öğrenciler tarafından, öğrenciler için geliştirilmiştir.
















