interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md">
        {icon && <div className="mb-4">{icon}</div>}
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>

        {action && (
          <button
            onClick={action.onClick}
            className="btn-primary"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
















