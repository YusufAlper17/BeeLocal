import { create } from 'zustand'
import { Settings } from '../types'

interface SettingsState {
  settings: Settings
  loadSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>
  selectDownloadPath: () => Promise<void>
  addSavedPath: (path: string) => Promise<void>
  removeSavedPath: (path: string) => Promise<void>
  createNewFolder: (folderName: string) => Promise<string | null>
}

const defaultSettings: Settings = {
  downloadPath: '',
  savedPaths: [],
  folderStructure: 'course',
  theme: 'system',
  notifications: true,
  autoCheck: false,
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,

  loadSettings: async () => {
    try {
      const savedSettings = await window.electronAPI.getSettings()
      if (savedSettings) {
        set({ settings: { ...defaultSettings, ...savedSettings } })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  },

  updateSettings: async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...get().settings, ...newSettings }
      await window.electronAPI.saveSettings(updatedSettings)
      set({ settings: updatedSettings })
      
      // Tema değişikliğini uygula
      if (newSettings.theme) {
        applyTheme(newSettings.theme)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  },

  selectDownloadPath: async () => {
    try {
      const path = await window.electronAPI.selectDirectory()
      if (path) {
        await get().updateSettings({ downloadPath: path })
        // Seçilen klasörü kaydetmeğe ekle (eğer yoksa)
        await get().addSavedPath(path)
      }
    } catch (error) {
      console.error('Error selecting directory:', error)
    }
  },

  addSavedPath: async (path: string) => {
    try {
      const currentPaths = get().settings.savedPaths || []
      if (!currentPaths.includes(path)) {
        const updatedPaths = [...currentPaths, path]
        await get().updateSettings({ savedPaths: updatedPaths })
      }
    } catch (error) {
      console.error('Error adding saved path:', error)
    }
  },

  removeSavedPath: async (path: string) => {
    try {
      const currentPaths = get().settings.savedPaths || []
      const updatedPaths = currentPaths.filter(p => p !== path)
      await get().updateSettings({ savedPaths: updatedPaths })
      
      // Eğer silinen path aktif download path ise, temizle
      if (get().settings.downloadPath === path) {
        await get().updateSettings({ downloadPath: '' })
      }
    } catch (error) {
      console.error('Error removing saved path:', error)
    }
  },

  createNewFolder: async (folderName: string): Promise<string | null> => {
    try {
      // Kullanıcıdan ana klasörü seç
      const basePath = await window.electronAPI.selectDirectory()
      if (!basePath) return null
      
      // Yeni klasör yolu oluştur
      const newFolderPath = `${basePath}/${folderName}`
      
      // Klasörü otomatik olarak download path olarak ayarla ve kaydet
      await get().updateSettings({ downloadPath: newFolderPath })
      await get().addSavedPath(newFolderPath)
      
      return newFolderPath
    } catch (error) {
      console.error('Error creating new folder:', error)
      return null
    }
  },
}))

// Tema uygulama fonksiyonu
function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = window.document.documentElement
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

// Sistem tema değişikliklerini dinle
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const settings = useSettingsStore.getState().settings
    if (settings.theme === 'system') {
      applyTheme('system')
    }
  })
}




