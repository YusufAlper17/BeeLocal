import Store from 'electron-store'
import { Settings } from '../../src/types'

interface StoreSchema {
  settings: Settings
  savedUsername?: string
  savedPassword?: string
}

class StorageService {
  private store: Store<StoreSchema>

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'beelocal-config',
      defaults: {
        settings: {
          downloadPath: '',
          savedPaths: [],
          folderStructure: 'course',
          theme: 'system',
          notifications: true,
          autoCheck: false,
        },
      },
    })
  }

  getSettings(): Settings {
    return this.store.get('settings')
  }

  saveSettings(settings: Settings): void {
    this.store.set('settings', settings)
  }

  getSavedCredentials(): { username?: string; password?: string } {
    return {
      username: this.store.get('savedUsername'),
      password: this.store.get('savedPassword'),
    }
  }

  saveSavedUsername(username: string): void {
    this.store.set('savedUsername', username)
  }

  saveSavedPassword(encryptedPassword: string): void {
    this.store.set('savedPassword', encryptedPassword)
  }

  clearSavedCredentials(): void {
    this.store.delete('savedUsername')
    this.store.delete('savedPassword')
  }

  clear(): void {
    this.store.clear()
  }

  // Klasör yolunu kayıtlı yerlere ekle
  addSavedPath(path: string): void {
    const settings = this.getSettings()
    if (!settings.savedPaths.includes(path)) {
      settings.savedPaths.push(path)
      this.saveSettings(settings)
      console.log(`📂 Klasör kayıtlı yerlere eklendi: ${path}`)
    }
  }

  // Klasör yolunu kayıtlı yerlerden çıkar
  removeSavedPath(path: string): void {
    const settings = this.getSettings()
    settings.savedPaths = settings.savedPaths.filter(p => p !== path)
    this.saveSettings(settings)
    console.log(`🗑️ Klasör kayıtlı yerlerden çıkarıldı: ${path}`)
  }
}

export const storageService = new StorageService()




