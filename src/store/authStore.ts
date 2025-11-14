import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, User } from '../types'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

  login: async (username: string, password: string, rememberMe: boolean) => {
    try {
      // Electron API'nin yüklendiğini kontrol et
      if (!window.electronAPI) {
        console.error('Electron API henüz yüklenmedi!')
        return false
      }
      
      // Ninova'ya giriş yap
      const success = await window.electronAPI.ninovaLogin(username, password)
      
      if (success) {
        const user: User = { username, rememberMe }
        
        // Eğer "Beni Hatırla" seçiliyse şifreyi şifrele ve kaydet
        if (rememberMe) {
          const encrypted = await window.electronAPI.encryptPassword(password)
          if (encrypted) {
            const settings = await window.electronAPI.getSettings()
            await window.electronAPI.saveSettings({
              ...settings,
              savedUsername: username,
              savedPassword: encrypted,
            })
          }
        }
        
        set({ isAuthenticated: true, user })
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  },

  logout: async () => {
    set({ isAuthenticated: false, user: null })
  },

  checkSavedCredentials: async () => {
    try {
      // Electron API'nin yüklendiğini kontrol et
      if (!window.electronAPI) {
        console.warn('Electron API henüz yüklenmedi, auto-login atlanıyor')
        return
      }
      
      const settings = await window.electronAPI.getSettings()
      
      if (settings?.savedUsername && settings?.savedPassword) {
        console.log('🔐 Kaydedilmiş kimlik bilgileri bulundu, otomatik giriş yapılıyor...')
        
        const password = await window.electronAPI.decryptPassword(settings.savedPassword)
        
        if (!password) {
          console.warn('⚠️ Şifre çözümlenemedi')
          return
        }
        
        try {
          const success = await window.electronAPI.ninovaLogin(
            settings.savedUsername,
            password
          )
          
          if (success) {
            console.log('✅ Otomatik giriş başarılı')
            set({
              isAuthenticated: true,
              user: { username: settings.savedUsername, rememberMe: true },
            })
          } else {
            console.warn('⚠️ Otomatik giriş başarısız - Kaydedilmiş kimlik bilgileri geçersiz olabilir')
            // NOT: Başarısız login sonrası kullanıcı manuel giriş yapabilir
            // Kaydedilmiş bilgileri silmiyoruz çünkü geçici bir hata olabilir
          }
        } catch (loginError) {
          console.error('❌ Otomatik giriş hatası:', loginError)
          // Session expire veya network hatası - kullanıcı manuel giriş yapabilir
        }
      } else {
        console.log('ℹ️ Kaydedilmiş kimlik bilgisi yok')
      }
    } catch (error) {
      console.error('❌ Auto-login kontrol hatası:', error)
    }
  },
    }),
    {
      name: 'auth-storage', // localStorage key adı
      version: 2, // ✅ Version değişti - eski cache temizlenecek
      migrate: (persistedState: any, version: number) => {
        // Eski versiyonlardan yeni versiyona geçiş
        if (version < 2) {
          // Eski state'i temizle ve yeni yapıya dönüştür
          return {
            user: persistedState?.user || null,
          }
        }
        return persistedState
      },
      partialize: (state) => ({
        // ✅ isAuthenticated'ı persist etme - her başlatmada false, otomatik login yapacak
        user: state.user,
      }), // Sadece bu alanları persist et (fonksiyonlar değil)
    }
  )
)


