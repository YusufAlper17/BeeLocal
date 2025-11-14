# Icon Sorunu Çözümü

Eğer BeeLocal uygulamasında Electron'un default icon'u görünüyorsa, aşağıdaki adımları takip edin:

## macOS Icon Cache Temizleme

Terminal'de şu komutları çalıştırın:

```bash
# Icon cache'i temizle
rm -rf ~/Library/Caches/com.apple.iconservices
rm -rf /Library/Caches/com.apple.iconservices.store

# Finder ve Dock'u yeniden başlat
killall Finder
killall Dock

# Launch Services veritabanını yenile
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user
```

## Tarayıcı Cache Temizleme

Eğer web sitesinden indirme yapıyorsanız:

1. Tarayıcınızın cache'ini temizleyin
2. Hard refresh yapın (Cmd+Shift+R veya Ctrl+Shift+R)
3. Veya tarayıcıyı gizli modda açıp tekrar indirin

## Uygulamayı Yeniden Yükleme

1. BeeLocal.app'i Applications klasöründen silin
2. Yukarıdaki icon cache temizleme adımlarını uygulayın
3. Yeni DMG dosyasını indirip uygulamayı tekrar yükleyin

## Kontrol

Icon'un doğru göründüğünü kontrol etmek için:

```bash
# DMG içindeki icon dosyasını kontrol et
hdiutil attach BeeLocal-1.0.0-arm64.dmg -readonly -nobrowse -mountpoint /tmp/beelocal_check
ls -la /tmp/beelocal_check/BeeLocal.app/Contents/Resources/icon.icns
hdiutil detach /tmp/beelocal_check
```

Icon dosyası 191KB boyutunda ve 1024x1024 çözünürlükte olmalıdır.



