import fs from 'fs/promises'
import path from 'path'
import { createWriteStream } from 'fs'
import https from 'https'
import http from 'http'
import crypto from 'crypto'

export interface DownloadOptions {
  url: string
  savePath: string
  onProgress?: (downloaded: number, total: number) => void
}

export class DownloadService {
  async downloadFile(options: DownloadOptions): Promise<string> {
    const { url, savePath, onProgress } = options

    // Klasör yoksa oluştur
    const dir = path.dirname(savePath)
    await fs.mkdir(dir, { recursive: true })

    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Redirect durumunda
          if (response.headers.location) {
            this.downloadFile({ ...options, url: response.headers.location })
              .then(resolve)
              .catch(reject)
          }
          return
        }

        if (response.statusCode !== 200) {
          reject(new Error(`İndirme hatası: ${response.statusCode}`))
          return
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10)
        let downloadedSize = 0

        const fileStream = createWriteStream(savePath)

        response.on('data', (chunk) => {
          downloadedSize += chunk.length
          if (onProgress) {
            onProgress(downloadedSize, totalSize)
          }
        })

        response.pipe(fileStream)

        fileStream.on('finish', () => {
          fileStream.close()
          resolve(savePath)
        })

        fileStream.on('error', (err) => {
          fs.unlink(savePath).catch(() => {}) // Hatalı dosyayı sil
          reject(err)
        })
      })

      request.on('error', (err) => {
        reject(err)
      })

      request.end()
    })
  }

  async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  sanitizeFileName(fileName: string): string {
    // Dosya adındaki geçersiz karakterleri temizle
    return fileName.replace(/[<>:"/\\|?*]/g, '_')
  }

  generateSavePath(
    basePath: string,
    courseName: string,
    fileName: string,
    structure: 'course' | 'term-course' | 'custom' = 'course',
    term?: string
  ): string {
    const sanitizedCourse = this.sanitizeFileName(courseName)
    const sanitizedFile = this.sanitizeFileName(fileName)

    switch (structure) {
      case 'term-course':
        return path.join(basePath, term || '2024-2025', sanitizedCourse, sanitizedFile)
      case 'course':
        return path.join(basePath, sanitizedCourse, sanitizedFile)
      default:
        return path.join(basePath, sanitizedFile)
    }
  }
}

export const downloadService = new DownloadService()
















