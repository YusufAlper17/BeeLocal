import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useAppStore } from './store/appStore'
import { useSettingsStore } from './store/settingsStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import { LoadingScreen } from './components/LoadingScreen'

function App() {
  console.log('✅ App component render edildi');
  
  const RouterComponent = window.location.protocol === 'file:' ? HashRouter : BrowserRouter

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const checkSavedCredentials = useAuthStore((state) => state.checkSavedCredentials)
  const { isInitialized, initProgress, initMessage, initializeApp } = useAppStore()
  const loadSettings = useSettingsStore((state) => state.loadSettings)

  // Uygulama başlangıcında settings'i yükle ve kaydedilmiş credentials'ı kontrol et
  useEffect(() => {
    const initApp = async () => {
      await loadSettings()
      // Kaydedilmiş kimlik bilgileri varsa otomatik giriş yap
      await checkSavedCredentials()
    }
    initApp()
  }, [loadSettings, checkSavedCredentials])

  // Kullanıcı giriş yaptığında veri yüklemeyi başlat
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      console.log('🚀 İlk yükleme - initializeApp çağrılıyor...')
      initializeApp()
    } else if (isAuthenticated && isInitialized) {
      console.log('✅ Veriler zaten yüklü (hot reload sonrası korundu)')
    }
  }, [isAuthenticated, isInitialized, initializeApp])

  // Giriş yapılmış ama veriler hazır değilse loading göster
  if (isAuthenticated && !isInitialized) {
    return <LoadingScreen progress={initProgress} message={initMessage} />
  }

  return (
    <RouterComponent>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" replace />} 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </RouterComponent>
  )
}

export default App




