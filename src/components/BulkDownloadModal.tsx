import { useState, useEffect, useRef } from 'react'
import { CourseFile } from '../types'
import { Button } from './Button'
import { FolderManager } from './FolderManager'

interface BulkDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  files: CourseFile[]
  onDownload: (files: CourseFile[], downloadPath: string) => Promise<void>
  onSingleDownload?: (file: CourseFile, downloadPath: string) => Promise<void>
}

interface DownloadLog {
  fileName: string
  status: 'pending' | 'downloading' | 'success' | 'failed'
  error?: string
}

export function BulkDownloadModal({ isOpen, onClose, files, onDownload, onSingleDownload }: BulkDownloadModalProps) {
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([])
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedPath('')
      setIsDownloading(false)
      setSuccessCount(0)
      setFailedCount(0)
      setDownloadLogs([])
    }
  }, [isOpen])
  
  // Dosya listesi değiştiğinde log'ları başlat
  useEffect(() => {
    if (isOpen && files.length > 0) {
      setDownloadLogs(files.map(file => ({
        fileName: file.name,
        status: 'pending'
      })))
    }
  }, [isOpen, files])
  
  // İndirme durumu değiştiğinde scroll'u otomatik aşağı kaydır
  useEffect(() => {
    if (logContainerRef.current && isDownloading) {
      const currentIndex = downloadLogs.findIndex(log => log.status === 'downloading')
      if (currentIndex !== -1) {
        const children = logContainerRef.current.children
        if (children[currentIndex]) {
          children[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    }
  }, [downloadLogs, isDownloading])

  const handleDownload = async () => {
    if (!selectedPath || files.length === 0) return
    
    setIsDownloading(true)
    setSuccessCount(0)
    setFailedCount(0)
    
    try {
      // Eğer tek dosya indirme fonksiyonu varsa onu kullan
      if (onSingleDownload) {
        // TAM PARALEL İNDİRME: Tüm dosyalar aynı anda indirilir! 🚀
        console.log(`🚀 ${files.length} dosya TAM PARALEL indiriliyor...`)
        
        // Dosya indirme fonksiyonu
        const downloadFile = async (file: CourseFile, index: number) => {
          // Durumu "downloading" olarak güncelle
          setDownloadLogs(prev => prev.map((log, idx) => 
            idx === index ? { ...log, status: 'downloading' } : log
          ))
          
          try {
            await onSingleDownload(file, selectedPath)
            setSuccessCount(prev => prev + 1)
            
            // Durumu "success" olarak güncelle
            setDownloadLogs(prev => prev.map((log, idx) => 
              idx === index ? { ...log, status: 'success' } : log
            ))
            
            console.log(`✅ ${file.name} indirildi`)
          } catch (error) {
            console.error(`❌ İndirme hatası (${file.name}):`, error)
            setFailedCount(prev => prev + 1)
            
            // Durumu "failed" olarak güncelle
            setDownloadLogs(prev => prev.map((log, idx) => 
              idx === index ? { ...log, status: 'failed', error: String(error) } : log
            ))
          }
        }
        
        // TÜM DOSYALARI AYNI ANDA İNDİR! 🔥
        await Promise.all(
          files.map((file, index) => downloadFile(file, index))
        )
        
        console.log(`🎉 Tüm indirmeler tamamlandı! Başarılı: ${successCount}, Başarısız: ${failedCount}`)
      } else {
        // Toplu indirme fonksiyonunu kullan
        await onDownload(files, selectedPath)
        setSuccessCount(files.length)
        
        // Tüm dosyaları başarılı olarak işaretle
        setDownloadLogs(prev => prev.map(log => ({ ...log, status: 'success' })))
      }
      
      // Klasörü kayıtlı yerlere ekle
      await window.electronAPI.addSavedPath(selectedPath)
      
      console.log('✅ İndirme tamamlandı')
      
      // İndirme tamamlandıktan sonra başarı mesajını göstermek için 4 saniye bekle
      setTimeout(() => {
        setIsDownloading(false)
        onClose()
      }, 4000)
    } catch (error) {
      setIsDownloading(false)
      console.error('Bulk download error:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const progress = files.length > 0 ? ((successCount + failedCount) / files.length) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Toplu İndirme
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {files.length} dosya indirilecek
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDownloading}
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
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {files.length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Toplam Boyut</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatFileSize(totalSize)}
              </p>
            </div>
          </div>

          {/* Folder Manager */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              İndirme Konumu
            </label>
            <FolderManager
              selectedPath={selectedPath}
              onSelectPath={setSelectedPath}
            />
          </div>

          {/* Progress */}
          {isDownloading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">İndirme İlerlemesi</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {successCount + failedCount} / {files.length}
                </span>
              </div>
              
              <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400">Başarılı</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">{successCount}</p>
                  </div>
                </div>
                {failedCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400">Başarısız</p>
                      <p className="text-lg font-bold text-red-900 dark:text-red-100">{failedCount}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* İndirme Log Listesi */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  İndirme Durumu
                </p>
                <div ref={logContainerRef} className="max-h-64 overflow-y-auto space-y-2 pr-2 scroll-smooth">
                  {downloadLogs.map((log, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        log.status === 'success' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : log.status === 'failed'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : log.status === 'downloading'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {/* İkon */}
                      <div className="flex-shrink-0">
                        {log.status === 'success' && (
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {log.status === 'failed' && (
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                        {log.status === 'downloading' && (
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                        {log.status === 'pending' && (
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
                          log.status === 'success' 
                            ? 'text-green-900 dark:text-green-100'
                            : log.status === 'failed'
                            ? 'text-red-900 dark:text-red-100'
                            : log.status === 'downloading'
                            ? 'text-red-900 dark:text-red-100'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {log.fileName}
                        </p>
                        <p className={`text-xs ${
                          log.status === 'success' 
                            ? 'text-green-600 dark:text-green-400'
                            : log.status === 'failed'
                            ? 'text-red-600 dark:text-red-400'
                            : log.status === 'downloading'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {log.status === 'success' && '✓ İndirildi'}
                          {log.status === 'failed' && '✗ Hata'}
                          {log.status === 'downloading' && '↓ İndiriliyor...'}
                          {log.status === 'pending' && '⋯ Bekliyor'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* File List */}
          {!isDownloading && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İndirilecek Dosyalar
              </p>
              {files.map((file, index) => (
                <div 
                  key={file.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isDownloading && progress < 100}
          >
            {isDownloading && progress < 100 ? 'İndiriliyor...' : progress === 100 ? 'Kapat' : 'İptal'}
          </Button>
          {!isDownloading && (
            <Button
              onClick={handleDownload}
              disabled={!selectedPath || files.length === 0}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {files.length} Dosyayı İndir
            </Button>
          )}
          {isDownloading && progress === 100 && (
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successCount} Dosya Tamamlandı
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

