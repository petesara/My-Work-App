import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import AddCandidatePanel from './AddCandidatePanel'

// ─── Status styles (mirrors StatusBadge) ────────────────────────────────────
const STATUS_STYLES = {
  Pending:         { color: '#92400E', background: '#FEF3C7', border: '#F59E0B' },
  Hired:           { color: '#065F46', background: '#D1FAE5', border: '#10B981' },
  Rejected:        { color: '#991B1B', background: '#FEE2E2', border: '#EF4444' },
  'No Show':       { color: '#374151', background: '#F3F4F6', border: '#9CA3AF' },
  'Follow-up':     { color: '#1E40AF', background: '#DBEAFE', border: '#3B82F6' },
  '2nd Interview': { color: '#5B21B6', background: '#EDE9FE', border: '#8B5CF6' },
}

const STATUSES = ['Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview']

// ─── Helper functions ────────────────────────────────────────────────────────
function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day // shift so Monday=0
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getMonthGrid(date) {
  // Returns 6 weeks (42 Date objects) starting from Monday before/on 1st of month
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const start = getWeekStart(firstOfMonth)
  const grid = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    grid.push(d)
  }
  return grid
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function addWeeks(date, n) {
  return addDays(date, n * 7)
}

function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

// ─── Inline StatusBadge for calendar (no external import to avoid duplication issues) ─
function CalStatusBadge({ status, lang, onStatusChange, readonly = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const st = STATUS_STYLES[status] || STATUS_STYLES['Pending']

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={(e) => { if (!readonly) { e.stopPropagation(); setOpen(o => !o) } }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
          color: st.color, background: st.background,
          border: `1px solid ${st.border}40`,
          cursor: readonly ? 'default' : 'pointer', userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {t(status, lang)}
        {!readonly && <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>▾</span>}
      </span>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: 'white', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #E5E7EB', padding: '4px 0', minWidth: 150, zIndex: 9999,
        }}>
          {STATUSES.map(s => {
            const sst = STATUS_STYLES[s]
            return (
              <button
                key={s}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  if (onStatusChange) onStatusChange(s)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '6px 12px',
                  background: s === status ? '#F9FAFB' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.background = s === status ? '#F9FAFB' : 'transparent')}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: sst.border, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: '0.78rem', color: sst.color, fontWeight: s === status ? 700 : 400 }}>{t(s, lang)}</span>
                {s === status && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#9CA3AF' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Week card ───────────────────────────────────────────────────────────────
function WeekCard({ candidate, lang, updateCandidate, onEdit }) {
  const [note, setNote] = useState(candidate.calendarNote || '')

  useEffect(() => {
    setNote(candidate.calendarNote || '')
  }, [candidate.calendarNote])

  const st = STATUS_STYLES[candidate.status] || STATUS_STYLES['Pending']

  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB', borderRadius: 8,
      padding: '10px 10px 8px', marginBottom: 8,
      borderLeft: `3px solid ${st.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Name + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 5 }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111827', lineHeight: 1.3 }}>
          {candidate.firstName} {candidate.lastName}
        </div>
        <CalStatusBadge
          status={candidate.status || 'Pending'}
          lang={lang}
          onStatusChange={(s) => updateCandidate(candidate.id, { status: s })}
        />
      </div>

      {/* Source */}
      {candidate.source && (
        <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: 4 }}>{candidate.source}</div>
      )}

      {/* Tags row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {/* Office / Region */}
        {candidate.officeCode ? (
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', padding: '1px 5px', borderRadius: 3 }}>
            {candidate.officeCode}
          </span>
        ) : candidate.region ? (
          <span style={{ fontSize: '0.65rem', color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3 }}>
            {candidate.region}
          </span>
        ) : null}

        {/* Language */}
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, padding: '1px 5px', borderRadius: 3,
          background: candidate.languagePreference === 'FR' ? '#DBEAFE' : '#F3F4F6',
          color: candidate.languagePreference === 'FR' ? '#1E40AF' : '#374151',
        }}>
          {candidate.languagePreference || 'EN'}
        </span>

        {/* Rehire */}
        {candidate.isRehire && (
          <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: '#FEF3C7', color: '#92400E' }}>
            {lang === 'FR' ? 'Réembauche' : 'Rehire'}
          </span>
        )}
      </div>

      {/* Calendar note */}
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        onBlur={() => updateCandidate(candidate.id, { calendarNote: note })}
        placeholder={lang === 'FR' ? 'Ajouter une note...' : 'Add note...'}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid #E5E7EB', borderRadius: 5,
          padding: '4px 8px', fontSize: '0.7rem',
          fontFamily: 'IBM Plex Sans, sans-serif',
          color: '#374151', outline: 'none',
          marginBottom: 6,
        }}
        onClick={e => e.stopPropagation()}
      />

      {/* Edit button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(candidate.id) }}
        style={{
          fontSize: '0.68rem', padding: '3px 10px', borderRadius: 5,
          border: '1px solid #E5E7EB', background: 'white',
          color: '#374151', cursor: 'pointer', fontWeight: 500,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        {t('edit', lang)}
      </button>
    </div>
  )
}

// ─── Day card (full info) ────────────────────────────────────────────────────
function DayCard({ candidate, lang, updateCandidate, onEdit }) {
  const [note, setNote] = useState(candidate.calendarNote || '')
  const st = STATUS_STYLES[candidate.status] || STATUS_STYLES['Pending']

  useEffect(() => {
    setNote(candidate.calendarNote || '')
  }, [candidate.calendarNote])

  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
      padding: '16px', marginBottom: 12,
      borderLeft: `4px solid ${st.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
            {candidate.firstName} {candidate.lastName}
            {candidate.preferredName && (
              <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.85rem' }}> ({candidate.preferredName})</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            {candidate.phone && (
              <span style={{ fontSize: '0.75rem', color: '#374151', fontFamily: 'IBM Plex Mono, monospace' }}>{candidate.phone}</span>
            )}
            {candidate.email && (
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{candidate.email}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <CalStatusBadge
            status={candidate.status || 'Pending'}
            lang={lang}
            onStatusChange={(s) => updateCandidate(candidate.id, { status: s })}
          />
          <span style={{
            fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 4,
            background: candidate.languagePreference === 'FR' ? '#DBEAFE' : '#F3F4F6',
            color: candidate.languagePreference === 'FR' ? '#1E40AF' : '#374151',
          }}>
            {candidate.languagePreference || 'EN'}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10, fontSize: '0.78rem' }}>
        {candidate.officeCode && (
          <div>
            <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>{t('officeCode', lang)}</span>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: '#1E40AF' }}>{candidate.officeCode}</div>
          </div>
        )}
        {candidate.manager && (
          <div>
            <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>{t('manager', lang)}</span>
            <div style={{ color: '#111827' }}>{candidate.manager}</div>
          </div>
        )}
        {candidate.charity && (
          <div>
            <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>{t('charity', lang)}</span>
            <div style={{ color: '#111827' }}>{candidate.charity}</div>
          </div>
        )}
        {candidate.region && (
          <div>
            <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>{t('region', lang)}</span>
            <div style={{ color: '#111827' }}>{candidate.region}</div>
          </div>
        )}
        {candidate.availability && (
          <div>
            <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>{t('availability', lang)}</span>
            <div style={{ color: '#111827' }}>{candidate.availability}</div>
          </div>
        )}
        {candidate.day0 && (
          <div>
            <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>{t('day0', lang)}</span>
            <div style={{ color: '#111827', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem' }}>{candidate.day0}</div>
          </div>
        )}
        {candidate.source && (
          <div>
            <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>{t('source', lang)}</span>
            <div style={{ color: '#111827' }}>{candidate.source}</div>
          </div>
        )}
        {candidate.interviewer && (
          <div>
            <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>{t('interviewer', lang)}</span>
            <div style={{ color: '#111827' }}>{candidate.interviewer}</div>
          </div>
        )}
      </div>

      {/* Rehire / Payroll row */}
      {(candidate.isRehire || candidate.payrollId) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {candidate.isRehire && (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#92400E' }}>
              {lang === 'FR' ? 'Réembauche' : 'Rehire'}
            </span>
          )}
          {candidate.payrollId && (
            <span style={{ fontSize: '0.72rem', color: '#6B7280', fontFamily: 'IBM Plex Mono, monospace' }}>
              ID: {candidate.payrollId}
            </span>
          )}
        </div>
      )}

      {/* Calendar note */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {lang === 'FR' ? 'Note calendrier' : 'Calendar Note'}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={() => updateCandidate(candidate.id, { calendarNote: note })}
          placeholder={lang === 'FR' ? 'Ajouter une note...' : 'Add note...'}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid #E5E7EB', borderRadius: 6,
            padding: '6px 10px', fontSize: '0.78rem',
            fontFamily: 'IBM Plex Sans, sans-serif',
            color: '#374151', outline: 'none', resize: 'vertical',
          }}
        />
      </div>

      {/* Edit button */}
      <button
        onClick={() => onEdit(candidate.id)}
        style={{
          fontSize: '0.78rem', padding: '6px 16px', borderRadius: 6,
          border: '1px solid #D1D5DB', background: 'white',
          color: '#374151', cursor: 'pointer', fontWeight: 500,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        {lang === 'FR' ? 'Modifier le profil complet' : 'Edit Full Profile'}
      </button>
    </div>
  )
}

// ─── Main Calendar component ─────────────────────────────────────────────────
export default function Calendar() {
  const candidates   = useStore(s => s.candidates)
  const updateCandidate = useStore(s => s.updateCandidate)
  const setOpenAddPanel = useStore(s => s.setOpenAddPanel)
  const openAddPanel = useStore(s => s.openAddPanel)
  const editingCandidateId = useStore(s => s.editingCandidateId)
  const language     = useStore(s => s.language)
  const role         = useStore(s => s.role)

  const [view, setView]       = useState('week')       // 'month' | 'week' | 'day'
  const [baseDate, setBaseDate] = useState(new Date())

  const isFR = language === 'FR'
  const today = new Date()
  const todayStr = toDateStr(today)

  // ── Group candidates by interviewDate ──────────────────────────────────────
  const byDate = {}
  candidates.forEach(c => {
    const d = c.interviewDate
    if (!d) return
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(c)
  })

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = (dir) => {
    if (view === 'month') setBaseDate(d => addMonths(d, dir))
    else if (view === 'week') setBaseDate(d => addWeeks(d, dir))
    else setBaseDate(d => addDays(d, dir))
  }

  const goToday = () => setBaseDate(new Date())

  const goToDay = (date) => {
    setBaseDate(date)
    setView('day')
  }

  // ── Day names ──────────────────────────────────────────────────────────────
  const DAY_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const DAY_SHORT_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const dayShort = isFR ? DAY_SHORT_FR : DAY_SHORT_EN

  // ── Date range label ───────────────────────────────────────────────────────
  const locale = isFR ? 'fr-CA' : 'en-CA'

  let rangeLabel = ''
  if (view === 'month') {
    rangeLabel = baseDate.toLocaleString(locale, { month: 'long', year: 'numeric' })
    // Capitalize first letter
    rangeLabel = rangeLabel.charAt(0).toUpperCase() + rangeLabel.slice(1)
  } else if (view === 'week') {
    const ws = getWeekStart(baseDate)
    const we = addDays(ws, 6)
    const sameMonth = ws.getMonth() === we.getMonth()
    const sameYear  = ws.getFullYear() === we.getFullYear()
    if (sameMonth) {
      rangeLabel = `${ws.toLocaleString(locale, { month: 'long' })} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`
    } else if (sameYear) {
      rangeLabel = `${ws.toLocaleString(locale, { month: 'short' })} ${ws.getDate()} – ${we.toLocaleString(locale, { month: 'short' })} ${we.getDate()}, ${ws.getFullYear()}`
    } else {
      rangeLabel = `${ws.toLocaleString(locale, { month: 'short' })} ${ws.getDate()}, ${ws.getFullYear()} – ${we.toLocaleString(locale, { month: 'short' })} ${we.getDate()}, ${we.getFullYear()}`
    }
    rangeLabel = rangeLabel.charAt(0).toUpperCase() + rangeLabel.slice(1)
  } else {
    rangeLabel = baseDate.toLocaleString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    rangeLabel = rangeLabel.charAt(0).toUpperCase() + rangeLabel.slice(1)
  }

  // ── Shared top bar ─────────────────────────────────────────────────────────
  const btnBase = {
    border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 14px',
    fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500,
    fontFamily: 'IBM Plex Sans, sans-serif',
  }

  const viewBtn = (v) => ({
    ...btnBase,
    background: view === v ? '#CF2B1A' : 'white',
    color: view === v ? 'white' : '#374151',
    border: view === v ? '1px solid #CF2B1A' : '1px solid #E5E7EB',
    fontWeight: view === v ? 700 : 500,
  })

  const canAdd = role === 'recruitment' || role === 'operations'

  // ── MONTH VIEW ─────────────────────────────────────────────────────────────
  const MonthView = () => {
    const grid = getMonthGrid(baseDate)
    const curMonth = baseDate.getMonth()

    return (
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E5E7EB' }}>
          {dayShort.map(d => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Grid cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {grid.map((day, idx) => {
            const ds = toDateStr(day)
            const isToday = ds === todayStr
            const isCurrentMonth = day.getMonth() === curMonth
            const dayCandidates = byDate[ds] || []
            const isLast = idx >= 35

            return (
              <div
                key={ds}
                onClick={() => goToDay(day)}
                style={{
                  minHeight: 90,
                  borderRight: (idx + 1) % 7 !== 0 ? '1px solid #F3F4F6' : 'none',
                  borderBottom: !isLast ? '1px solid #F3F4F6' : 'none',
                  padding: '6px 6px 4px',
                  background: isToday ? '#FFF5F5' : isCurrentMonth ? 'white' : '#FAFAFA',
                  border: isToday ? '1.5px solid #CF2B1A' : undefined,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? '#FFF5F5' : isCurrentMonth ? 'white' : '#FAFAFA' }}
              >
                {/* Date number */}
                <div style={{
                  textAlign: 'right', fontSize: '0.78rem', fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#CF2B1A' : isCurrentMonth ? '#111827' : '#D1D5DB',
                  marginBottom: 4,
                }}>
                  {day.getDate()}
                </div>

                {/* Interview count badge */}
                {dayCandidates.length > 0 && (
                  <div style={{ marginBottom: 3 }}>
                    <span style={{
                      background: '#CF2B1A', color: 'white', borderRadius: 20,
                      fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px',
                    }}>
                      {dayCandidates.length}
                    </span>
                  </div>
                )}

                {/* First 2 names */}
                {dayCandidates.slice(0, 2).map(c => (
                  <div key={c.id} style={{
                    fontSize: '0.65rem', color: '#374151', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 1,
                    fontWeight: 500,
                  }}>
                    {c.firstName} {c.lastName}
                  </div>
                ))}
                {dayCandidates.length > 2 && (
                  <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: 1 }}>
                    +{dayCandidates.length - 2} {isFR ? 'autres' : 'more'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── WEEK VIEW ──────────────────────────────────────────────────────────────
  const WeekView = () => {
    const ws = getWeekStart(baseDate)
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {days.map((day, i) => {
          const ds = toDateStr(day)
          const isToday = ds === todayStr
          const dayCandidates = byDate[ds] || []

          return (
            <div key={ds} style={{
              borderRight: i < 6 ? '1px solid #E5E7EB' : 'none',
              display: 'flex', flexDirection: 'column',
              minHeight: 480,
            }}>
              {/* Column header */}
              <div style={{
                padding: '8px 6px',
                borderBottom: '1px solid #E5E7EB',
                textAlign: 'center',
                background: isToday ? '#FFF5F5' : '#F9FAFB',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: '0.65rem', color: isToday ? '#CF2B1A' : '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {dayShort[i]}
                </div>
                <div style={{
                  fontSize: '0.95rem', fontWeight: isToday ? 800 : 500,
                  color: isToday ? '#CF2B1A' : '#374151', marginTop: 1,
                }}>
                  {day.getDate()}
                </div>
                {dayCandidates.length > 0 && (
                  <div style={{ marginTop: 3 }}>
                    <span style={{ background: '#CF2B1A', color: 'white', borderRadius: 20, fontSize: '0.55rem', fontWeight: 700, padding: '1px 5px' }}>
                      {dayCandidates.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
                {dayCandidates.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#D1D5DB', fontSize: '0.7rem', marginTop: 24 }}>
                    {isFR ? 'Aucune entrevue' : 'No interviews'}
                  </div>
                ) : (
                  dayCandidates.map(c => (
                    <WeekCard
                      key={c.id}
                      candidate={c}
                      lang={language}
                      updateCandidate={updateCandidate}
                      onEdit={(id) => setOpenAddPanel(true, id)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── DAY VIEW ───────────────────────────────────────────────────────────────
  const DayView = () => {
    const ds = toDateStr(baseDate)
    const dayCandidates = byDate[ds] || []

    return (
      <div>
        {/* Add candidate button at top */}
        {canAdd && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setOpenAddPanel(true)}
              style={{
                background: '#CF2B1A', color: 'white', border: 'none', borderRadius: 8,
                padding: '8px 18px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#B02516')}
              onMouseLeave={e => (e.currentTarget.style.background = '#CF2B1A')}
            >
              + {t('addCandidate', language)}
            </button>
          </div>
        )}

        {dayCandidates.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 10, border: '1px solid #E5E7EB',
            padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem',
          }}>
            {isFR ? 'Aucune entrevue planifiée pour cette journée.' : 'No interviews scheduled for this day.'}
          </div>
        ) : (
          dayCandidates.map(c => (
            <DayCard
              key={c.id}
              candidate={c}
              lang={language}
              updateCandidate={updateCandidate}
              onEdit={(id) => setOpenAddPanel(true, id)}
            />
          ))
        )}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      {/* Page title */}
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
        {isFR ? 'Calendrier' : 'Calendar'}
      </h1>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, gap: 12, flexWrap: 'wrap',
        background: 'white', borderRadius: 10, border: '1px solid #E5E7EB',
        padding: '12px 16px',
      }}>
        {/* Left: view tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'month', labelEN: 'Month', labelFR: 'Mois' },
            { key: 'week',  labelEN: 'Week',  labelFR: 'Semaine' },
            { key: 'day',   labelEN: 'Day',   labelFR: 'Jour' },
          ].map(({ key, labelEN, labelFR }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              style={viewBtn(key)}
              onMouseEnter={e => { if (view !== key) e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={e => { if (view !== key) e.currentTarget.style.background = 'white' }}
            >
              {isFR ? labelFR : labelEN}
            </button>
          ))}
        </div>

        {/* Center: date label */}
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827', textAlign: 'center', flex: 1, minWidth: 180 }}>
          {rangeLabel}
        </div>

        {/* Right: navigation */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={goToday}
            style={{ ...btnBase, background: 'white', color: '#374151' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            {isFR ? 'Aujourd\'hui' : 'Today'}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{ ...btnBase, background: 'white', color: '#374151', padding: '5px 10px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            ‹ {isFR ? 'Préc' : 'Prev'}
          </button>
          <button
            onClick={() => navigate(1)}
            style={{ ...btnBase, background: 'white', color: '#374151', padding: '5px 10px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            {isFR ? 'Suiv' : 'Next'} ›
          </button>
        </div>
      </div>

      {/* View content */}
      {view === 'month' && <MonthView />}
      {view === 'week'  && <WeekView />}
      {view === 'day'   && <DayView />}

      {/* AddCandidatePanel */}
      {openAddPanel && (
        <AddCandidatePanel
          candidateId={editingCandidateId}
          onClose={() => setOpenAddPanel(false)}
        />
      )}
    </div>
  )
}
