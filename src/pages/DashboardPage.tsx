import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAppStore, courseStatsCache } from '../store/appStore'
import { CourseCard } from '../components/CourseCard'
import { FileRow } from '../components/FileRow'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Button } from '../components/Button'
import { DownloadModal } from '../components/DownloadModal'
import { BulkDownloadModal } from '../components/BulkDownloadModal'
import { AnnouncementsModal } from '../components/AnnouncementsModal'
import { useToast } from '../components/Toast'
import { CourseFile } from '../types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  const {
    courses,
    files,
    selectedCourse,
    isLoading,
    error,
    announcements,
    setSelectedCourse,
    setLoading,
    fetchAllAnnouncements,
    fetchAnnouncements,
    refreshCourses,
    refreshFiles,
  } = useAppStore()

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [currentFolder, setCurrentFolder] = useState<CourseFile | null>(null)
  const [folderHistory, setFolderHistory] = useState<CourseFile[]>([])
  const [selectedCategory, setSelectedCategory] = useState<'sinif' | 'ders' | null>(null)
  const [categoryStats, setCategoryStats] = useState<{
    sinif: {total: number, folders: number, files: number},
    ders: {total: number, folders: number, files: number}
  } | null>(null)
  // Modal states
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [selectedFilesDownloadModalOpen, setSelectedFilesDownloadModalOpen] = useState(false)
  const [missingFilesDownloadModalOpen, setMissingFilesDownloadModalOpen] = useState(false)
  const [missingFilesForDownload, setMissingFilesForDownload] = useState<CourseFile[]>([])
  const [selectedFilesForDownload, setSelectedFilesForDownload] = useState<CourseFile[]>([])
  const [fileToDownload, setFileToDownload] = useState<CourseFile | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false)
  
  const { showToast, ToastContainer } = useToast()

  // Not: İlk yükleme artık App.tsx'de yapılıyor
  // useEffect(() => {
  //   refreshCourses()
  // }, [refreshCourses])

  const loadCategoryStats = async () => {
    if (!selectedCourse) return
    
    // Cache'den kontrol et - ilk açılışta tüm veriler cache'de olmalı
    const cachedStats = courseStatsCache.get(selectedCourse.id)
    
    if (cachedStats) {
      setCategoryStats({
        sinif: {
          total: cachedStats.sinif.folders + cachedStats.sinif.totalFiles,
          folders: cachedStats.sinif.folders,
          files: cachedStats.sinif.totalFiles
        },
        ders: {
          total: cachedStats.ders.folders + cachedStats.ders.totalFiles,
          folders: cachedStats.ders.folders,
          files: cachedStats.ders.totalFiles
        }
      })
    } else {
      // Cache'de yoksa sıfır göster
      console.warn(`⚠️ ${selectedCourse.code} cache'de yok`)
      setCategoryStats({
        sinif: { total: 0, folders: 0, files: 0 },
        ders: { total: 0, folders: 0, files: 0 }
      })
    }
  }

  // Ders seçildiğinde kategori istatistiklerini çek
  useEffect(() => {
    if (selectedCourse) {
      setSelectedFiles(new Set())
      setCurrentFolder(null)
      setFolderHistory([])
      setSelectedCategory(null)
      
      // İstatistikleri çek
      loadCategoryStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse])

  const handleCategorySelect = async (category: 'sinif' | 'ders') => {
    setSelectedCategory(category)
    if (selectedCourse) {
      await refreshFiles(selectedCourse.id, category)
      // Not: Otomatik klasör taraması artık Ayarlar > FolderManager'da yapılıyor
    }
  }

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    setSelectedCourse(course || null)
  }

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const handleDownloadFile = async (file: CourseFile) => {
    // Modal'ı aç
    setFileToDownload(file)
    setDownloadModalOpen(true)
  }

  const handleActualDownload = async (file: CourseFile, downloadPath: string) => {
    try {
      console.log('🎬 [Dashboard] İndirme başlatılıyor')
      console.log('   Dosya:', file.name)
      console.log('   Dosya URL:', file.url)
      console.log('   İndirme yolu:', downloadPath)
      console.log('   Ders adı:', selectedCourse?.name || file.courseName)
      
      const savePath = generateSavePathWithBase(file, downloadPath)
      console.log('   Tam kayıt yolu:', savePath)
      
      await window.electronAPI.ninovaDownloadFile(file.url, savePath)
      
      console.log('✅ [Dashboard] İndirme tamamlandı')
      
      // Database'e kaydet
      console.log('💾 [Dashboard] dbAddDownloadedFile çağrılıyor...')
      console.log('   file_id:', file.id)
      console.log('   file_name:', file.name)
      console.log('   file_size:', file.size, 'type:', typeof file.size)
      console.log('   upload_date:', file.uploadDate, 'type:', typeof file.uploadDate)
      
      // *** DÜZELTME: Frontend'de veriyi TİP GÜVENLİ hale getir ***
      const sanitizedFileSize = Math.floor(file.size && typeof file.size === 'number' ? file.size : 0)
      const sanitizedUploadDate = String(file.uploadDate || new Date().toISOString())
      
      console.log('   Sanitized file_size:', sanitizedFileSize, 'type:', typeof sanitizedFileSize)
      console.log('   Sanitized upload_date:', sanitizedUploadDate, 'type:', typeof sanitizedUploadDate)
      
      const downloadData = {
        file_id: String(file.id),
        course_id: String(file.courseId),
        course_name: String(file.courseName),
        file_name: String(file.name),
        file_url: String(file.url),
        local_path: String(savePath),
        file_size: sanitizedFileSize,  // INTEGER
        upload_date: sanitizedUploadDate,  // TEXT
        download_date: new Date().toISOString(),  // TEXT
      }
      
      console.log('📤 [Dashboard] Gönderilen veri:')
      console.log(`   file_id (type: ${typeof downloadData.file_id}):`, downloadData.file_id)
      console.log(`   course_id (type: ${typeof downloadData.course_id}):`, downloadData.course_id)
      console.log(`   file_size (type: ${typeof downloadData.file_size}):`, downloadData.file_size)
      console.log(`   upload_date (type: ${typeof downloadData.upload_date}):`, downloadData.upload_date)
      console.log(`   download_date (type: ${typeof downloadData.download_date}):`, downloadData.download_date)
      
      await window.electronAPI.dbAddDownloadedFile(downloadData)

      console.log('📦 [Dashboard] Veritabanına kaydedildi')
      
      // DOĞRULAMA: Gerçekten kaydedildi mi kontrol et
      const isNowInDb = await window.electronAPI.dbCheckFileExists(file.id)
      console.log(`🔍 [Dashboard] Kayıt sonrası kontrol: ${isNowInDb ? 'BULUNDU ✅' : 'BULUNAMADI ❌'}`)
      
      // *** DÜZELTME: Cache'i güncelle - dosyayı indirildi olarak işaretle ***
      const { courseFilesCache } = await import('../store/appStore')
      const cachedFiles = courseFilesCache.get(file.courseId)
      if (cachedFiles) {
        const updatedCache = cachedFiles.map(f => 
          f.id === file.id ? { ...f, isDownloaded: true, localPath: savePath } : f
        )
        courseFilesCache.set(file.courseId, updatedCache)
        console.log('✅ [Dashboard] Cache güncellendi')
      }
      
      // Dosya listesini yenile (şimdi güncel durumu gösterecek)
      if (currentFolder) {
        // Eğer klasör içindeyse, klasörü yeniden yükle
        console.log('📂 Klasör içinde, görünüm yenileniyor...')
        await handleFolderClick(currentFolder)
      } else if (selectedCourse && selectedCategory) {
        // Ana görünümdeyse, dosya listesini yenile
        await refreshFiles(selectedCourse.id, selectedCategory)
      }
      
      console.log('🎉 [Dashboard] Tüm işlemler tamamlandı')
    } catch (error) {
      console.error('❌ [Dashboard] İndirme hatası:', error)
      throw error
    }
  }

  const handleSelectedFilesDownload = async () => {
    if (selectedFiles.size === 0) {
      showToast('Lütfen indirmek için dosya seçin', 'warning')
      return
    }
    
    // Seçili dosyaları al
    const selectedFilesArray = files.filter(f => selectedFiles.has(f.id))
    
    // Klasörleri kontrol et ve içeriğini al
    const allFilesToDownload: CourseFile[] = []
    
    for (const file of selectedFilesArray) {
      if (file.isFolder) {
        // Klasörün içindeki tüm dosyaları recursive olarak al
        try {
          const folderFiles = await getAllFilesFromFolder(file)
          allFilesToDownload.push(...folderFiles)
        } catch (error) {
          console.error(`Klasör içeriği alınamadı (${file.name}):`, error)
          showToast(`${file.name} klasörü yüklenemedi`, 'error')
        }
      } else if (!file.isDownloaded) {
        // Normal dosya
        allFilesToDownload.push(file)
      }
    }
    
    if (allFilesToDownload.length === 0) {
      showToast('İndirilecek dosya bulunamadı', 'warning')
      return
    }
    
    // Listeyi state'e kaydet
    setSelectedFilesForDownload(allFilesToDownload)
    
    // Modal'ı aç
    setSelectedFilesDownloadModalOpen(true)
  }
  
  // Klasörden tüm dosyaları recursive olarak al
  const getAllFilesFromFolder = async (folder: CourseFile): Promise<CourseFile[]> => {
    const allFiles: CourseFile[] = []
    
    try {
      const folderContents = await window.electronAPI.ninovaGetFolderContents(
        folder.url,
        folder.courseId,
        folder.courseName,
        folder.path || folder.name
      )
      
      for (const item of folderContents) {
        if (item.isFolder) {
          // Alt klasörü recursive olarak işle
          const subFiles = await getAllFilesFromFolder(item)
          allFiles.push(...subFiles)
        } else {
          // Dosyayı ekle
          allFiles.push(item)
        }
      }
    } catch (error) {
      console.error(`Klasör içeriği alınamadı (${folder.name}):`, error)
    }
    
    return allFiles
  }

  const handleConfirmSelectedDownload = async () => {
    // Bu fonksiyon artık kullanılmıyor çünkü BulkDownloadModal 
    // onSingleDownload kullanıyor ama backward compatibility için bırakıyoruz
    setSelectedFiles(new Set())
    
    // Dosya listesini yenile
    if (selectedCourse && selectedCategory) {
      await refreshFiles(selectedCourse.id, selectedCategory)
    }
  }


  const sanitizeFileName = (name: string): string => {
    // Dosya adındaki geçersiz karakterleri temizle
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_')
  }

  const generateSavePathWithBase = (file: CourseFile, basePath: string): string => {
    const fileName = sanitizeFileName(file.name)
    
    console.log('📁 [Path Generator] Dosya indirme')
    console.log('   Base path:', basePath)
    console.log('   Dosya adı (temiz):', fileName)
    console.log('   Dosya path:', file.path)
    console.log('   Kategori:', file.courseName)
    console.log('   Ders:', selectedCourse?.code)
    
    // Klasör yapısını oluştur (yalnızca Ninova'daki ilgili klasörler kullanılacak)
    let finalPath: string
    
    if (file.path) {
      // Dosya bir klasör içinde
      // path örneği: "Sınıf Dosyaları/Ödevler/Ödev1/dosya.pdf" veya "Powerpoints/Hafta1/dosya.pdf"

      // Path'ten kategori adını temizle (eğer varsa)
      let cleanPath = file.path
      if (cleanPath.startsWith(file.courseName + '/')) {
        cleanPath = cleanPath.substring(file.courseName.length + 1)
      }

      // Klasör yapısını sanitize et
      const pathParts = cleanPath.split('/').filter(Boolean).map(part => sanitizeFileName(part))
      
      // Yapı: basePath/Powerpoints/dosya.pdf
      finalPath = pathParts.length > 0
        ? `${basePath}/${pathParts.join('/')}`
        : `${basePath}/${fileName}`
    } else {
      // Direkt dosya (klasör içinde değil)
      // Yapı: basePath/dosya.pdf
      finalPath = `${basePath}/${fileName}`
    }
    
    console.log('   Üretilen path:', finalPath)
    
    return finalPath
  }

  const handleFolderClick = async (folder: CourseFile) => {
    if (!folder.isFolder || !selectedCourse) return

    try {
      const folderContents = await window.electronAPI.ninovaGetFolderContents(
        folder.url,
        folder.courseId,
        folder.courseName,
        folder.path || folder.name
      )
      
      console.log(`📂 Klasör yüklendi: ${folder.name}, ${folderContents.length} öğe (toplam)`)
      
      // ✅ KRİTİK DÜZELTİLME: Sadece DOĞRUDAN CHILD'lari göster (nested dosyaları gösterme)
      // Örnek: "Week 1" klasöründe:
      //   ✅ "Week 1/file.pdf" → Göster (doğrudan child)
      //   ✅ "Week 1/Subfolder" → Göster (doğrudan child klasör)
      //   ❌ "Week 1/Subfolder/file.pdf" → Gösterme (nested)
      const parentPath = folder.path || folder.name
      const directChildren = folderContents.filter(file => {
        // Path kontrolü
        const filePath = file.path || file.name
        
        // Parent path ile başlamalı
        if (!filePath.startsWith(parentPath)) {
          return false
        }
        
        // Parent path'den sonraki kısmı al
        const relativePath = filePath.substring(parentPath.length)
        
        // Eğer "/" ile başlıyorsa temizle
        const cleanRelative = relativePath.startsWith('/') 
          ? relativePath.substring(1) 
          : relativePath
        
        // Sadece dosya/klasör adı kaldıysa → doğrudan child
        // Örnek: "file.pdf" ✅, "Subfolder" ✅, "Subfolder/file.pdf" ❌
        const isDirectChild = !cleanRelative.includes('/')
        
        return isDirectChild
      })
      
      console.log(`   ✅ ${directChildren.length} doğrudan child (${folderContents.length - directChildren.length} nested gizlendi)`)
      
      const newHistory = [...folderHistory, folder]
      setFolderHistory(newHistory)
      setCurrentFolder(folder)
      
      // Sadece doğrudan child'ları göster
      useAppStore.setState({ files: directChildren })
      
      // *** İYİLEŞTİRME: Toplu veritabanı kontrolü (her dosya için tek tek değil) ***
      console.log(`🔍 Klasör içeriği kontrol ediliyor...`)
      
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
      
      // Dosya ve klasör durumlarını güncelle - SADECE DOĞRUDAN CHILD'LAR İÇİN
      const filesWithStatus = directChildren.map((file: CourseFile) => {
        // KLASÖR DURUMU: İçindeki tüm dosyalar indirilmişse klasör de indirilmiş
        if (file.isFolder) {
          // Bu klasörün içindeki dosyaları bul (FULL tree'den - folderContents)
          const folderFiles = folderContents.filter(f => 
            !f.isFolder && 
            f.path && 
            f.path.startsWith(file.path || file.name)
          )
          
          if (folderFiles.length === 0) {
            return { ...file, isDownloaded: false }
          }
          
          // Tüm dosyalar indirilmişse klasör de indirilmiş
          const allFilesDownloaded = folderFiles.every(f => isDownloadedFile(f))
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
      
      console.log(`✅ ${filesWithStatus.filter(f => f.isDownloaded).length}/${filesWithStatus.length} öğe indirilmiş (gösterilen)`)
      
      useAppStore.setState({ files: filesWithStatus })
    } catch (error) {
      showToast('Klasör içeriği yüklenemedi', 'error')
      console.error('Folder load error:', error)
    }
  }

  const handleSelectAll = () => {
    const selectableFiles = files.filter(f => !f.isDownloaded)
    if (selectedFiles.size === selectableFiles.length) {
      // Tümünün seçimini kaldır
      setSelectedFiles(new Set())
    } else {
      // Tümünü seç
      setSelectedFiles(new Set(selectableFiles.map(f => f.id)))
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  const handleQuit = async () => {
    if (window.confirm('Uygulamadan çıkmak istediğinize emin misiniz?')) {
      await window.electronAPI.appQuit()
    }
  }

  const handleClearAllData = async () => {
    if (window.confirm('⚠️ TÜM VERİLERİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem:\n• Tüm ayarları\n• Kaydedilmiş klasörleri\n• İndirme geçmişini\n• Kullanıcı bilgilerini\n\nkalıcı olarak silecektir. Bu işlem geri alınamaz!')) {
      try {
        showToast('Tüm veriler siliniyor...', 'info')
        const result = await window.electronAPI.clearAllData()
        
        if (result.success) {
          showToast('Tüm veriler başarıyla silindi. Giriş sayfasına yönlendiriliyorsunuz...', 'success')
          
          // Oturumu kapat ve login'e yönlendir
          setTimeout(() => {
            logout()
            navigate('/login')
          }, 2000)
        } else {
          showToast('Veriler silinirken bir hata oluştu', 'error')
        }
      } catch (error) {
        console.error('Clear all data error:', error)
        showToast('Veriler silinirken bir hata oluştu', 'error')
      }
    }
  }

  // Not: Otomatik klasör tarama kaldırıldı. 
  // Artık Ayarlar > FolderManager'da manuel olarak yapılıyor ve bildirim sistemi ile yönetiliyor.

  const handleDownloadMissingFiles = async () => {
    // Hem dosyaları hem de klasörleri al
    const missingItems = files.filter((f) => !f.isDownloaded)
    
    if (missingItems.length === 0) {
      showToast('Tüm dosyalar zaten indirilmiş', 'info')
      return
    }
    
    // Klasörleri genişlet
    const allFilesToDownload: CourseFile[] = []
    
    for (const item of missingItems) {
      if (item.isFolder) {
        // Klasörün içindeki tüm dosyaları recursive olarak al
        try {
          const folderFiles = await getAllFilesFromFolder(item)
          allFilesToDownload.push(...folderFiles)
        } catch (error) {
          console.error(`Klasör içeriği alınamadı (${item.name}):`, error)
          showToast(`${item.name} klasörü yüklenemedi`, 'error')
        }
      } else {
        // Normal dosya
        allFilesToDownload.push(item)
      }
    }
    
    if (allFilesToDownload.length === 0) {
      showToast('İndirilecek dosya bulunamadı', 'warning')
      return
    }
    
    // Listeyi state'e kaydet
    setMissingFilesForDownload(allFilesToDownload)

    // Onay modalını aç
    setMissingFilesDownloadModalOpen(true)
  }

  const handleConfirmMissingDownload = async () => {
    // Bu fonksiyon artık kullanılmıyor çünkü BulkDownloadModal 
    // onSingleDownload kullanıyor ama backward compatibility için bırakıyoruz
    
    // Dosya listesini yenile
    if (selectedCourse && selectedCategory) {
      await refreshFiles(selectedCourse.id, selectedCategory)
    }
  }

  const notDownloadedCount = files.filter((f) => !f.isDownloaded && !f.isFolder).length
  const selectableFilesCount = files.filter((f) => !f.isDownloaded).length
  const allSelected = selectableFilesCount > 0 && selectedFiles.size === selectableFilesCount
  
  // İstatistikler
  const folderCount = files.filter(f => f.isFolder).length
  const fileCount = files.filter(f => !f.isFolder).length

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <ToastContainer />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🐝</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                BeeLocal
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hoş geldin, {user?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => refreshCourses()}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yenile
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/settings')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ayarlar
            </Button>
            
            {/* Kullanıcı Menüsü */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menü */}
              {userMenuOpen && (
                <>
                  {/* Overlay - menü dışına tıklandığında kapat */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setUserMenuOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Kullanıcı Bilgisi */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        İTÜ Öğrencisi
                      </p>
                    </div>

                    {/* Menü Öğeleri */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Oturumu Kapat
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Hesabından çıkış yap
                          </p>
                        </div>
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleClearAllData()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Tüm Verileri Sıfırla
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ayarlar ve geçmişi temizle
                          </p>
                        </div>
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleQuit()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Uygulamadan Çık
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            BeeLocal'i tamamen kapat
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Ders Listesi */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            {/* Tüm Duyurular Butonu */}
            <button
              onClick={async () => {
                setLoading(true)
                try {
                  await fetchAllAnnouncements()
                  setShowAnnouncementsModal(true)
                } catch (error) {
                  console.error('Duyurular yüklenemedi:', error)
                  showToast('Duyurular yüklenemedi', 'error')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={isLoading}
              className={`w-full mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800 transition-all duration-200 flex items-center gap-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tüm Duyurular
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isLoading ? 'Yükleniyor...' : 'Tüm derslerin duyurularını gör'}
                </p>
              </div>
              {!isLoading && (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Derslerim
              {courses.length > 0 && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({courses.length})
                </span>
              )}
            </h2>

            {isLoading && courses.length === 0 ? (
              <div className="py-12">
                <LoadingSpinner size="lg" />
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                  Dersler yükleniyor...
                </p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Ders bulunamadı
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isSelected={selectedCourse?.id === course.id}
                    onClick={() => handleCourseSelect(course.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Panel - Dosya Listesi */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {!selectedCourse ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Ders Seçin
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Dosyaları görüntülemek için sol taraftan bir ders seçin
                  </p>
                </div>
              </div>
            ) : !selectedCategory ? (
              /* Kategori Seçimi */
              <div className="flex items-center justify-center h-full">
                <div className="max-w-2xl w-full space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedCourse.code}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-1">
                      {selectedCourse.name}
                    </p>
                    <span className="inline-block px-4 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 rounded-full text-sm font-medium">
                      {selectedCourse.term}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <button
                      onClick={() => handleCategorySelect('sinif')}
                      className="group relative p-8 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 hover:shadow-xl"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                            Sınıf Dosyaları
                          </h3>
                          {categoryStats && (
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                {categoryStats.sinif.folders} klasör
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {categoryStats.sinif.files} öğe
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleCategorySelect('ders')}
                      className="group relative p-8 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 hover:shadow-xl"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                            Ders Dosyaları
                          </h3>
                          {categoryStats && (
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                {categoryStats.ders.folders} klasör
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {categoryStats.ders.files} öğe
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Duyurular Kartı */}
                    <button
                      onClick={async () => {
                        await fetchAnnouncements(selectedCourse.id)
                        setShowAnnouncementsModal(true)
                      }}
                      className="group relative p-8 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 hover:shadow-xl"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                            Duyurular
                          </h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Ders duyurularını görüntüle
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Dosya Listesi Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => {
                            setSelectedCategory(null)
                            setFolderHistory([])
                            setCurrentFolder(null)
                          }}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedCourse.code}
                        </h2>
                        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 rounded-full text-sm font-medium">
                          {selectedCourse.term}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {selectedCourse.name} - {selectedCategory === 'sinif' ? 'Sınıf Dosyaları' : 'Ders Dosyaları'}
                      </p>
                      
                      {/* İstatistikler */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          {folderCount} klasör
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {fileCount} dosya
                        </span>
                      </div>
                      
                      {/* Breadcrumb Navigation */}
                      {(currentFolder || folderHistory.length > 0) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <button
                            onClick={() => {
                              setCurrentFolder(null)
                              setFolderHistory([])
                              if (selectedCourse && selectedCategory) {
                                refreshFiles(selectedCourse.id, selectedCategory)
                              }
                            }}
                            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            Ana Dizin
                          </button>
                          {folderHistory.map((folder, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <button
                                onClick={() => {
                                  const newHistory = folderHistory.slice(0, index + 1)
                                  setFolderHistory(newHistory)
                                  setCurrentFolder(folder)
                                  handleFolderClick(folder)
                                }}
                                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              >
                                {folder.name}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {selectableFilesCount > 0 && (
                        <Button
                          variant="secondary"
                          onClick={handleSelectAll}
                        >
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleSelectAll}
                            className="w-4 h-4 mr-2"
                          />
                          {allSelected ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                        </Button>
                      )}
                      
                      {notDownloadedCount > 0 && selectedFiles.size === 0 && (
                        <>
                          <button
                            onClick={handleDownloadMissingFiles}
                            className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2.5"
                          >
                            {/* Download icon */}
                            <svg 
                              className="w-5 h-5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            
                            {/* Text */}
                            <span>
                              <span className="font-bold">{notDownloadedCount}</span>
                              <span className="ml-1.5">Eksik Dosya İndir</span>
                            </span>
                            
                            {/* Arrow icon */}
                            <svg 
                              className="w-4 h-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                        </>
                      )}
                      
                      {selectedFiles.size > 0 && (
                        <Button
                          variant="primary"
                          onClick={handleSelectedFilesDownload}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {selectedFiles.size} Öğe İndir
                        </Button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-300">{error}</p>
                    </div>
                  )}
                </div>

                {/* Dosya Listesi */}
                {isLoading ? (
                  <div className="py-12">
                    <LoadingSpinner size="lg" />
                    <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                      Dosyalar yükleniyor...
                    </p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      Bu derste dosya bulunamadı
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      // ✅ KRİTİK: Sadece gösterilmesi gereken dosyaları filtrele
                      let displayedFiles = files
                      
                      // Eğer klasör içindeyse, zaten handleFolderClick filtrelemişti
                      // Ama root level'daysa (currentFolder null), sadece root level dosyaları göster
                      if (!currentFolder && selectedCategory) {
                        // Root level filtreleme - Sadece direkt child'lar
                        const categoryName = selectedCategory === 'sinif' ? 'Sınıf Dosyaları' : 'Ders Dosyaları'
                        
                        displayedFiles = files.filter(file => {
                          const filePath = file.path || file.name
                          
                          // Path'i normalize et - kategori adını kaldır
                          let normalizedPath = filePath
                          if (normalizedPath.startsWith(categoryName + '/')) {
                            normalizedPath = normalizedPath.substring(categoryName.length + 1)
                          }
                          
                          // Root level kontrolü: Path'te "/" yoksa veya sadece dosya adıysa
                          const isRootLevel = !normalizedPath.includes('/') || normalizedPath === file.name
                          
                          return isRootLevel
                        })
                        
                        console.log(`📋 Root level: ${files.length} toplam → ${displayedFiles.length} gösteriliyor`)
                      }
                      
                      return displayedFiles.map((file) => (
                        <FileRow
                          key={file.id}
                          file={file}
                          isSelected={selectedFiles.has(file.id)}
                          onToggleSelect={() => handleFileToggle(file.id)}
                          onDownload={() => handleDownloadFile(file)}
                          onFolderClick={() => handleFolderClick(file)}
                        />
                      ))
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Download Modal */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => {
          setDownloadModalOpen(false)
          setFileToDownload(null)
        }}
        file={fileToDownload}
        onDownload={handleActualDownload}
      />

      {/* Selected Files Download Modal */}
      <BulkDownloadModal
        isOpen={selectedFilesDownloadModalOpen}
        onClose={async () => {
          setSelectedFilesDownloadModalOpen(false)
          setSelectedFiles(new Set())
          setSelectedFilesForDownload([])
          
          // ✅ İndirme tamamlandı, dosya listesini yenile
          if (currentFolder) {
            // Klasör içindeyse klasörü yenile
            await handleFolderClick(currentFolder)
          } else if (selectedCourse && selectedCategory) {
            // Ana görünümdeyse listeyi yenile
            await refreshFiles(selectedCourse.id, selectedCategory)
          }
        }}
        files={selectedFilesForDownload}
        onDownload={handleConfirmSelectedDownload}
        onSingleDownload={handleActualDownload}
      />
      
      {/* Missing Files Download Modal */}
      <BulkDownloadModal
        isOpen={missingFilesDownloadModalOpen}
        onClose={async () => {
          setMissingFilesDownloadModalOpen(false)
          setMissingFilesForDownload([])
          
          // ✅ İndirme tamamlandı, dosya listesini yenile
          if (currentFolder) {
            // Klasör içindeyse klasörü yenile
            await handleFolderClick(currentFolder)
          } else if (selectedCourse && selectedCategory) {
            // Ana görünümdeyse listeyi yenile
            await refreshFiles(selectedCourse.id, selectedCategory)
          }
        }}
        files={missingFilesForDownload}
        onDownload={handleConfirmMissingDownload}
        onSingleDownload={handleActualDownload}
      />
      
      {/* Announcements Modal */}
      <AnnouncementsModal
        isOpen={showAnnouncementsModal}
        onClose={() => setShowAnnouncementsModal(false)}
        announcements={announcements}
        courseName={selectedCourse?.code}
      />
    </div>
  )
}




