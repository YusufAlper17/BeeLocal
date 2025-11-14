import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, Course, CourseFile, Announcement } from '../types'

// Global cache for course files and stats
const courseFilesCache = new Map<string, CourseFile[]>()
const courseStatsCache = new Map<string, {
  sinif: { folders: number, totalFiles: number },
  ders: { folders: number, totalFiles: number }
}>()

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      courses: [],
      files: [],
      selectedCourse: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      initProgress: 0,
      initMessage: 'Başlatılıyor',
      announcements: [],

  setCourses: (courses: Course[]) => set({ courses }),
  
  setFiles: (files: CourseFile[]) => set({ files }),
  
  setSelectedCourse: (course: Course | null) => set({ selectedCourse: course }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
  
  setInitProgress: (progress: number, message: string) => 
    set({ initProgress: progress, initMessage: message }),
  
  setAnnouncements: (announcements: Announcement[]) => set({ announcements }),
  
  // ✅ Tüm duyuruları çek (Kampus Tüm Duyurular sayfasından - daha hızlı!)
  fetchAllAnnouncements: async () => {
    try {
      console.log(`📢 Tüm duyurular çekiliyor...`)
      const announcements = await window.electronAPI.ninovaGetKampusAnnouncements()
      
      // Duyurular zaten ders bilgisiyle birlikte geliyor
      set({ announcements })
      console.log(`✅ ${announcements.length} duyuru yüklendi (Tüm Duyurular)`)
    } catch (error) {
      console.error('Tüm duyurular çekme hatası:', error)
      set({ announcements: [] })
    }
  },
  
  // Kampus sayfasından son duyuruları çek (hızlı erişim - sadece son 3)
  fetchKampusAnnouncements: async () => {
    try {
      console.log(`📢 Kampus sayfasından son duyurular çekiliyor...`)
      const announcements = await window.electronAPI.ninovaGetKampusAnnouncements()
      
      // Duyurular zaten ders bilgisiyle birlikte geliyor (HTML'den parse edildi)
      set({ announcements })
      console.log(`✅ ${announcements.length} duyuru yüklendi (Kampus)`)
    } catch (error) {
      console.error('Kampus duyuru çekme hatası:', error)
      set({ announcements: [] })
    }
  },
  
  // Belirli bir dersin duyurularını çek
  fetchAnnouncements: async (courseId: string) => {
    try {
      console.log(`📢 ${courseId} için duyurular çekiliyor...`)
      const announcements = await window.electronAPI.ninovaGetAnnouncements(courseId)
      
      // courseName'i doldur
      const courses = get().courses
      const course = courses.find(c => c.id === courseId)
      const enrichedAnnouncements = announcements.map(a => ({
        ...a,
        courseName: course ? `${course.code} - ${course.name}` : a.courseName
      }))
      
      set({ announcements: enrichedAnnouncements })
      console.log(`✅ ${enrichedAnnouncements.length} duyuru yüklendi`)
    } catch (error) {
      console.error('Duyuru çekme hatası:', error)
      set({ announcements: [] })
    }
  },

  initializeApp: async () => {
    const { setInitProgress } = get()
    
    try {
      // 0. VERİTABANINDAKİ ESKI HATA VERİLERİNİ TEMİZLE (courseId düzeltmesi için - BİR KERELİK)
      const CURRENT_DB_VERSION = 10 // 🔧 V10: Full tree traversal - tüm klasör yapısı taranıyor
      
      const appSettings = await window.electronAPI.getSettings()
      const storedDbVersion = appSettings?.db_version || 1
      
      if (storedDbVersion < CURRENT_DB_VERSION) {
        setInitProgress(2, 'Veritabanı güncelleniyor...')
        console.log(`🔄 Veritabanı v${storedDbVersion} -> v${CURRENT_DB_VERSION} güncelleniyor...`)
        console.log(`📋 Güncelleme: Full tree traversal 🌳`)
        console.log(`📋 Parent'tan en derin child'a kadar tüm yapı taranıyor`)
        
        // Ninova files tablosunu tamamen temizle - yeniden yüklenecek
        await window.electronAPI.clearNinovaFiles()
        console.log('✅ Eski dosyalar temizlendi, full tree ile yüklenecek...')
        
        // Veritabanı versiyonunu kaydet
        await window.electronAPI.saveSettings({
          ...appSettings,
          db_version: CURRENT_DB_VERSION
        })
        console.log(`✅ Veritabanı v${CURRENT_DB_VERSION}'ye güncellendi`)
      } else {
        console.log(`✅ Veritabanı güncel (v${CURRENT_DB_VERSION})`)
      }
      
      // 1. Duplicate dosyaları temizle (eğer varsa)
      setInitProgress(3, 'Duplicate dosyalar kontrol ediliyor...')
      const duplicateResult = await window.electronAPI.removeDuplicateNinovaFiles()
      if (duplicateResult.success && duplicateResult.deletedCount && duplicateResult.deletedCount > 0) {
        console.log(`🧹 ${duplicateResult.deletedCount} duplicate dosya temizlendi`)
      }
      
      // 2. Veritabanından cache'lenmiş verileri yükle (hızlı başlangıç)
      setInitProgress(5, 'Önbellekten veriler yükleniyor...')
      
      const cachedCourses = await window.electronAPI.dbGetCourses()
      const cachedNinovaFiles = await window.electronAPI.dbGetNinovaFiles()
      
      let shouldSyncFromNinova = false
      
      if (cachedCourses.length > 0 && cachedNinovaFiles.length > 0) {
        console.log(`📦 ${cachedCourses.length} ders ve ${cachedNinovaFiles.length} dosya cache'den yüklendi`)
        
        // Cache'den gelen dersleri Course formatına çevir
        const coursesFromCache = cachedCourses.map((c: any) => ({
          id: c.course_id,
          code: c.code,
          name: c.name,
          term: c.term
        }))
        set({ courses: coursesFromCache })
        
        // Ninova dosyalarını cache'e koy
        const filesByCourse = new Map<string, any[]>()
        cachedNinovaFiles.forEach((f: any) => {
          if (!filesByCourse.has(f.course_id)) {
            filesByCourse.set(f.course_id, [])
          }
          filesByCourse.get(f.course_id)?.push({
            id: f.file_id,
            courseId: f.course_id,
            courseName: f.course_name,
            name: f.file_name,
            url: f.file_url,
            size: f.file_size,
            uploadDate: f.upload_date,
            isDownloaded: false, // Henüz eşleştirme yapılmadı
            isFolder: f.is_folder,
            path: f.path,
            hash: f.file_hash
          })
        })
        
        filesByCourse.forEach((files, courseId) => {
          courseFilesCache.set(courseId, files)
          
          // *** YENİ: Stats cache'ini de doldur ***
          const sinifFiles = files.filter((f: any) => !f.isFolder && f.courseName === 'Sınıf Dosyaları')
          const dersFiles = files.filter((f: any) => !f.isFolder && f.courseName === 'Ders Dosyaları')
          
          const stats = {
            sinif: {
              folders: files.filter((f: any) => f.isFolder && f.courseName === 'Sınıf Dosyaları').length,
              totalFiles: sinifFiles.length
            },
            ders: {
              folders: files.filter((f: any) => f.isFolder && f.courseName === 'Ders Dosyaları').length,
              totalFiles: dersFiles.length
            }
          }
          
          courseStatsCache.set(courseId, stats)
          
          // Debug: İlk ders için istatistikleri göster
          if (courseStatsCache.size === 1) {
            console.log(`📊 Stats cache örneği (${courseId}):`, stats)
            console.log(`   Toplam dosya: ${files.length}`)
            console.log(`   İlk 3 dosya:`, files.slice(0, 3).map((f: any) => ({ name: f.name, courseName: f.courseName, isFolder: f.isFolder })))
          }
        })
        
        console.log(`✅ Stats cache dolduruldu: ${courseStatsCache.size} ders`)
        
        // Son senkronizasyon zamanını kontrol et (24 saatten eskiyse yenile)
        const lastSynced = cachedCourses[0]?.last_synced
        if (lastSynced) {
          const lastSyncTime = new Date(lastSynced).getTime()
          const now = Date.now()
          const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60)
          
          if (hoursSinceSync > 24) {
            console.log(`⏰ Son senkronizasyon ${hoursSinceSync.toFixed(1)} saat önce, yenileme gerekli`)
            shouldSyncFromNinova = true
          } else {
            console.log(`✅ Cache güncel (${hoursSinceSync.toFixed(1)} saat önce güncellendi)`)
          }
        }
      } else {
        console.log('⚠️ Cache boş, Ninova\'dan yükleme yapılacak')
        shouldSyncFromNinova = true
      }
      
      // 2. Sadece gerekirse Ninova'dan güncel verileri çek
      let courses = get().courses
      
      if (shouldSyncFromNinova) {
        setInitProgress(10, 'Ninova\'dan güncel veriler çekiliyor...')
        courses = await window.electronAPI.ninovaGetCourses()
        set({ courses })
      
        if (courses.length === 0) {
          set({ isInitialized: true, initProgress: 100 })
          return
        }
        
        // Dersleri veritabanına kaydet
        const currentTime = new Date().toISOString()
        for (const course of courses) {
          await window.electronAPI.dbSaveCourse({
            course_id: course.id,
            code: course.code,
            name: course.name,
            term: course.term,
            last_synced: currentTime
          })
        }
        
        setInitProgress(20, `${courses.length} ders bulundu, tam tree yapısı taranıyor...`)
      
      // 🌳 FULL TREE TRAVERSAL - Backend tüm klasör yapısını recursive olarak tarayacak
      // Her klasörün içine girecek, parent-child ilişkisini koruyacak
      
      // 3. Derslerin dosyalarını PROGRESİF yükle (3'lü gruplar halinde - tree traversal yavaş olabilir)
      const totalCourses = courses.length
      let completedCourses = 0
      const BATCH_SIZE = 3 // Her seferde 3 ders paralel yükle (tree traversal ağır işlem)
      
      for (let i = 0; i < courses.length; i += BATCH_SIZE) {
        const batch = courses.slice(i, i + BATCH_SIZE)
        
        await Promise.all(
          batch.map(async (course) => {
            try {
              // 🌳 FULL TREE - Backend tüm klasör yapısını recursive tarıyor
              setInitProgress(
                20 + (completedCourses / totalCourses) * 20, 
                `${course.code} - Tree taranıyor...`
              )
              const items = await window.electronAPI.ninovaGetFiles(course.id)
              
              const fileCount = items.filter((f: any) => !f.isFolder).length
              const folderCount = items.filter((f: any) => f.isFolder).length
              console.log(`✅ ${course.code}: ${fileCount} dosya + ${folderCount} klasör = ${items.length} TOPLAM öğe`)
              
              // 🌳 TÜM ÖĞELERİ veritabanına kaydet (full tree traversal)
              const filesToSave = items.map((file: any) => {
                return {
                  file_id: file.id,
                  course_id: file.courseId, // Backend'den gelen URL-based courseId
                  course_name: file.courseName,
                  file_name: file.name,
                  file_url: file.url,
                  file_size: file.size,
                  upload_date: file.uploadDate,
                  file_hash: file.hash || undefined,
                  last_synced: currentTime,
                  is_folder: file.isFolder || false, // ✅ Klasör bayrağını koru
                  path: file.path
                }
              })
              
              if (filesToSave.length > 0) {
                console.log(`💾 ${course.code} için ${filesToSave.length} öğe veritabanına kaydediliyor...`)
                
                // 🔍 Doğrulama: İlk 5 öğenin courseId'sini kontrol et
                console.log(`🔍 [Paralel Doğrulama] ${course.code} - İlk 5 öğe courseId kontrolü:`)
                filesToSave.slice(0, 5).forEach(f => {
                  const courses = get().courses
                  const matchedCourse = courses.find(c => c.id === f.course_id)
                  console.log(`  - ${f.file_name}`)
                  console.log(`    ✓ course_id: ${f.course_id}`)
                  console.log(`    ✓ course_name: ${f.course_name}`)
                  console.log(`    ✓ path: ${f.path}`)
                  if (matchedCourse) {
                    console.log(`    ✅ Ders Eşleşti: ${matchedCourse.code} - ${matchedCourse.name}`)
                  } else {
                    console.error(`    ❌ HATA: Ders bulunamadı! courseId mismatch!`)
                  }
                })
                
                await window.electronAPI.dbBulkSaveNinovaFiles(filesToSave)
              }
              
              // Cache'e ana seviye öğeleri kaydet (UI için)
              courseFilesCache.set(course.id, items)
              
              // İstatistikler - ana seviye dosya ve klasörleri say
              const sinifFiles = items.filter((f: any) => !f.isFolder && f.courseName === 'Sınıf Dosyaları')
              const dersFiles = items.filter((f: any) => !f.isFolder && f.courseName === 'Ders Dosyaları')
              
              courseStatsCache.set(course.id, {
                sinif: {
                  folders: items.filter((f: any) => f.isFolder && f.courseName === 'Sınıf Dosyaları').length,
                  totalFiles: sinifFiles.length
                },
                ders: {
                  folders: items.filter((f: any) => f.isFolder && f.courseName === 'Ders Dosyaları').length,
                  totalFiles: dersFiles.length
                }
              })
              
              completedCourses++
              const progress = 20 + (completedCourses / totalCourses) * 20
              setInitProgress(
                progress, 
                `${course.code} güncellendi (${completedCourses}/${totalCourses})`
              )
            } catch (error) {
              console.error(`❌ ${course.code} yüklenemedi:`, error)
              completedCourses++
              const progress = 20 + (completedCourses / totalCourses) * 20
              setInitProgress(progress, `Hata: ${course.code} (${completedCourses}/${totalCourses})`)
            }
          })
        )
        }
      } // shouldSyncFromNinova if bloğu sonu
      
      // 4. VERİTABANINDAN İNDİRİLMİŞ DOSYALARI AL
      setInitProgress(45, 'Veritabanı kontrol ediliyor...')
      const downloadedFiles = await window.electronAPI.dbGetDownloadedFiles()
      const downloadedFileIds = new Set(downloadedFiles.map((f: any) => f.file_id))
      
      console.log(`📥 Veritabanında ${downloadedFileIds.size} indirilmiş dosya bulundu`)
      
      // 5. CACHE'İ GÜNCELLE (Sadece veritabanında olanlar "indirildi" olarak işaretlenecek)
      setInitProgress(65, 'Cache güncelleniyor...')
      courseFilesCache.forEach((files, courseId) => {
        const updatedFiles = files.map(f => {
          // KLASÖR DURUMU: İçindeki tüm dosyalar indirilmişse klasör de indirilmiş sayılır
          if (f.isFolder) {
            // Klasör path'ini normalize et
            const folderPath = (f.path || f.name).replace(/\/+$/, '') // Son slash'i kaldır
            
            // Bu klasörün içindeki tüm dosyaları bul
            const folderFiles = files.filter(file => {
              if (file.isFolder) return false // Sadece dosyalar
              
              const filePath = file.path || file.name
              
              // Path kontrolü: Dosya path'i klasör path'i ile başlamalı
              return filePath && (
                filePath.startsWith(folderPath + '/') || // Klasör/dosya.pdf
                filePath === folderPath || // Direkt eşleşme
                (f.name && filePath.includes(f.name + '/')) // Klasör adı path içinde
              )
            })
            
            if (folderFiles.length === 0) {
              // Klasör boş, indirilmemiş sayılır
              return { ...f, isDownloaded: false }
            }
            
            // Tüm dosyalar indirilmişse klasör de indirilmiş
            const allFilesDownloaded = folderFiles.every(file => downloadedFileIds.has(file.id))
            return { ...f, isDownloaded: allFilesDownloaded }
          }
          
          // DOSYA DURUMU: Sadece veritabanında varsa indirilmiş
          const isDownloaded = downloadedFileIds.has(f.id)
          const localPath = isDownloaded 
            ? downloadedFiles.find((d: any) => d.file_id === f.id)?.local_path
            : undefined
          
          return {
            ...f,
            isDownloaded,
            localPath
          }
        })
        courseFilesCache.set(courseId, updatedFiles)
      })
      
      console.log('✅ Cache güncellendi (sadece veritabanındaki dosyalar "indirildi" olarak işaretlendi)')
      
      // 7. ❌ OTOMATİK YENİ DOSYA TESPİTİ KALDIRILDI
      // Kullanıcı manuel olarak dosyaların indirilip indirilmediğini kontrol edecek
      console.log(`✅ İndirme durumu hazır - toplam ${downloadedFileIds.size} dosya veritabanında`)
      
      // 8. TÜM DUYURULARI ÇEK VE CACHE'LE 📢
      setInitProgress(95, 'Duyurular yükleniyor...')
      try {
        console.log('📢 Tüm duyurular çekiliyor...')
        const announcements = await window.electronAPI.ninovaGetKampusAnnouncements()
        set({ announcements })
        console.log(`✅ ${announcements.length} duyuru cache'lendi`)
      } catch (error) {
        console.error('❌ Duyuru çekme hatası:', error)
        // Hata olsa bile devam et
        set({ announcements: [] })
      }
      
      // 9. Tamamlandı
      setInitProgress(100, 'Tüm veriler hazır!')
      await new Promise(resolve => setTimeout(resolve, 300))
      set({ isInitialized: true })
      console.log(`🎉 Uygulama başarıyla başlatıldı!`)
      
    } catch (error) {
      console.error('Initialization error:', error)
      set({ 
        error: 'Uygulama başlatılırken bir hata oluştu',
        isInitialized: true // Hata olsa bile devam et
      })
    }
  },

  refreshCourses: async () => {
    set({ isLoading: true, error: null })
    try {
      const courses = await window.electronAPI.ninovaGetCourses()
      set({ courses, isLoading: false })
      
      // Yeni dersler varsa onları da cache'le
      if (courses.length > 0) {
        console.log('📦 Yeni dersler cache\'leniyor...')
        Promise.all(
          courses.map(async (course) => {
            try {
              if (!courseFilesCache.has(course.id)) {
                const files = await window.electronAPI.ninovaGetFiles(course.id)
                courseFilesCache.set(course.id, files)
              }
              
              if (!courseStatsCache.has(course.id)) {
                const [sinifStats, dersStats] = await Promise.all([
                  window.electronAPI.ninovaGetRecursiveStats(course.id, 'sinif'),
                  window.electronAPI.ninovaGetRecursiveStats(course.id, 'ders')
                ])
                courseStatsCache.set(course.id, {
                  sinif: sinifStats,
                  ders: dersStats
                })
              }
              console.log(`✅ ${course.code} cache'lendi`)
            } catch (error) {
              console.error(`Cache hatası (${course.code}):`, error)
            }
          })
        )
      }
      
      // 📢 DUYURULARI DA YENİLE
      try {
        console.log('📢 Duyurular yenileniyor...')
        const announcements = await window.electronAPI.ninovaGetKampusAnnouncements()
        set({ announcements })
        console.log(`✅ ${announcements.length} duyuru yenilendi`)
      } catch (error) {
        console.error('❌ Duyuru yenileme hatası:', error)
      }
    } catch (error) {
      set({ 
        error: 'Dersler yüklenirken bir hata oluştu', 
        isLoading: false 
      })
      console.error('Error fetching courses:', error)
    }
  },

  refreshFiles: async (courseId: string, category?: 'sinif' | 'ders') => {
    set({ isLoading: true, error: null })
    try {
      // Önce cache'den kontrol et
      let allFiles = courseFilesCache.get(courseId)
      
      // Cache'de yoksa çek
      if (!allFiles) {
        allFiles = await window.electronAPI.ninovaGetFiles(courseId)
        courseFilesCache.set(courseId, allFiles)
      }
      
      // Eğer dosya yoksa veya hata varsa
      if (!allFiles || allFiles.length === 0) {
        console.log('Dosya bulunamadı veya yüklenemedi')
      }
      
      // Kategori filtresi uygula
      const filteredFiles = category 
        ? allFiles.filter((f: CourseFile) => {
            const catName = category === 'sinif' ? 'Sınıf Dosyaları' : 'Ders Dosyaları'
            return f.courseName === catName
          })
        : allFiles
      
      // *** İYİLEŞTİRME: Toplu veritabanı kontrolü (her dosya için tek tek değil) ***
      console.log(`🔍 ${filteredFiles.length} öğenin durumu kontrol ediliyor...`)
      
      // Tüm indirilmiş dosyaları tek seferde al
      const downloadedFiles = await window.electronAPI.dbGetDownloadedFiles()
      const downloadedFileIds = new Set(downloadedFiles.map((f: any) => f.file_id))
      const downloadedFileUrls = new Set(downloadedFiles.map((f: any) => f.file_url))
      const downloadedFileLocalPathByUrl = new Map<string, string>(
        downloadedFiles
          .filter((f: any) => typeof f.file_url === 'string' && typeof f.local_path === 'string')
          .map((f: any) => [f.file_url, f.local_path])
      )
      const isDownloadedFile = (file: CourseFile) => {
        if (!file) return false
        return downloadedFileIds.has(file.id) || downloadedFileUrls.has(file.url)
      }
      
      console.log(`📥 Veritabanında ${downloadedFileIds.size} indirilmiş dosya bulundu`)
      
      // Dosya ve klasör durumlarını güncelle
      const filesWithStatus = filteredFiles.map((file: CourseFile) => {
        // KLASÖR DURUMU: İçindeki tüm dosyalar indirilmişse klasör de indirilmiş
        if (file.isFolder) {
          // Klasör path'ini normalize et
          const folderPath = (file.path || file.name).replace(/\/+$/, '') // Son slash'i kaldır
          
          // Bu klasörün içindeki dosyaları bul (TÜM dosyalar içinde ara)
          const folderFiles = (allFiles || []).filter((f: CourseFile) => {
            if (f.isFolder) return false // Sadece dosyalar
            
            const filePath = f.path || f.name
            
            // Path kontrolü: Dosya path'i klasör path'i ile başlamalı VE farklı olmalı
            return filePath && (
              filePath.startsWith(folderPath + '/') || // Klasör/dosya.pdf
              filePath === folderPath || // Direkt eşleşme
              (file.name && filePath.includes(file.name + '/')) // Klasör adı path içinde
            )
          })
          
          console.log(`📁 ${file.name}: ${folderFiles.length} dosya bulundu`)
          
          if (folderFiles.length === 0) {
            // Klasör boş, indirilmemiş sayılır
            return { ...file, isDownloaded: false }
          }
          
          // Tüm dosyalar indirilmişse klasör de indirilmiş
          const downloadedCount = folderFiles.filter((f: CourseFile) => isDownloadedFile(f)).length
          const allFilesDownloaded = downloadedCount === folderFiles.length
          
          console.log(`📁 ${file.name}: ${downloadedCount}/${folderFiles.length} dosya indirildi - ${allFilesDownloaded ? 'TAMAMLANDI' : 'EKSIK'}`)
          
          return { ...file, isDownloaded: allFilesDownloaded }
        }
        
        // DOSYA DURUMU: Sadece veritabanında varsa indirilmiş
        const isDownloaded = isDownloadedFile(file)
        const localPath = isDownloaded 
          ? (downloadedFiles.find((d: any) => d.file_id === file.id)?.local_path
            || downloadedFileLocalPathByUrl.get(file.url))
          : undefined
        
        return {
          ...file,
          isDownloaded,
          localPath
        }
      })
      
      console.log(`✅ ${filesWithStatus.filter(f => f.isDownloaded).length}/${filesWithStatus.length} öğe indirilmiş (dosya + klasör)`)
      
      // Cache'i de güncelle
      const updatedAllFiles = allFiles.map(file => {
        const updated = filesWithStatus.find(f => f.id === file.id)
        return updated || file
      })
      courseFilesCache.set(courseId, updatedAllFiles)
      
      set({ files: filesWithStatus, isLoading: false })
    } catch (error) {
      console.error('Error fetching files:', error)
      
      // Eğer login hatası ise, sadece log yap - DashboardPage zaten yönlendirecek
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      if (errorMessage.includes('giriş yapmalısınız') || errorMessage.includes('login')) {
        console.log('Session süresi dolmuş, giriş gerekiyor')
      }
      
      set({ 
        error: 'Dosyalar yüklenirken bir hata oluştu', 
        isLoading: false 
      })
    }
  },
  
  // Cache'den istatistikleri al
  getCachedStats: (courseId: string) => {
    return courseStatsCache.get(courseId) || null
  },
    }),
    {
      name: 'app-storage', // localStorage key adı
      version: 10, // 🔧 V10: Full tree traversal + manual download check
      migrate: (persistedState: any, version: number) => {
        // Eski versiyonlardan yeni versiyona geçiş
        if (version < 10) {
          // Eski state'i temizle ve yeni yapıya dönüştür
          return {
            courses: persistedState?.courses || [],
          }
        }
        return persistedState
      },
      partialize: (state) => ({
        // ✅ isInitialized'ı persist etme - her başlatmada yeniden yükle
        courses: state.courses,
        // scanNotification kaldırıldı - artık otomatik tespit yok
      }), // Sadece kritik alanları persist et (files çok büyük olabilir)
    }
  )
)

// Export cache'leri da kullanılabilmesi için
export { courseFilesCache, courseStatsCache }




