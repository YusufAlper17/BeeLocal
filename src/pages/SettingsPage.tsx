import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import { Button } from '../components/Button'
import { useToast } from '../components/Toast'

export default function SettingsPage() {
  const navigate = useNavigate()
  const {
    settings,
    loadSettings,
    updateSettings,
    selectDownloadPath,
    removeSavedPath,
    createNewFolder
  } = useSettingsStore()
  const { showToast, ToastContainer } = useToast()
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSelectPath = async () => {
    await selectDownloadPath()
    showToast('İndirme klasörü seçildi ve kaydedildi', 'success')
  }

  const handleSelectSavedPath = async (path: string) => {
    await updateSettings({ downloadPath: path })
    showToast('Klasör seçildi', 'success')
  }

  const handleRemovePath = async (path: string) => {
    await removeSavedPath(path)
    showToast('Klasör kaydı silindi', 'success')
  }

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) {
      showToast('Lütfen klasör adı girin', 'warning')
      return
    }

    const result = await createNewFolder(newFolderName.trim())
    if (result) {
      showToast(`"${newFolderName}" klasörü oluşturuldu ve seçildi`, 'success')
      setNewFolderName('')
      setShowNewFolderDialog(false)
    } else {
      showToast('Klasör oluşturulamadı', 'error')
    }
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme })
    showToast('Tema değiştirildi', 'success')
  }

  const handleNotificationsToggle = () => {
    updateSettings({ notifications: !settings.notifications })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ayarlar
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="space-y-6">
          {/* İndirme Klasörü */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                İndirme Klasörü
              </h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowNewFolderDialog(true)}>
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Yeni Klasör
                </Button>
                <Button onClick={handleSelectPath}>
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  PC'den Seç
                </Button>
              </div>
            </div>

            {/* Yeni Klasör Dialog */}
            {showNewFolderDialog && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                  Yeni Klasör Oluştur
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Klasör adı (örn: Ninova İndirmeler)"
                    className="flex-1 input-field"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateNewFolder()}
                  />
                  <Button onClick={handleCreateNewFolder}>
                    Oluştur
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    setShowNewFolderDialog(false)
                    setNewFolderName('')
                  }}>
                    İptal
                  </Button>
                </div>
              </div>
            )}

            {/* Aktif Klasör */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aktif İndirme Klasörü
              </label>
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {settings.downloadPath || 'Henüz klasör seçilmedi'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kaydedilmiş Klasörler */}
            {settings.savedPaths && settings.savedPaths.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Kaydedilmiş Klasörler
                </label>
                <div className="space-y-2">
                  {settings.savedPaths.map((path, index) => (
                    <div
                      key={index}
                      className={`group flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                        settings.downloadPath === path
                          ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <button
                        onClick={() => handleSelectSavedPath(path)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {path}
                        </span>
                      </button>
                      <button
                        onClick={() => handleRemovePath(path)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Klasör kaydını sil"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!settings.savedPaths || settings.savedPaths.length === 0) && !settings.downloadPath && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p>Henüz kaydedilmiş klasör yok</p>
                <p className="text-sm mt-1">Yeni klasör oluşturun veya mevcut bir klasör seçin</p>
              </div>
            )}
          </section>

          {/* Tema Ayarları */}
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Görünüm
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tema
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <div className="font-medium text-gray-900 dark:text-white">Açık</div>
                </button>

                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <div className="font-medium text-gray-900 dark:text-white">Koyu</div>
                </button>

                <button
                  onClick={() => handleThemeChange('system')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'system'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="font-medium text-gray-900 dark:text-white">Sistem</div>
                </button>
              </div>
            </div>
          </section>

          {/* Bildirimler */}
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Bildirimler
            </h2>
            
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Bildirimleri Etkinleştir
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  İndirme tamamlandığında bildirim al
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={handleNotificationsToggle}
                className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
            </label>
          </section>

          {/* Hakkında */}
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hakkında
            </h2>
            
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Versiyon</span>
                <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Platform</span>
                <span className="font-medium text-gray-900 dark:text-white">Electron</span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p>
                  İTÜ öğrencileri için geliştirilmiş, Ninova platformundaki ders dosyalarını 
                  kolayca takip etmenizi ve indirmenizi sağlayan bir desktop uygulamasıdır.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}




