import initSqlJs, { Database } from 'sql.js'
import path from 'path'
import { app } from 'electron'
import fs from 'fs/promises'

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

export interface CourseData {
  id?: number
  course_id: string
  code: string
  name: string
  term: string
  last_synced: string
}

class DatabaseService {
  private db: Database | null = null
  private dbPath: string = ''

  async initialize() {
    const userDataPath = app.getPath('userData')
    this.dbPath = path.join(userDataPath, 'beelocal.db')

    console.log('📁 [DB INIT] Database path:', this.dbPath)

    // Database klasörünü oluştur
    const dbDir = path.dirname(this.dbPath)
    await fs.mkdir(dbDir, { recursive: true })

    // SQL.js'i başlat
    const SQL = await initSqlJs()
    
    // Eğer database dosyası varsa oku
    try {
      const buffer = await fs.readFile(this.dbPath)
      this.db = new SQL.Database(buffer)
      console.log('✅ [DB INIT] Mevcut database yüklendi')
      
      // Mevcut kayıtları kontrol et
      const downloadedCount = this.db.exec('SELECT COUNT(*) as count FROM downloaded_files')
      const count = downloadedCount[0]?.values[0]?.[0] as number || 0
      console.log(`📊 [DB INIT] Database'de ${count} indirilen dosya kaydı var`)
    } catch (error) {
      // Database yoksa yeni oluştur
      this.db = new SQL.Database()
      console.log('🆕 [DB INIT] Yeni database oluşturuldu (önceki yoktu)')
    }

    this.createTables()
    console.log('✅ [DB INIT] Tablolar oluşturuldu/kontrol edildi')
  }

  private createTables() {
    if (!this.db) return

    // Ninova dosya metadata tablosu
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ninova_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT UNIQUE NOT NULL,
        course_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        upload_date TEXT,
        file_hash TEXT,
        last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_folder INTEGER DEFAULT 0,
        path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // İndirilen dosyalar tablosu
    this.db.run(`
      CREATE TABLE IF NOT EXISTS downloaded_files (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        local_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        upload_date TEXT,
        download_date TEXT NOT NULL,
        file_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Ders listesi cache tablosu
    this.db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id TEXT UNIQUE NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        term TEXT NOT NULL,
        last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Settings tablosu
    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Hash cache tablosu - sistemdeki dosyalar için
    this.db.run(`
      CREATE TABLE IF NOT EXISTS file_hash_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE NOT NULL,
        file_hash TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        last_modified TEXT NOT NULL,
        last_checked DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // İndeksler
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_ninova_file_id ON ninova_files(file_id)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_ninova_course_id ON ninova_files(course_id)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_ninova_file_hash ON ninova_files(file_hash)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_course_id ON courses(course_id)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_hash_cache_path ON file_hash_cache(file_path)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_hash_cache_hash ON file_hash_cache(file_hash)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_downloaded_file_id ON downloaded_files(file_id)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_downloaded_course_id ON downloaded_files(course_id)`)

    this.saveToFile()
  }

  private async saveToFile() {
    if (!this.db) return
    const data = this.db.export()
    await fs.writeFile(this.dbPath, data)
  }

  // ============== NINOVA FILES ==============
  
  saveNinovaFile(fileData: Omit<NinovaFile, 'id'>): void {
    if (!this.db) throw new Error('Database başlatılmamış')

    this.db.run(
      `INSERT OR REPLACE INTO ninova_files 
       (file_id, course_id, course_name, file_name, file_url, file_size, upload_date, file_hash, last_synced, is_folder, path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileData.file_id,
        fileData.course_id,
        fileData.course_name,
        fileData.file_name,
        fileData.file_url,
        fileData.file_size,
        fileData.upload_date,
        fileData.file_hash || null,
        fileData.last_synced,
        fileData.is_folder ? 1 : 0,
        fileData.path || null
      ]
    )

    this.saveToFile()
  }

  // Toplu dosya kaydetme - transaction kullanarak çok daha hızlı
  bulkSaveNinovaFiles(files: Omit<NinovaFile, 'id'>[]): void {
    if (!this.db) throw new Error('Database başlatılmamış')
    if (files.length === 0) return

    // Transaction başlat
    this.db.run('BEGIN TRANSACTION')

    try {
      const stmt = this.db.prepare(
        `INSERT OR REPLACE INTO ninova_files 
         (file_id, course_id, course_name, file_name, file_url, file_size, upload_date, file_hash, last_synced, is_folder, path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )

      for (const fileData of files) {
        stmt.run([
          fileData.file_id,
          fileData.course_id,
          fileData.course_name,
          fileData.file_name,
          fileData.file_url,
          fileData.file_size,
          fileData.upload_date,
          fileData.file_hash || null,
          fileData.last_synced,
          fileData.is_folder ? 1 : 0,
          fileData.path || null
        ])
      }

      stmt.free()

      // Transaction'ı commit et
      this.db.run('COMMIT')
      
      // Tek seferde dosyaya kaydet (her dosya için değil)
      this.saveToFile()
      
      console.log(`✅ ${files.length} dosya toplu olarak kaydedildi`)
    } catch (error) {
      // Hata olursa rollback
      this.db.run('ROLLBACK')
      throw error
    }
  }

  getNinovaFiles(): NinovaFile[] {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec('SELECT * FROM ninova_files ORDER BY last_synced DESC')
    if (result.length === 0) return []

    const files = this.rowsToObjects(result[0]) as any[]
    return files.map(f => ({
      ...f,
      is_folder: f.is_folder === 1
    })) as NinovaFile[]
  }

  getNinovaFilesByCourse(courseId: string): NinovaFile[] {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec('SELECT * FROM ninova_files WHERE course_id = ?', [courseId])
    if (result.length === 0) return []

    const files = this.rowsToObjects(result[0]) as any[]
    return files.map(f => ({
      ...f,
      is_folder: f.is_folder === 1
    })) as NinovaFile[]
  }

  getNinovaFileByHash(hash: string): NinovaFile | null {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec('SELECT * FROM ninova_files WHERE file_hash = ? LIMIT 1', [hash])
    if (result.length === 0) return null

    const files = this.rowsToObjects(result[0]) as any[]
    if (files.length === 0) return null
    
    return {
      ...files[0],
      is_folder: files[0].is_folder === 1
    } as NinovaFile
  }

  updateNinovaFileHash(fileId: string, hash: string): void {
    if (!this.db) throw new Error('Database başlatılmamış')

    this.db.run(
      'UPDATE ninova_files SET file_hash = ?, last_synced = CURRENT_TIMESTAMP WHERE file_id = ?',
      [hash, fileId]
    )
    this.saveToFile()
  }

  // ============== DOWNLOADED FILES ==============

  addDownloadedFile(fileData: Omit<DownloadedFile, 'id'>): void {
    if (!this.db) throw new Error('Database başlatılmamış')

    const id = `${fileData.file_id}_${Date.now()}`

    console.log(`📥 [DB] addDownloadedFile çağrıldı:`)
    console.log(`   ID: ${id}`)
    console.log(`   file_id: ${fileData.file_id}`)
    console.log(`   file_name: ${fileData.file_name}`)
    console.log(`   file_size: ${fileData.file_size} (type: ${typeof fileData.file_size})`)
    console.log(`   upload_date: ${fileData.upload_date} (type: ${typeof fileData.upload_date})`)

    // *** DÜZELTME: TÜM VERİYİ TİP GÜVENLİ HALE GETİR ***
    const sanitizedFileSize = Math.floor(Number(fileData.file_size) || 0)
    const sanitizedUploadDate = String(fileData.upload_date || new Date().toISOString())

    const params = [
      String(id),
      String(fileData.file_id),
      String(fileData.course_id),
      String(fileData.course_name),
      String(fileData.file_name),
      String(fileData.file_url),
      String(fileData.local_path),
      sanitizedFileSize,  // INTEGER
      sanitizedUploadDate,  // TEXT
      String(fileData.download_date),
      fileData.file_hash ? String(fileData.file_hash) : null
    ]
    
    console.log(`🔍 [DB] INSERT parametreleri:`)
    console.log(`   [0] id: ${typeof params[0]} = ${params[0]}`)
    console.log(`   [7] file_size: ${typeof params[7]} = ${params[7]}`)
    console.log(`   [8] upload_date: ${typeof params[8]} = ${params[8]}`)
    console.log(`   [9] download_date: ${typeof params[9]} = ${params[9]}`)

    this.db.run(
      `INSERT OR REPLACE INTO downloaded_files 
       (id, file_id, course_id, course_name, file_name, file_url, local_path, file_size, upload_date, download_date, file_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    )

    console.log(`✅ [DB] Veritabanına eklendi, dosyaya kaydediliyor...`)
    this.saveToFile()
    console.log(`💾 [DB] Dosyaya kaydedildi`)
    
    // Doğrulama: Gerçekten kaydedildi mi kontrol et
    const checkResult = this.db.exec('SELECT COUNT(*) as count FROM downloaded_files WHERE file_id = ?', [fileData.file_id])
    const count = checkResult[0]?.values[0]?.[0] as number
    console.log(`🔍 [DB] Kayıt sonrası kontrol: ${count} kayıt bulundu`)
  }

  getDownloadedFiles(): DownloadedFile[] {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec('SELECT * FROM downloaded_files ORDER BY download_date DESC')
    if (result.length === 0) {
      console.log(`📂 [DB] getDownloadedFiles: Veritabanında hiç indirilen dosya yok`)
      return []
    }

    const files = this.rowsToObjects(result[0]) as DownloadedFile[]
    console.log(`📂 [DB] getDownloadedFiles: ${files.length} indirilen dosya bulundu`)
    console.log(`   İlk 3 dosya:`, files.slice(0, 3).map(f => f.file_name))
    return files
  }

  checkFileExists(fileId: string): boolean {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec('SELECT COUNT(*) as count FROM downloaded_files WHERE file_id = ?', [fileId])
    if (result.length === 0) {
      console.log(`❌ [DB] checkFileExists: ${fileId} - Sonuç yok`)
      return false
    }

    const count = result[0].values[0]?.[0] as number
    const exists = count > 0
    console.log(`🔍 [DB] checkFileExists: ${fileId} - ${exists ? 'BULUNDU' : 'BULUNAMADI'} (count: ${count})`)
    return exists
  }

  deleteDownloadedFile(fileId: string): void {
    if (!this.db) throw new Error('Database başlatılmamış')

    this.db.run('DELETE FROM downloaded_files WHERE file_id = ?', [fileId])
    this.saveToFile()
  }

  // ============== COURSES ==============

  saveCourse(courseData: Omit<CourseData, 'id'>): void {
    if (!this.db) throw new Error('Database başlatılmamış')

    this.db.run(
      `INSERT OR REPLACE INTO courses 
       (course_id, code, name, term, last_synced)
       VALUES (?, ?, ?, ?, ?)`,
      [
        courseData.course_id,
        courseData.code,
        courseData.name,
        courseData.term,
        courseData.last_synced
      ]
    )

    this.saveToFile()
  }

  getCourses(): CourseData[] {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec('SELECT * FROM courses ORDER BY last_synced DESC')
    if (result.length === 0) return []

    return this.rowsToObjects(result[0]) as CourseData[]
  }

  // ============== HASH CACHE ==============

  saveFileHashCache(filePath: string, hash: string, fileSize: number, lastModified: string): void {
    if (!this.db) throw new Error('Database başlatılmamış')

    this.db.run(
      `INSERT OR REPLACE INTO file_hash_cache 
       (file_path, file_hash, file_size, last_modified, last_checked)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [filePath, hash, fileSize, lastModified]
    )

    this.saveToFile()
  }

  getFileHashCache(filePath: string): { file_hash: string, file_size: number, last_modified: string } | null {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec(
      'SELECT file_hash, file_size, last_modified FROM file_hash_cache WHERE file_path = ?',
      [filePath]
    )
    if (result.length === 0) return null

    const rows = this.rowsToObjects(result[0])
    return rows[0] as any || null
  }

  findFilesByHash(hash: string): string[] {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec(
      'SELECT file_path FROM file_hash_cache WHERE file_hash = ?',
      [hash]
    )
    if (result.length === 0) return []

    const rows = this.rowsToObjects(result[0])
    return rows.map((r: any) => r.file_path)
  }

  private rowsToObjects(queryResult: any): any[] {
    const { columns, values } = queryResult
    return values.map((row: any[]) => {
      const obj: any = {}
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx]
      })
      return obj
    })
  }

  getSetting(key: string): string | null {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec('SELECT value FROM settings WHERE key = ?', [key])
    if (result.length === 0) return null

    return result[0].values[0]?.[0] as string || null
  }

  setSetting(key: string, value: string): void {
    if (!this.db) throw new Error('Database başlatılmamış')

    this.db.run(
      `INSERT OR REPLACE INTO settings (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [key, value]
    )

    this.saveToFile()
  }

  getAllSettings(): Record<string, string> {
    if (!this.db) throw new Error('Database başlatılmamış')

    const result = this.db.exec('SELECT key, value FROM settings')
    if (result.length === 0) return {}

    const rows = this.rowsToObjects(result[0])
    const settings: Record<string, string> = {}
    rows.forEach((row: any) => {
      settings[row.key] = row.value
    })

    return settings
  }

  // Sadece Ninova dosyalarını temizle (courseId hatalarını düzeltmek için)
  async clearNinovaFiles(): Promise<void> {
    if (!this.db) throw new Error('Database başlatılmamış')
    
    console.log('🗑️ Ninova dosyaları temizleniyor...')
    
    // Sadece ninova_files tablosunu temizle (indirilen dosyalar ve diğer veriler korunur)
    this.db.run('DELETE FROM ninova_files')
    
    await this.saveToFile()
    
    console.log('✅ Ninova dosyaları temizlendi')
  }
  
  // Duplicate dosyaları temizle (aynı file_name+file_url, farklı course_id)
  async removeDuplicateNinovaFiles(): Promise<number> {
    if (!this.db) throw new Error('Database başlatılmamış')
    
    console.log('🔍 Duplicate dosyalar aranıyor...')
    
    // Aynı dosya adı ve URL'ye sahip kayıtları bul, en son (MAX id) olanı tut
    const query = `
      DELETE FROM ninova_files
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM ninova_files
        GROUP BY file_name, file_url
      )
    `
    
    this.db.run(query)
    
    // Kaç kayıt silindi?
    const result = this.db.exec('SELECT changes() as deleted')
    const deletedCount = result.length > 0 ? (result[0].values[0][0] as number) : 0
    
    await this.saveToFile()
    
    console.log(`✅ ${deletedCount} duplicate dosya silindi`)
    return deletedCount
  }

  // Tüm verileri temizle
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database başlatılmamış')
    
    console.log('🗑️ Database temizleniyor...')
    
    // Tüm tabloları temizle
    this.db.run('DELETE FROM ninova_files')
    this.db.run('DELETE FROM courses')
    this.db.run('DELETE FROM file_hash_cache')
    this.db.run('DELETE FROM settings')
    this.db.run('DELETE FROM downloaded_files')
    
    await this.saveToFile()
    
    console.log('✅ Database temizlendi')
  }

  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

export const databaseService = new DatabaseService()

