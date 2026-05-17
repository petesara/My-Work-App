import useStore from '../store/useStore'

const TYPE_STYLES = {
  success: 'border-l-4 border-green-500 bg-white',
  error: 'border-l-4 border-red-500 bg-white',
  warning: 'border-l-4 border-amber-500 bg-white',
}

const TYPE_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
}

const TYPE_ICON_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
}

export default function Toast() {
  const toasts = useStore((s) => s.toasts)
  const removeToast = useStore((s) => s.removeToast)

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-sm ${TYPE_STYLES[toast.type] || TYPE_STYLES.success}`}
        >
          <span className={`text-sm font-bold mt-0.5 ${TYPE_ICON_COLORS[toast.type] || TYPE_ICON_COLORS.success}`}>
            {TYPE_ICONS[toast.type] || TYPE_ICONS.success}
          </span>
          <span className="flex-1 text-sm text-gray-800">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 text-sm leading-none ml-2 mt-0.5"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
