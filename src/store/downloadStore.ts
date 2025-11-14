import { create } from 'zustand'
import { DownloadState, DownloadProgress } from '../types'

export const useDownloadStore = create<DownloadState>((set) => ({
  downloads: [],

  addDownload: (download: DownloadProgress) =>
    set((state) => ({
      downloads: [...state.downloads, download],
    })),

  updateDownload: (fileId: string, progress: Partial<DownloadProgress>) =>
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.fileId === fileId ? { ...d, ...progress } : d
      ),
    })),

  removeDownload: (fileId: string) =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.fileId !== fileId),
    })),

  clearCompleted: () =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.progress < 100),
    })),
}))
















