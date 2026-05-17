import { useState, useRef, useEffect } from 'react'
import { t } from '../data/translations'

const STATUS_STYLES = {
  Pending: { color: '#92400E', background: '#FEF3C7' },
  Hired: { color: '#065F46', background: '#D1FAE5' },
  Rejected: { color: '#991B1B', background: '#FEE2E2' },
  'No Show': { color: '#374151', background: '#F3F4F6' },
  'Follow-up': { color: '#1E40AF', background: '#DBEAFE' },
  '2nd Interview': { color: '#5B21B6', background: '#EDE9FE' },
}

const STATUSES = ['Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview']

export default function StatusBadge({ status, lang = 'EN', onStatusChange, readonly = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const style = STATUS_STYLES[status] || STATUS_STYLES['Pending']

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
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
    <div ref={ref} className="relative inline-block">
      <span
        onClick={handleClick}
        style={{ color: style.color, background: style.background }}
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium select-none ${!readonly ? 'cursor-pointer hover:opacity-80' : ''}`}
      >
        {t(status, lang)}
        {!readonly && <span className="ml-1 opacity-60">▾</span>}
      </span>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {STATUSES.map((s) => {
            const st = STATUS_STYLES[s]
            return (
              <button
                key={s}
                onClick={(e) => handleSelect(e, s)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2"
              >
                <span style={{ color: st.color, background: st.background }} className="px-1.5 py-0.5 rounded-full text-xs font-medium">
                  {t(s, lang)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
