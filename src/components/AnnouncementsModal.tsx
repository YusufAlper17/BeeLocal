import { Announcement } from '../types'
import { useState } from 'react'

interface AnnouncementsModalProps {
  isOpen: boolean
  onClose: () => void
  announcements: Announcement[]
  courseName?: string
}

export function AnnouncementsModal({
  isOpen,
  onClose,
  announcements,
  courseName
}: AnnouncementsModalProps) {
  const [detailAnnouncementIndex, setDetailAnnouncementIndex] = useState<number | null>(null)
  
  if (!isOpen) return null

  const openDetailModal = (index: number) => {
    setDetailAnnouncementIndex(index)
  }

  const closeDetailModal = () => {
    setDetailAnnouncementIndex(null)
  }

  const goToPrevious = () => {
    if (detailAnnouncementIndex !== null && detailAnnouncementIndex > 0) {
      setDetailAnnouncementIndex(detailAnnouncementIndex - 1)
    }
  }

  const goToNext = () => {
    if (detailAnnouncementIndex !== null && detailAnnouncementIndex < announcements.length - 1) {
      setDetailAnnouncementIndex(detailAnnouncementIndex + 1)
    }
  }

  const currentAnnouncement = detailAnnouncementIndex !== null ? announcements[detailAnnouncementIndex] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Duyurular
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {courseName || 'Tüm duyurular'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Bu ders için henüz duyuru bulunmuyor
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement, index) => {
                return (
                  <div
                    key={index}
                    className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Başlık Bölümü - Tıklanabilir */}
                    <div
                      onClick={() => openDetailModal(index)}
                      className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {announcement.title}
                          </h3>
                          
                          {announcement.courseName && (
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {announcement.courseName}
                              </span>
                            </div>
                          )}
                          
                          {/* İçerik Özeti */}
                          {announcement.content && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {announcement.content}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{announcement.date}</span>
                            </div>
                            {announcement.author && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>{announcement.author}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Detay İkonu */}
                        <div className="flex-shrink-0">
                          <div className="flex flex-col items-center gap-1">
                            <svg 
                              className="w-6 h-6 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-all" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              Aç
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Toplam {announcements.length} duyuru
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* Tam Ekran Detay Modalı */}
      {currentAnnouncement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          {/* Modal İçeriği */}
          <div className="relative bg-white dark:bg-gray-900 w-full h-full sm:h-[95vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            
            {/* Üst Bar - Sabit */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-4 sm:px-6 py-4 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                {/* Navigasyon Butonları */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevious}
                    disabled={detailAnnouncementIndex === 0}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      detailAnnouncementIndex === 0
                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                    title="Önceki Duyuru"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={detailAnnouncementIndex === announcements.length - 1}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      detailAnnouncementIndex === announcements.length - 1
                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                    title="Sonraki Duyuru"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span className="text-sm text-white/90 font-medium ml-2 hidden sm:block">
                    {detailAnnouncementIndex! + 1} / {announcements.length}
                  </span>
                </div>

                {/* Başlık */}
                <div className="flex-1 min-w-0 text-center">
                  <h3 className="text-lg font-bold text-white truncate">
                    Duyuru Detayı
                  </h3>
                </div>

                {/* Kapat Butonu */}
                <button
                  onClick={closeDetailModal}
                  className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
                  title="Kapat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* İçerik Alanı - Kaydırılabilir */}
            <div className="flex-1 overflow-y-auto custom-scrollbar-detail">
              <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
                
                {/* Başlık Kartı */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                        {currentAnnouncement.title}
                      </h2>
                      
                      {/* Meta Bilgiler */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {currentAnnouncement.courseName && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {currentAnnouncement.courseName}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {currentAnnouncement.date}
                          </span>
                        </div>
                        
                        {currentAnnouncement.author && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {currentAnnouncement.author}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* İçerik Kartı - Minimal ve Temiz */}
                {currentAnnouncement.content && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                      <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-base">
                        {currentAnnouncement.content.split('\n').map((line, idx) => (
                          line.trim() ? (
                            <p key={idx} className="mb-4 first:mt-0 last:mb-0">
                              {line}
                            </p>
                          ) : (
                            <div key={idx} className="h-3"></div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Alt Bar - Sabit */}
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">
                    {detailAnnouncementIndex! + 1}
                  </span>
                  {' / '}
                  <span>{announcements.length}</span>
                  {' duyuru'}
                </div>
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Kapat
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.4);
          border-radius: 2px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.6);
        }

        .custom-scrollbar-detail::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar-detail::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.2);
        }
        .custom-scrollbar-detail::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar-detail::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

