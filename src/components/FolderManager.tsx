import { useState } from 'react'
import { Button } from './Button'
import { useSettingsStore } from '../store/settingsStore'

interface FolderManagerProps {
  onSelectPath: (path: string) => void
  selectedPath: string
}

export function FolderManager({ onSelectPath, selectedPath }: FolderManagerProps) {
  const { settings, addSavedPath, removeSavedPath } = useSettingsStore()
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSelectFromSystem = async () => {
    const path = await window.electronAPI.selectDirectory()
    if (path) {
      // Klasörü kayıtlı yerlere ekle
      await addSavedPath(path)
      onSelectPath(path)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setIsCreating(true)
    try {
      const basePath = await window.electronAPI.selectDirectory()
      if (basePath) {
        const fullPath = `${basePath}/${newFolderName}`
        
        // Klasörü sisteme kaydet
        await addSavedPath(fullPath)
        
        onSelectPath(fullPath)
        setNewFolderName('')
        setShowNewFolderDialog(false)
      }
    } catch (error) {
      console.error('Klasör oluşturma hatası:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRemovePath = async (path: string) => {
    await removeSavedPath(path)
  }

  return (
    <div className="space-y-4">
      {/* Kaydedilmiş Klasörler */}
      {settings.savedPaths && settings.savedPaths.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Kaydedilmiş Klasörler
            </label>
            <button
              onClick={handleSelectFromSystem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200 dark:border-red-800"
              title="Yeni klasör ekle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Klasör Ekle</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
            {settings.savedPaths.map((path, index) => (
              <div
                key={index}
                className={`group relative flex items-center justify-between p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedPath === path
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
                onClick={() => onSelectPath(path)}
              >
                {/* Sol taraf - Icon ve Path bilgisi */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedPath === path
                      ? 'bg-primary-500'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30'
                  }`}>
                    <svg 
                      className={`w-6 h-6 transition-colors ${
                        selectedPath === path
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  
                  {/* Text bilgileri */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate transition-colors ${
                      selectedPath === path
                        ? 'text-primary-900 dark:text-primary-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {path.split('/').pop() || path}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {path}
                    </p>
                  </div>
                </div>
                
                {/* Sağ taraf - Action butonları */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemovePath(path)
                    }}
                    className="flex-shrink-0 w-9 h-9 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
                    title="Sil"
                  >
                    <svg 
                      className="w-4 h-4 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {/* Seçili indicator */}
                {selectedPath === path && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yeni Klasör Dialog */}
      {showNewFolderDialog && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Yeni Klasör Oluştur
            </h4>
            <button
              onClick={() => {
                setShowNewFolderDialog(false)
                setNewFolderName('')
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Klasör adı girin..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isCreating}
              isLoading={isCreating}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Oluştur ve Kaydet
            </Button>
          </div>
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleSelectFromSystem}
          variant="secondary"
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Bilgisayardan Seç
        </Button>
        <Button
          onClick={() => setShowNewFolderDialog(true)}
          variant="primary"
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Yeni Klasör Oluştur
        </Button>
      </div>

      {/* Seçili Klasör Gösterimi */}
      {selectedPath && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                Seçili Klasör
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 truncate">
                {selectedPath}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

