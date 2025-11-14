export interface Course {
  id: string
  code: string
  name: string
  term: string
  instructor?: string
}

export interface CourseFile {
  id: string
  courseId: string
  courseName: string
  name: string
  url: string
  size: number
  uploadDate: string
  isDownloaded: boolean
  isFolder?: boolean
  path?: string
  localPath?: string
  downloadDate?: string
  hash?: string
}

export interface NinovaFile {
  id?: number
  file_id: string
  course_id: string
  course_name: string
  file_name: string
  file_url: string
  file_size: number
  upload_date: string
  file_hash?: string
  last_synced: string
  is_folder?: boolean
  path?: string
}

export interface ScannedFile {
  filePath: string
  fileName: string
  fileSize: number
  hash: string
  lastModified: string
}

export interface MatchResult {
  ninovaFile: NinovaFile
  localPath: string
  matched: boolean
}

export interface CourseData {
  id?: number
  course_id: string
  code: string
  name: string
  term: string
  last_synced: string
}

export interface DownloadedFile {
  id: string
  file_id: string
  course_id: string
  course_name: string
  file_name: string
  file_url: string
  local_path: string
  file_size: number
  upload_date: string
  download_date: string
  file_hash?: string
}

export interface DownloadProgress {
  fileId: string
  fileName: string
  progress: number
  total: number
  downloaded: number
}

export interface Settings {
  downloadPath: string
  savedPaths: string[]  // Kaydedilmiş klasör yolları
  folderStructure: 'course' | 'term-course' | 'custom'
  customStructure?: string
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  autoCheck: boolean
  checkInterval?: number
}

export interface User {
  username: string
  rememberMe: boolean
}

export interface Announcement {
  id: string
  courseId: string
  courseName: string
  title: string
  content?: string
  date: string
  author?: string
  url: string
  isRead?: boolean
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>
  logout: () => void
  checkSavedCredentials: () => Promise<void>
}

export interface AppState {
  courses: Course[]
  files: CourseFile[]
  selectedCourse: Course | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  initProgress: number
  initMessage: string
  announcements: Announcement[]
  setCourses: (courses: Course[]) => void
  setFiles: (files: CourseFile[]) => void
  setSelectedCourse: (course: Course | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setInitProgress: (progress: number, message: string) => void
  setAnnouncements: (announcements: Announcement[]) => void
  fetchAllAnnouncements: () => Promise<void>
  fetchKampusAnnouncements: () => Promise<void>
  fetchAnnouncements: (courseId: string) => Promise<void>
  initializeApp: () => Promise<void>
  refreshCourses: () => Promise<void>
  refreshFiles: (courseId: string, category?: 'sinif' | 'ders') => Promise<void>
  getCachedStats: (courseId: string) => {
    sinif: { folders: number, totalFiles: number },
    ders: { folders: number, totalFiles: number }
  } | null
}

export interface DownloadState {
  downloads: DownloadProgress[]
  addDownload: (download: DownloadProgress) => void
  updateDownload: (fileId: string, progress: Partial<DownloadProgress>) => void
  removeDownload: (fileId: string) => void
  clearCompleted: () => void
}

// Electron API type definitions
declare global {
  interface Window {
    electronAPI: {
      selectDirectory: () => Promise<string>
      encryptPassword: (password: string) => Promise<string | null>
      decryptPassword: (encrypted: string) => Promise<string | null>
      getAppPath: () => Promise<string>
      appQuit: () => Promise<void>
      ninovaLogin: (username: string, password: string) => Promise<boolean>
      ninovaGetCourses: () => Promise<Course[]>
      ninovaGetFiles: (courseId: string) => Promise<CourseFile[]>
      ninovaGetFolderContents: (folderUrl: string, courseId: string, category: string, folderPath: string) => Promise<CourseFile[]>
      ninovaGetRecursiveStats: (courseId: string, category: string) => Promise<{ folders: number, totalFiles: number }>
      ninovaGetAllAnnouncements: () => Promise<Announcement[]>
      ninovaGetKampusAnnouncements: () => Promise<Announcement[]>
      ninovaGetAnnouncements: (courseId: string) => Promise<Announcement[]>
      ninovaDownloadFile: (fileUrl: string, savePath: string) => Promise<void>
      // Database - Ninova Files
      dbSaveNinovaFile: (fileData: Omit<NinovaFile, 'id'>) => Promise<void>
      dbBulkSaveNinovaFiles: (files: Omit<NinovaFile, 'id'>[]) => Promise<void>
      dbGetNinovaFiles: () => Promise<NinovaFile[]>
      dbGetNinovaFilesByCourse: (courseId: string) => Promise<NinovaFile[]>
      dbGetNinovaFileByHash: (hash: string) => Promise<NinovaFile | null>
      // Database - Downloaded Files
      dbAddDownloadedFile: (fileData: Omit<DownloadedFile, 'id'>) => Promise<void>
      dbGetDownloadedFiles: () => Promise<DownloadedFile[]>
      dbCheckFileExists: (fileId: string) => Promise<boolean>
      dbDeleteDownloadedFile: (fileId: string) => Promise<void>
      // Database - Courses
      dbSaveCourse: (courseData: Omit<CourseData, 'id'>) => Promise<void>
      dbGetCourses: () => Promise<CourseData[]>
      // File Scanner
      scanFolder: (folderPath: string) => Promise<ScannedFile[]>
      scanAllFolders: (savedPaths: string[]) => Promise<ScannedFile[]>
      matchFiles: (scannedFiles: ScannedFile[], ninovaFiles: NinovaFile[]) => Promise<MatchResult[]>
      calculateFileHash: (filePath: string) => Promise<string>
      // Settings
      getSettings: () => Promise<any>
      saveSettings: (settings: any) => Promise<void>
      addSavedPath: (path: string) => Promise<void>
      removeSavedPath: (path: string) => Promise<void>
      clearNinovaFiles: () => Promise<{ success: boolean, error?: string }>
      removeDuplicateNinovaFiles: () => Promise<{ success: boolean, deletedCount?: number, error?: string }>
      clearAllData: () => Promise<{ success: boolean, error?: string }>
      // Events
      onDownloadProgress: (callback: (progress: any) => void) => void
      onDownloadComplete: (callback: (result: any) => void) => void
      onScanProgress: (callback: (progress: any) => void) => void
    }
  }
}




