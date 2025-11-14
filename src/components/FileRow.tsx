import { CourseFile } from '../types'
import { useState } from 'react'

interface FileRowProps {
  file: CourseFile
  isSelected: boolean
  onToggleSelect: () => void
  onDownload: () => void
  onFolderClick?: () => void
}

export function FileRow({ file, isSelected, onToggleSelect, onDownload, onFolderClick }: FileRowProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    await onDownload()
    setIsDownloading(false)
  }

  const handleClick = () => {
    if (file.isFolder && onFolderClick) {
      onFolderClick()
    }
  }

  return (
    <div 
      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
        isSelected 
          ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${file.isFolder ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {/* Checkbox - hem dosyalar hem klasörler için */}
      {!file.isDownloaded && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
        />
      )}

      {/* İkon - Klasör için de indirme durumu göster */}
      {file.isFolder && (
        <div className="flex-shrink-0">
          {file.isDownloaded ? (
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          )}
        </div>
      )}
      
      {file.isDownloaded && !file.isFolder && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Dosya/Klasör Bilgileri */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-2">
          {file.name}
          {file.isFolder && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </h4>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
          {file.isFolder ? (
            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded text-xs font-medium">
              Klasör
            </span>
          ) : (
            <>
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{file.uploadDate}</span>
            </>
          )}
          {file.courseName && (
            <>
              <span>•</span>
              <span className="text-xs">{file.courseName}</span>
            </>
          )}
        </div>
      </div>

      {/* İndirme Durumu */}
      {!file.isFolder && (
        <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {file.isDownloaded ? (
            <>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                İndirildi
              </span>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Tekrar indir"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  İndiriliyor...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  İndir
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}




