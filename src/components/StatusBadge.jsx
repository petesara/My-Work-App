import { useState, useRef, useEffect } from 'react'
import { t } from '../data/translations'

const STATUS_STYLES = {
  Pending:        { color: '#92400E', background: '#FEF3C7', border: '#F59E0B' },
  Hired:          { color: '#065F46', background: '#D1FAE5', border: '#10B981' },
  Rejected:       { color: '#991B1B', background: '#FFD6E0', border: '#EF4444' },
  'No Show':      { color: '#374151', background: '#F3F4F6', border: '#9CA3AF' },
  'Follow-up':    { color: '#1E40AF', background: '#DBEAFE', border: '#3B82F6' },
  '2nd Interview':{ color: '#5B21B6', background: '#EDE9FE', border: '#8B5CF6' },
}

const STATUSES = ['Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview']

export default function StatusBadge({ status, lang = 'EN', onStatusChange, readonly = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const style = STATUS_STYLES[status] || STATUS_STYLES['Pending']

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleClick = (e) => {
    if (readonly) return
    e.stopPropagation()
    setOpen((o) => !o)
  }

  const handleSelect = (e, s) => {
    e.stopPropagation()
    setOpen(false)
    if (onStatusChange) onStatusChange(s)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 9px',
          borderRadius: 20,
          fontSize: '0.72rem',
          fontWeight: 600,
          color: style.color,
          background: style.background,
          border: `1px solid ${style.border}40`,
          cursor: readonly ? 'default' : 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { if (!readonly) e.currentTarget.style.opacity = '0.8' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        {t(status, lang)}
        {!readonly && (
          <span style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: 1 }}>▾</span>
        )}
      </span>

      {open && (
        <div style={{
          position: 'fixed',
          zIndex: 9999,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #E5E7EB',
          padding: '4px 0',
          minWidth: 160,
          // Position is set via JS below since we're using fixed
        }} ref={(el) => {
          if (el && ref.current) {
            const badge = ref.current.getBoundingClientRect()
            el.style.top = (badge.bottom + 4) + 'px'
            el.style.left = badge.left + 'px'
          }
        }}>
          {STATUSES.map((s) => {
            const st = STATUS_STYLES[s]
            const isActive = s === status
            return (
              <button
                key={s}
                onMouseDown={(e) => handleSelect(e, s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '7px 12px',
                  background: isActive ? '#F9FAFB' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = isActive ? '#F9FAFB' : 'transparent')}
              >
                <span style={{
                  display: 'inline-block',
                  width: 8, height: 8, borderRadius: '50%',
                  background: st.border, flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.8rem', color: st.color, fontWeight: isActive ? 700 : 400 }}>
                  {t(s, lang)}
                </span>
                {isActive && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#9CA3AF' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
