import { useEffect } from 'react'
import { useDownloadStore } from '../store/downloadStore'
import { CourseFile } from '../types'

export function useDownloadManager() {
  const { downloads, addDownload, updateDownload, removeDownload } = useDownloadStore()

  useEffect(() => {
    // Download progress listener
    window.electronAPI.onDownloadProgress((progress: any) => {
      updateDownload(progress.fileId, {
        downloaded: progress.downloaded,
        total: progress.total,
        progress: progress.progress,
      })
    })

    // Download complete listener
    window.electronAPI.onDownloadComplete((result: any) => {
      if (result.success) {
        // İndirme tamamlandı
      }
    })
  }, [updateDownload])

  const startDownload = (file: CourseFile) => {
    addDownload({
      fileId: file.id,
      fileName: file.name,
      progress: 0,
      total: file.size,
      downloaded: 0,
    })
  }

  return {
    downloads,
    startDownload,
    removeDownload,
  }
}
















