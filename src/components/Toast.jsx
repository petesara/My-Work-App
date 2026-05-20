import useStore from '../store/useStore'

const TYPES = {
  success: { border: '#2DCDB8', icon: '✓', iconBg: '#E6FAF8', iconColor: '#1AA090' },
  error:   { border: '#F0194A', icon: '✕', iconBg: '#FFE8EE', iconColor: '#C9123A' },
  warning: { border: '#F59E0B', icon: '!', iconBg: '#FEF3C7', iconColor: '#D97706' },
}

export default function Toast() {
  const toasts = useStore((s) => s.toasts)
  const removeToast = useStore((s) => s.removeToast)

  if (!toasts.length) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map((toast) => {
        const t = TYPES[toast.type] || TYPES.success
        return (
          <div
            key={toast.id}
            className="toast-item"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px 12px 12px',
              background: 'white',
              border: '1px solid #E8EAF6',
              borderLeft: `4px solid ${t.border}`,
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(30,39,105,0.12)',
              minWidth: 280,
              maxWidth: 360,
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: t.iconColor }}>{t.icon}</span>
            </div>
            <span style={{ flex: 1, fontSize: '0.82rem', color: '#111827', fontWeight: 500, lineHeight: 1.4 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0B8CC', fontSize: '1rem', lineHeight: 1, padding: 2, flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#6B7280')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#B0B8CC')}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
