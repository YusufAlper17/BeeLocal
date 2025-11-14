import { app, BrowserWindow, ipcMain, dialog, safeStorage, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { ninovaService } from './services/ninova'
import { databaseService } from './services/database'
import { storageService } from './services/storage'
// downloadService artık kullanılmıyor - ninovaService.downloadFile() kullanılıyor
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let appIcon: Electron.NativeImage | undefined

// Development modu kontrolü
const isDev = !!process.env.VITE_DEV_SERVER_URL

// Debug helper fonksiyonları - sadece development'ta log yaz
const debugLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args)
  }
}

const debugWarn = (...args: any[]) => {
  if (isDev) {
    console.warn(...args)
  }
}

// Hatalar her zaman loglanmalı
const debugError = (...args: any[]) => {
  console.error(...args)
}

const createWindow = () => {
  const preloadPath = path.join(__dirname, 'preload.cjs')
  debugLog('🔧 Preload path:', preloadPath)
  
  // Icon path'ini belirle - tüm platformlar için development ve production
  let iconPath: string | undefined
  
  const getIconPath = (): string | undefined => {
    const platform = process.platform
    
    debugLog('🔍 Icon arama başlatılıyor...')
    debugLog('   Platform:', platform)
    debugLog('   Mod:', isDev ? 'Development' : 'Production')
    debugLog('   __dirname:', __dirname)
    debugLog('   process.cwd():', process.cwd())
    
    // Platform'a göre icon uzantısını belirle
    let iconExt: string
    if (platform === 'darwin') {
      iconExt = 'icns'
    } else if (platform === 'win32') {
      iconExt = 'ico'
    } else {
      // Linux ve diğer platformlar
      iconExt = 'png'
    }
    
    debugLog('   Aranan icon dosyası: icon.' + iconExt)
    
    // Olası icon path'lerini belirle
    const possiblePaths: string[] = []
    
    if (isDev) {
      // Development modu - build klasöründen direkt al
      // __dirname development'ta dist-electron klasörüne işaret eder
      possiblePaths.push(
        path.join(__dirname, '../build/icon.' + iconExt), // dist-electron'dan build'e
        path.join(__dirname, 'build/icon.' + iconExt), // dist-electron/build (vite kopyalar)
        path.join(process.cwd(), 'build/icon.' + iconExt), // Proje root'undan
        path.join(__dirname, '../../build/icon.' + iconExt) // Ekstra fallback
      )
    } else {
      // Production modu - extraResources ile icon dosyaları resources klasörüne kopyalanır
      // app.getAppPath() production'da genellikle Resources/app.asar döner
      const appPath = app.getAppPath()
      
      if (platform === 'darwin') {
        // macOS: extraResources ile icon Contents/Resources/icon.icns'e kopyalanır
        // app.getAppPath() -> Contents/Resources/app.asar döner
        const resourcesPath = path.dirname(appPath) // Contents/Resources
        
        // extraResources ile kopyalanan dosyalar doğrudan Resources klasöründe
        possiblePaths.push(
          path.join(resourcesPath, 'icon.' + iconExt) // Contents/Resources/icon.icns (DOĞRU KONUM)
        )
      } else if (platform === 'win32') {
        // Windows: extraResources ile icon resources/icon.ico'ya kopyalanır
        // Windows'ta app.getPath('exe') -> executable path'i döner
        try {
          const exePath = app.getPath('exe')
          const exeDir = path.dirname(exePath)
          const resourcesDir = path.join(exeDir, 'resources')
          
          // extraResources ile kopyalanan dosyalar resources klasöründe
          possiblePaths.push(
            path.join(resourcesDir, 'icon.' + iconExt) // resources/icon.ico (DOĞRU KONUM)
          )
        } catch (e) {
          debugWarn('getPath("exe") çalışmadı:', e)
          // Fallback: app.asar'ın üst dizini
          possiblePaths.push(
            path.join(appPath, '..', 'icon.' + iconExt)
          )
        }
      } else {
        // Linux: AppImage, deb, vb. için
        // Linux'ta da extraResources ile icon resources/icon.png'ye kopyalanır
        try {
          const exePath = app.getPath('exe')
          const exeDir = path.dirname(exePath)
          const resourcesDir = path.join(exeDir, 'resources')
          
          // extraResources ile kopyalanan dosyalar resources klasöründe
          possiblePaths.push(
            path.join(resourcesDir, 'icon.' + iconExt) // resources/icon.png (DOĞRU KONUM)
          )
        } catch (e) {
          debugWarn('getPath("exe") çalışmadı:', e)
          // Fallback: app.asar'ın üst dizini
          possiblePaths.push(
            path.join(appPath, '..', 'icon.' + iconExt)
          )
        }
      }
      
      // Fallback: Eğer yukarıdaki path'ler bulunamazsa __dirname'den dene
      possiblePaths.push(
        path.join(__dirname, '../build/icon.' + iconExt),
        path.join(__dirname, '../../build/icon.' + iconExt)
      )
    }
    
    // İlk bulunan geçerli path'i döndür
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        debugLog('✅ Icon bulundu:', possiblePath)
        return possiblePath
      }
    }
    
    // Icon bulunamadıysa log yaz ama uygulama çalışmaya devam etsin
    debugWarn('⚠️ Icon dosyası bulunamadı. Olası path\'ler denenmiş:')
    possiblePaths.forEach(p => {
      try {
        debugWarn('  -', p, fs.existsSync(p) ? '(MEVCUT)' : '(YOK)')
      } catch {
        debugWarn('  -', p, '(KONTROL EDİLEMEDİ)')
      }
    })
    
    return undefined
  }
  
  iconPath = getIconPath()
  
  // Icon'u native image olarak yükle
  debugLog('📦 Icon yükleme işlemi başlatılıyor...')
  debugLog('   Icon path:', iconPath || '(BULUNAMADI)')
  
  if (iconPath) {
    try {
      // Dosya varlığını tekrar kontrol et
      if (!fs.existsSync(iconPath)) {
        debugError('❌ Icon dosyası bulunamadı (path kontrolü):', iconPath)
        appIcon = undefined
      } else {
        const stats = fs.statSync(iconPath)
        debugLog('   Dosya boyutu:', stats.size, 'bytes')
        debugLog('   Dosya modu:', stats.mode.toString(8))
        
        appIcon = nativeImage.createFromPath(iconPath)
        
        if (appIcon.isEmpty()) {
          debugError('❌ Icon dosyası boş veya okunamadı:', iconPath)
          debugError('   Dosya var ama içerik okunamıyor. Format kontrolü yapın.')
          appIcon = undefined
        } else {
          const iconSize = appIcon.getSize()
          debugLog('✅ Icon başarıyla yüklendi:', iconPath)
          debugLog('   Icon boyutu:', iconSize.width + 'x' + iconSize.height)
          debugLog('   Icon scale factors:', appIcon.getScaleFactors())
          
          // macOS için Dock icon'unu ayarla
          if (process.platform === 'darwin' && app.dock) {
            try {
              app.dock.setIcon(appIcon)
              debugLog('🎨 macOS Dock icon ayarlandı')
              
              // Icon'un gerçekten ayarlandığını doğrula
              const dockIcon = app.dock.getBadge()
              debugLog('   Dock badge:', dockIcon || '(yok)')
            } catch (error) {
              debugError('❌ Dock icon ayarlanamadı:', error)
              if (error instanceof Error) {
                debugError('   Hata mesajı:', error.message)
                debugError('   Stack:', error.stack)
              }
            }
          }
        }
      }
    } catch (error) {
      debugError('❌ Icon yüklenirken hata:', error)
      if (error instanceof Error) {
        debugError('   Hata mesajı:', error.message)
        debugError('   Stack:', error.stack)
      }
      appIcon = undefined
    }
  } else {
    debugWarn('⚠️ Icon path bulunamadı, default icon kullanılacak')
    debugWarn('   Bu durumda Electron default icon\'u gösterilecek')
  }
  
  // BrowserWindow için icon ayarı
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff',
    show: false,
  }
  
  // Icon varsa ekle
  if (appIcon) {
    windowOptions.icon = appIcon
    debugLog('🪟 BrowserWindow icon ayarlandı')
  } else {
    debugWarn('⚠️ BrowserWindow icon ayarlanmadı (appIcon yok)')
  }
  
  debugLog('🪟 BrowserWindow oluşturuluyor...')
  debugLog('   Icon kullanılıyor:', !!windowOptions.icon)
  
  mainWindow = new BrowserWindow(windowOptions)

  // Development modunda localhost, production'da dosya
  if (isDev) {
    debugLog('🛠️ Development modu: URL yükleniyor');
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
      .then(() => debugLog('✅ Dev URL başarıyla yüklendi'))
      .catch(err => debugError('❌ Dev URL yükleme hatası:', err));
    // Development'ta DevTools aç
    mainWindow.webContents.openDevTools()
  } else {
    // Production build için doğru yolu kullan
    // app.getAppPath() packaged app'te doğru resource path'i verir
    const appPath = app.getAppPath()
    const indexPath = path.join(appPath, 'dist/index.html')
    debugLog('📂 App path:', appPath)
    debugLog('📄 Index path:', indexPath)
    if (!fs.existsSync(indexPath)) {
      debugError('❌ Index.html dosyası bulunamadı:', indexPath);
    }
    mainWindow.loadFile(indexPath, { hash: '/login' })
      .then(() => debugLog('✅ Production index.html başarıyla yüklendi'))
      .catch(err => debugError('❌ Production yükleme hatası:', err));
    // Production'da DevTools AÇILMAYACAK
  }
  
  // Preload script yüklendiğinde log
  mainWindow.webContents.on('did-finish-load', () => {
    debugLog('✅ Sayfa yüklendi, Electron API hazır olmalı');
    // Renderer'a test mesajı gönder (sadece development'ta)
    if (mainWindow && isDev) {
      mainWindow.webContents.send('test-renderer', 'Renderer çalışıyor mu?');
    }
  })

  // Renderer'dan gelen mesajları dinle
  ipcMain.on('test-main', (_event, message) => {
    debugLog('📩 Renderer\'dan mesaj alındı:', message);
  });

  mainWindow.once('ready-to-show', () => {
    // Window hazır olduğunda icon'u tekrar set et (macOS için)
    if (process.platform === 'darwin' && appIcon && app.dock) {
      try {
        app.dock.setIcon(appIcon)
        debugLog('🔄 Window hazır - Dock icon tekrar ayarlandı')
      } catch (error) {
        debugError('❌ Window ready - Dock icon ayarlanamadı:', error)
      }
    }
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  debugLog('🚀 App hazır, başlatılıyor...')
  debugLog('   Platform:', process.platform)
  debugLog('   App path:', app.getAppPath())
  debugLog('   App name:', app.getName())
  debugLog('   App version:', app.getVersion())
  
  // Database'i başlat
  await databaseService.initialize()
  
  createWindow()
  
  // Icon durumunu doğrula
  if (process.platform === 'darwin' && app.dock) {
    debugLog('🔍 Dock icon durumu kontrol ediliyor...')
    // Dock icon'u tekrar ayarla (bazı durumlarda gecikmeli yüklenebilir)
    setTimeout(() => {
      if (appIcon && app.dock) {
        try {
          app.dock.setIcon(appIcon)
          debugLog('✅ Dock icon tekrar ayarlandı (gecikmeli)')
        } catch (error) {
          debugError('❌ Gecikmeli dock icon ayarı başarısız:', error)
        }
      }
    }, 1000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Cleanup
  ninovaService.close()
  databaseService.close()
})

// ============= IPC Handlers =============

// System
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData')
})

ipcMain.handle('app-quit', () => {
  app.quit()
})

// Security
ipcMain.handle('encrypt-password', (_, password: string) => {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(password).toString('base64')
  }
  return null
})

ipcMain.handle('decrypt-password', (_, encrypted: string) => {
  if (safeStorage.isEncryptionAvailable()) {
    const buffer = Buffer.from(encrypted, 'base64')
    return safeStorage.decryptString(buffer)
  }
  return null
})

// Ninova işlemleri
ipcMain.handle('ninova-login', async (_, username: string, password: string) => {
  try {
    return await ninovaService.login(username, password)
  } catch (error) {
    console.error('Login error:', error)
    return false
  }
})

ipcMain.handle('ninova-get-courses', async () => {
  try {
    const courses = await ninovaService.getCourses()
    return courses
  } catch (error) {
    console.error('Get courses error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Eğer login hatası ise, error throw et
    if (errorMessage.includes('giriş yapmalısınız')) {
      throw error
    }
    return []
  }
})

ipcMain.handle('ninova-get-files', async (_, courseId: string) => {
  try {
    const files = await ninovaService.getCourseFiles(courseId)
    console.log(`📄 ${files.length} dosya/klasör bulundu`)
    return files
  } catch (error) {
    console.error('Get files error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Eğer login hatası ise, error throw et
    if (errorMessage.includes('giriş yapmalısınız')) {
      throw error
    }
    return []
  }
})

ipcMain.handle('ninova-get-folder-contents', async (_, folderUrl: string, courseId: string, category: string, folderPath: string) => {
  try {
    return await ninovaService.getFolderContents(folderUrl, courseId, category, folderPath)
  } catch (error) {
    console.error('Get folder contents error:', error)
    return []
  }
})

ipcMain.handle('ninova-get-recursive-stats', async (_, courseId: string, category: string) => {
  try {
    return await ninovaService.getAllFilesRecursive(courseId, category)
  } catch (error) {
    console.error('Get recursive stats error:', error)
    return { folders: 0, totalFiles: 0 }
  }
})

// ✅ Tüm derslerin tüm duyurularını çek (Her dersin duyuru sayfasından)
ipcMain.handle('ninova-get-all-announcements', async () => {
  try {
    const announcements = await ninovaService.getAllAnnouncementsFromAllCourses()
    console.log(`📢 Tüm derslerden ${announcements.length} duyuru bulundu`)
    return announcements
  } catch (error) {
    console.error('Get all announcements error:', error)
    return []
  }
})

// Kampus sayfasından son duyuruları çek (hızlı erişim)
ipcMain.handle('ninova-get-kampus-announcements', async () => {
  try {
    const announcements = await ninovaService.getAllAnnouncementsFromKampus()
    console.log(`📢 Kampus'tan ${announcements.length} duyuru bulundu`)
    return announcements
  } catch (error) {
    console.error('Get kampus announcements error:', error)
    return []
  }
})

// Belirli bir dersin duyurularını çek
ipcMain.handle('ninova-get-announcements', async (_, courseId: string) => {
  try {
    const announcements = await ninovaService.getAnnouncements(courseId)
    console.log(`📢 ${announcements.length} duyuru bulundu`)
    return announcements
  } catch (error) {
    console.error('Get announcements error:', error)
    return []
  }
})

ipcMain.handle('ninova-download-file', async (_, fileUrl: string, savePath: string) => {
  try {
    console.log('🎯 [IPC] İndirme isteği alındı')
    console.log('   URL:', fileUrl)
    console.log('   Save Path:', savePath)
    
    // ninovaService kullan (oturum bilgisi gerekli)
    await ninovaService.downloadFile(fileUrl, savePath)
    
    console.log('✅ [IPC] İndirme başarılı')
    
    if (mainWindow) {
      mainWindow.webContents.send('download-complete', { success: true, path: savePath })
    }
  } catch (error) {
    console.error('❌ [IPC] İndirme hatası:', error)
    if (mainWindow) {
      mainWindow.webContents.send('download-complete', { success: false, error: String(error) })
    }
    throw error
  }
})

// Database işlemleri - Ninova Files
ipcMain.handle('db-save-ninova-file', (_, fileData: any) => {
  try {
    databaseService.saveNinovaFile(fileData)
  } catch (error) {
    console.error('DB save ninova file error:', error)
  }
})

ipcMain.handle('db-bulk-save-ninova-files', (_, files: any[]) => {
  try {
    databaseService.bulkSaveNinovaFiles(files)
  } catch (error) {
    console.error('DB bulk save ninova files error:', error)
  }
})

// Database işlemleri - Downloaded Files
ipcMain.handle('db-add-downloaded-file', (_, fileData: any) => {
  try {
    console.log(`[IPC] db-add-downloaded-file çağrıldı: ${fileData.file_name}`)
    databaseService.addDownloadedFile(fileData)
    console.log(`[IPC] db-add-downloaded-file BAŞARILI`)
  } catch (error) {
    console.error('[IPC] DB add downloaded file error:', error)
    throw error // Hatayı frontend'e fırlat
  }
})

ipcMain.handle('db-get-downloaded-files', () => {
  try {
    return databaseService.getDownloadedFiles()
  } catch (error) {
    console.error('DB get downloaded files error:', error)
    return []
  }
})

ipcMain.handle('db-check-file-exists', (_, fileId: string) => {
  try {
    return databaseService.checkFileExists(fileId)
  } catch (error) {
    console.error('DB check file exists error:', error)
    return false
  }
})

ipcMain.handle('db-delete-downloaded-file', (_, fileId: string) => {
  try {
    databaseService.deleteDownloadedFile(fileId)
  } catch (error) {
    console.error('DB delete downloaded file error:', error)
  }
})

ipcMain.handle('db-get-ninova-files', () => {
  try {
    return databaseService.getNinovaFiles()
  } catch (error) {
    console.error('DB get ninova files error:', error)
    return []
  }
})

ipcMain.handle('db-get-ninova-files-by-course', (_, courseId: string) => {
  try {
    return databaseService.getNinovaFilesByCourse(courseId)
  } catch (error) {
    console.error('DB get ninova files by course error:', error)
    return []
  }
})

ipcMain.handle('db-get-ninova-file-by-hash', (_, hash: string) => {
  try {
    return databaseService.getNinovaFileByHash(hash)
  } catch (error) {
    console.error('DB get ninova file by hash error:', error)
    return null
  }
})

// Database işlemleri - Courses
ipcMain.handle('db-save-course', (_, courseData: any) => {
  try {
    databaseService.saveCourse(courseData)
  } catch (error) {
    console.error('DB save course error:', error)
  }
})

ipcMain.handle('db-get-courses', () => {
  try {
    return databaseService.getCourses()
  } catch (error) {
    console.error('DB get courses error:', error)
    return []
  }
})

// File Scanner işlemleri kaldırıldı - artık klasör taraması yapılmıyor
// İndirme durumu sadece veritabanından kontrol ediliyor

// Settings
ipcMain.handle('get-settings', () => {
  try {
    const settings = storageService.getSettings()
    const credentials = storageService.getSavedCredentials()
    return { ...settings, ...credentials }
  } catch (error) {
    console.error('Get settings error:', error)
    return null
  }
})

ipcMain.handle('save-settings', (_, settings: any) => {
  try {
    const { savedUsername, savedPassword, ...appSettings } = settings
    
    storageService.saveSettings(appSettings)
    
    if (savedUsername) {
      storageService.saveSavedUsername(savedUsername)
    }
    if (savedPassword) {
      storageService.saveSavedPassword(savedPassword)
    }
  } catch (error) {
    console.error('Save settings error:', error)
  }
})

ipcMain.handle('add-saved-path', (_, path: string) => {
  try {
    storageService.addSavedPath(path)
  } catch (error) {
    console.error('Add saved path error:', error)
  }
})

ipcMain.handle('remove-saved-path', (_, path: string) => {
  try {
    storageService.removeSavedPath(path)
  } catch (error) {
    console.error('Remove saved path error:', error)
  }
})

ipcMain.handle('clear-ninova-files', async () => {
  try {
    console.log('🗑️ Ninova dosyaları temizleniyor...')
    await databaseService.clearNinovaFiles()
    console.log('✅ Ninova dosyaları başarıyla temizlendi')
    return { success: true }
  } catch (error) {
    console.error('Clear ninova files error:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('remove-duplicate-ninova-files', async () => {
  try {
    console.log('🔍 Duplicate dosyalar temizleniyor...')
    const deletedCount = await databaseService.removeDuplicateNinovaFiles()
    console.log(`✅ ${deletedCount} duplicate dosya silindi`)
    return { success: true, deletedCount }
  } catch (error) {
    console.error('Remove duplicates error:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('clear-all-data', async () => {
  try {
    console.log('🗑️ Tüm veriler siliniyor...')
    
    // Storage'ı temizle (ayarlar, kaydedilmiş klasörler, credentials)
    storageService.clear()
    
    // Database'i tamamen temizle
    await databaseService.clearAllData()
    
    console.log('✅ Tüm veriler başarıyla silindi')
    return { success: true }
  } catch (error) {
    console.error('Clear all data error:', error)
    return { success: false, error: String(error) }
  }
})

