import { Course } from '../types'

interface CourseCardProps {
  course: Course
  isSelected: boolean
  onClick: () => void
}

export function CourseCard({ course, isSelected, onClick }: CourseCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
        isSelected
          ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500 shadow-md'
          : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
            {course.code}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {course.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {course.term}
          </p>
        </div>
        
        {isSelected && (
          <div className="ml-3">
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
















