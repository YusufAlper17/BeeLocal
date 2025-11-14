import { useState, useEffect } from 'react'
import { CourseFile } from '../types'
import { Button } from './Button'
import { FolderManager } from './FolderManager'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  file: CourseFile | null
  onDownload: (file: CourseFile, downloadPath: string) => Promise<void>
}

type DownloadStatus = 'pending' | 'downloading' | 'success' | 'failed'

export function DownloadModal({ isOpen, onClose, file, onDownload }: DownloadModalProps) {
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('pending')
  const [_progress, setProgress] = useState(0)
  const [_downloaded, setDownloaded] = useState(0)
  const [_total, setTotal] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setSelectedPath('')
      setIsDownloading(false)
      setDownloadStatus('pending')
      setProgress(0)
      setDownloaded(0)
      setTotal(0)
    }
  }, [isOpen])

  useEffect(() => {
    // Progress listener
    const progressHandler = (progressData: any) => {
      if (file && progressData.fileId === file.id) {
        setProgress(progressData.progress)
        setDownloaded(progressData.downloaded)
        setTotal(progressData.total)
      }
    }

    // Complete listener
    const completeHandler = (result: any) => {
      if (result.success && file) {
        setIsDownloading(false)
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    }

    window.electronAPI.onDownloadProgress(progressHandler)
    window.electronAPI.onDownloadComplete(completeHandler)

    return () => {
      // Cleanup if needed
    }
  }, [file, onClose])

  const handleDownload = async () => {
    if (!file || !selectedPath) {
      console.log('⚠️ [DownloadModal] Dosya veya path eksik')
      console.log('   File:', file?.name)
      console.log('   Selected Path:', selectedPath)
      return
    }
    
    console.log('🚀 [DownloadModal] İndirme başlatılıyor')
    console.log('   Dosya:', file.name)
    console.log('   Seçilen klasör:', selectedPath)
    
    setIsDownloading(true)
    setDownloadStatus('downloading')
    setProgress(0)
    setTotal(file.size)
    
    try {
      await onDownload(file, selectedPath)
      console.log('✅ [DownloadModal] onDownload tamamlandı')
      
      // Klasörü kayıtlı yerlere ekle
      await window.electronAPI.addSavedPath(selectedPath)
      
      // Durumu başarılı yap
      setDownloadStatus('success')
      setProgress(100)
      
      // YENİ: İndirme sonrası otomatik yeniden tarama ve bildirim güncelleme
      console.log('🔄 İndirme tamamlandı - bildirim güncelleniyor...')
      
      try {
        // Yeniden tarama yap
        console.log('✅ İndirme tamamlandı')
      } catch (error) {
        console.error('İndirme tamamlama hatası:', error)
      }
      
      // İndirme tamamlandı - Başarı mesajını göstermek için 3 saniye bekle
      setTimeout(() => {
        setIsDownloading(false)
        onClose()
      }, 3000)
    } catch (error) {
      setDownloadStatus('failed')
      setIsDownloading(false)
      console.error('❌ [DownloadModal] İndirme hatası:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isOpen || !file) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Dosya İndir
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                1 dosya indirilecek
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDownloading && downloadStatus !== 'success'}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 mb-1">Toplam Dosya</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">1</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Toplam Boyut</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          {/* Folder Manager */}
          {!isDownloading && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                İndirme Konumu
              </label>
              <FolderManager
                selectedPath={selectedPath}
                onSelectPath={setSelectedPath}
              />
            </div>
          )}

          {/* İndirilecek Dosya Listesi */}
          {!isDownloading && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İndirilecek Dosya
              </p>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {file.courseName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* İndirme Durumu */}
          {isDownloading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">İndirme İlerlemesi</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {downloadStatus === 'success' ? '1' : '0'} / 1
                </span>
              </div>
              
              <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: downloadStatus === 'success' ? '100%' : downloadStatus === 'downloading' ? '50%' : '0%' }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              {/* Dosya Durumu */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  İndirme Durumu
                </p>
                <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  downloadStatus === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : downloadStatus === 'failed'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : downloadStatus === 'downloading'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                }`}>
                  {/* İkon */}
                  <div className="flex-shrink-0">
                    {downloadStatus === 'success' && (
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {downloadStatus === 'failed' && (
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    {downloadStatus === 'downloading' && (
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    {downloadStatus === 'pending' && (
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Dosya Bilgisi */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      downloadStatus === 'success' 
                        ? 'text-green-900 dark:text-green-100'
                        : downloadStatus === 'failed'
                        ? 'text-red-900 dark:text-red-100'
                        : downloadStatus === 'downloading'
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {file.name}
                    </p>
                    <p className={`text-xs ${
                      downloadStatus === 'success' 
                        ? 'text-green-600 dark:text-green-400'
                        : downloadStatus === 'failed'
                        ? 'text-red-600 dark:text-red-400'
                        : downloadStatus === 'downloading'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {downloadStatus === 'success' && '✓ İndirildi'}
                      {downloadStatus === 'failed' && '✗ Hata'}
                      {downloadStatus === 'downloading' && '↓ İndiriliyor...'}
                      {downloadStatus === 'pending' && '⋯ Bekliyor'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {downloadStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-green-900 dark:text-green-100">Başarılı</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">1</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isDownloading && downloadStatus !== 'success'}
          >
            {isDownloading && downloadStatus !== 'success' ? 'İndiriliyor...' : downloadStatus === 'success' ? 'Kapat' : 'İptal'}
          </Button>
          {!isDownloading && (
            <Button
              onClick={handleDownload}
              disabled={!selectedPath}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Dosyayı İndir
            </Button>
          )}
          {isDownloading && downloadStatus === 'success' && (
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Tamamlandı
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

