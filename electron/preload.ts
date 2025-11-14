import { contextBridge, ipcRenderer } from 'electron'

console.log('🚀 Preload script yükleniyor...')

// API'yi window objesine expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // Klasör seçme
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Güvenlik
  encryptPassword: (password: string) => ipcRenderer.invoke('encrypt-password', password),
  decryptPassword: (encrypted: string) => ipcRenderer.invoke('decrypt-password', encrypted),
  
  // App path
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Ninova işlemleri
  ninovaLogin: (username: string, password: string) => 
    ipcRenderer.invoke('ninova-login', username, password),
  ninovaGetCourses: () => 
    ipcRenderer.invoke('ninova-get-courses'),
  ninovaGetFiles: (courseId: string) => 
    ipcRenderer.invoke('ninova-get-files', courseId),
  ninovaGetFolderContents: (folderUrl: string, courseId: string, category: string, folderPath: string) => 
    ipcRenderer.invoke('ninova-get-folder-contents', folderUrl, courseId, category, folderPath),
  ninovaGetRecursiveStats: (courseId: string, category: string) => 
    ipcRenderer.invoke('ninova-get-recursive-stats', courseId, category),
  ninovaGetAllAnnouncements: () => 
    ipcRenderer.invoke('ninova-get-all-announcements'),
  ninovaGetKampusAnnouncements: () => 
    ipcRenderer.invoke('ninova-get-kampus-announcements'),
  ninovaGetAnnouncements: (courseId: string) => 
    ipcRenderer.invoke('ninova-get-announcements', courseId),
  ninovaDownloadFile: (fileUrl: string, savePath: string) => 
    ipcRenderer.invoke('ninova-download-file', fileUrl, savePath),
  
  // Database işlemleri - Ninova Files
  dbSaveNinovaFile: (fileData: any) => 
    ipcRenderer.invoke('db-save-ninova-file', fileData),
  dbBulkSaveNinovaFiles: (files: any[]) => 
    ipcRenderer.invoke('db-bulk-save-ninova-files', files),
  dbGetNinovaFiles: () => 
    ipcRenderer.invoke('db-get-ninova-files'),
  dbGetNinovaFilesByCourse: (courseId: string) => 
    ipcRenderer.invoke('db-get-ninova-files-by-course', courseId),
  dbGetNinovaFileByHash: (hash: string) => 
    ipcRenderer.invoke('db-get-ninova-file-by-hash', hash),
  
  // Database işlemleri - Downloaded Files
  dbGetDownloadedFiles: () => 
    ipcRenderer.invoke('db-get-downloaded-files'),
  dbAddDownloadedFile: (fileData: any) => 
    ipcRenderer.invoke('db-add-downloaded-file', fileData),
  dbCheckFileExists: (fileId: string) => 
    ipcRenderer.invoke('db-check-file-exists', fileId),
  dbDeleteDownloadedFile: (fileId: string) => 
    ipcRenderer.invoke('db-delete-downloaded-file', fileId),
  
  // Database işlemleri - Courses
  dbSaveCourse: (courseData: any) => 
    ipcRenderer.invoke('db-save-course', courseData),
  dbGetCourses: () => 
    ipcRenderer.invoke('db-get-courses'),
  
  // File Scanner kaldırıldı - artık klasör taraması yapılmıyor
  
  // Settings
  getSettings: () => 
    ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => 
    ipcRenderer.invoke('save-settings', settings),
  addSavedPath: (path: string) => 
    ipcRenderer.invoke('add-saved-path', path),
  removeSavedPath: (path: string) => 
    ipcRenderer.invoke('remove-saved-path', path),
  clearNinovaFiles: () => 
    ipcRenderer.invoke('clear-ninova-files'),
  removeDuplicateNinovaFiles: () => 
    ipcRenderer.invoke('remove-duplicate-ninova-files'),
  clearAllData: () => 
    ipcRenderer.invoke('clear-all-data'),
  
  // App
  appQuit: () => 
    ipcRenderer.invoke('app-quit'),
  
  // Listeners
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress))
  },
  onDownloadComplete: (callback: (result: any) => void) => {
    ipcRenderer.on('download-complete', (_, result) => callback(result))
  },
  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('scan-progress', (_, progress) => callback(progress))
  },
})

console.log('✅ Electron API başarıyla expose edildi!')

// Global type tanımı types/index.ts dosyasında yapılmıştır
