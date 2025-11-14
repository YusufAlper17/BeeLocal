import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  progress: number
  message: string
}

export function LoadingScreen({ progress, message }: LoadingScreenProps) {
  const [dots, setDots] = useState('')
  const [scanDetail, setScanDetail] = useState<string>('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Scan progress listener
  useEffect(() => {
    const handleScanProgress = (progressData: any) => {
      if (progressData.fileName) {
        setScanDetail(`${progressData.fileName} (${progressData.fileProgress}/${progressData.totalFiles})`)
      }
    }

    if (window.electronAPI?.onScanProgress) {
      window.electronAPI.onScanProgress(handleScanProgress)
    }

    return () => {
      setScanDetail('')
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-12">
          {/* Logo ve Başlık */}
          <div className="inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <span className="text-6xl">🐝</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            BeeLocal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Ninova dosyalarınız hazırlanıyor
          </p>
        </div>

        {/* Animasyonlu Progress Bar */}
        <div className="mb-8">
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Parlayan efekt */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          </div>
          
          {/* Progress Yüzdesi */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {message}{dots}
              </span>
              {scanDetail && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  📄 {scanDetail}
                </div>
              )}
            </div>
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
              %{Math.round(progress)}
            </span>
          </div>
        </div>

        {/* Alt bilgi */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Bağlantı aktif
            </span>
          </div>
        </div>

        {/* Dekoratif elementler */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-200 dark:bg-primary-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-primary-300 dark:bg-primary-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-primary-100 dark:bg-primary-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}



