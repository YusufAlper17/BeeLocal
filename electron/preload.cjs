const { contextBridge, ipcRenderer } = require('electron')

console.log('🚀 Preload script yükleniyor...')

// API'yi window objesine expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // Klasör seçme
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Güvenlik
  encryptPassword: (password) => ipcRenderer.invoke('encrypt-password', password),
  decryptPassword: (encrypted) => ipcRenderer.invoke('decrypt-password', encrypted),
  
  // App path
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // App control
  appQuit: () => ipcRenderer.invoke('app-quit'),
  
  // Ninova işlemleri
  ninovaLogin: (username, password) => 
    ipcRenderer.invoke('ninova-login', username, password),
  ninovaGetCourses: () => 
    ipcRenderer.invoke('ninova-get-courses'),
  ninovaGetFiles: (courseId) => 
    ipcRenderer.invoke('ninova-get-files', courseId),
  ninovaGetFolderContents: (folderUrl, courseId, category, folderPath) => 
    ipcRenderer.invoke('ninova-get-folder-contents', folderUrl, courseId, category, folderPath),
  ninovaGetRecursiveStats: (courseId, category) => 
    ipcRenderer.invoke('ninova-get-recursive-stats', courseId, category),
  ninovaDownloadFile: (fileUrl, savePath) => 
    ipcRenderer.invoke('ninova-download-file', fileUrl, savePath),
  ninovaGetAllAnnouncements: () => 
    ipcRenderer.invoke('ninova-get-all-announcements'),
  ninovaGetKampusAnnouncements: () => 
    ipcRenderer.invoke('ninova-get-kampus-announcements'),
  ninovaGetAnnouncements: (courseId) => 
    ipcRenderer.invoke('ninova-get-announcements', courseId),
  
  // Database işlemleri - Ninova Files
  dbSaveNinovaFile: (fileData) => 
    ipcRenderer.invoke('db-save-ninova-file', fileData),
  dbBulkSaveNinovaFiles: (files) => 
    ipcRenderer.invoke('db-bulk-save-ninova-files', files),
  dbGetNinovaFiles: () => 
    ipcRenderer.invoke('db-get-ninova-files'),
  dbGetNinovaFilesByCourse: (courseId) => 
    ipcRenderer.invoke('db-get-ninova-files-by-course', courseId),
  dbGetNinovaFileByHash: (hash) => 
    ipcRenderer.invoke('db-get-ninova-file-by-hash', hash),
  
  // Database işlemleri - Downloaded Files
  dbAddDownloadedFile: (fileData) => 
    ipcRenderer.invoke('db-add-downloaded-file', fileData),
  dbGetDownloadedFiles: () => 
    ipcRenderer.invoke('db-get-downloaded-files'),
  dbCheckFileExists: (fileId) => 
    ipcRenderer.invoke('db-check-file-exists', fileId),
  dbDeleteDownloadedFile: (fileId) => 
    ipcRenderer.invoke('db-delete-downloaded-file', fileId),
  
  // Database işlemleri - Courses
  dbSaveCourse: (courseData) => 
    ipcRenderer.invoke('db-save-course', courseData),
  dbGetCourses: () => 
    ipcRenderer.invoke('db-get-courses'),
  
  // File Scanner kaldırıldı - artık klasör taraması yapılmıyor
  
  // Settings
  getSettings: () => 
    ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => 
    ipcRenderer.invoke('save-settings', settings),
  addSavedPath: (path) => 
    ipcRenderer.invoke('add-saved-path', path),
  removeSavedPath: (path) => 
    ipcRenderer.invoke('remove-saved-path', path),
  clearNinovaFiles: () => 
    ipcRenderer.invoke('clear-ninova-files'),
  removeDuplicateNinovaFiles: () =>
    ipcRenderer.invoke('remove-duplicate-ninova-files'),
  clearAllData: () => 
    ipcRenderer.invoke('clear-all-data'),
  
  // Listeners
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress))
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download-complete', (_, result) => callback(result))
  },
  onScanProgress: (callback) => {
    ipcRenderer.on('scan-progress', (_, progress) => callback(progress))
  },
})

console.log('✅ Electron API başarıyla expose edildi!')



