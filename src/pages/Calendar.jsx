import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import { OFFICES, REGIONS } from '../data/offices'
import AddCandidatePanel from './AddCandidatePanel'

// ─── Status styles ────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Pending:         { color: '#92400E', background: '#FEF3C7', border: '#F59E0B' },
  Hired:           { color: '#065F46', background: '#D1FAE5', border: '#10B981' },
  Rejected:        { color: '#991B1B', background: '#FFD6E0', border: '#EF4444' },
  'No Show':       { color: '#374151', background: '#F3F4F6', border: '#9CA3AF' },
  'Follow-up':     { color: '#1E40AF', background: '#DBEAFE', border: '#3B82F6' },
  '2nd Interview': { color: '#5B21B6', background: '#EDE9FE', border: '#8B5CF6' },
}
const STATUSES = ['Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview']

const REGION_COLORS = {
  SON:    { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  EAST:   { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  BC:     { bg: '#FDF4FF', color: '#6B21A8', border: '#E9D5FF' },
  QC:     { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
  PHONES: { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateStr(date) { return date.toISOString().slice(0, 10) }

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function getMonthGrid(date) {
  const start = getWeekStart(new Date(date.getFullYear(), date.getMonth(), 1))
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
}

function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
function addWeeks(date, n) { return addDays(date, n * 7) }
function addMonths(date, n) { const d = new Date(date); d.setMonth(d.getMonth() + n); return d }

// ─── Inline status badge ──────────────────────────────────────────────────────
function CalStatusBadge({ status, onStatusChange, readonly = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const st = STATUS_STYLES[status] || STATUS_STYLES['Pending']

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={(e) => { if (!readonly) { e.stopPropagation(); setOpen(o => !o) } }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
          color: st.color, background: st.background, border: `1px solid ${st.border}40`,
          cursor: readonly ? 'default' : 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
        }}
      >
        {status}
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
              <button key={s}
                onMouseDown={(e) => { e.stopPropagation(); setOpen(false); onStatusChange?.(s) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '6px 12px', background: s === status ? '#F9FAFB' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.background = s === status ? '#F9FAFB' : 'transparent')}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: sst.border, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: '0.78rem', color: sst.color, fontWeight: s === status ? 700 : 400 }}>{s}</span>
                {s === status && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#9CA3AF' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Office Setup panel ───────────────────────────────────────────────────────
function OfficeSetup({ assignedOffices, setAssignedOffices, isFR }) {
  const [open, setOpen] = useState(assignedOffices.length === 0)
  const [search, setSearch] = useState('')

  const grouped = REGIONS.reduce((acc, r) => {
    acc[r] = OFFICES.filter(o => o.region === r && (
      !search ||
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.manager.toLowerCase().includes(search.toLowerCase())
    ))
    return acc
  }, {})

  const toggle = (code) => {
    setAssignedOffices(
      assignedOffices.includes(code)
        ? assignedOffices.filter(c => c !== code)
        : [...assignedOffices, code]
    )
  }

  const selectAll = () => setAssignedOffices(OFFICES.map(o => o.code))
  const clearAll  = () => setAssignedOffices([])

  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
            ◷ {isFR ? 'Mes bureaux' : 'My Offices'}
          </span>
          {assignedOffices.length > 0 ? (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F0194A', color: 'white' }}>
              {assignedOffices.length} {isFR ? 'sélectionné(s)' : 'selected'}
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
              {isFR ? 'Aucun sélectionné — affichage de tous les candidats' : 'None selected — showing all candidates'}
            </span>
          )}
        </div>
        <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #F3F4F6', padding: 16 }}>
          {/* Search + bulk actions */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isFR ? 'Rechercher bureau, manager...' : 'Search office, manager...'}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.78rem', outline: 'none' }}
            />
            <button onClick={selectAll} style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: 5, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}>
              {isFR ? 'Tout' : 'All'}
            </button>
            <button onClick={clearAll} style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: 5, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}>
              {isFR ? 'Aucun' : 'None'}
            </button>
          </div>

          {/* Region groups */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {REGIONS.map(region => {
              const offices = grouped[region]
              if (!offices || offices.length === 0) return null
              const rc = REGION_COLORS[region] || REGION_COLORS.SON
              return (
                <div key={region} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: rc.color, background: rc.bg, padding: '3px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 6, border: `1px solid ${rc.border}` }}>
                    {region}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {offices.map(o => {
                      const selected = assignedOffices.includes(o.code)
                      return (
                        <button
                          key={o.code}
                          onClick={() => toggle(o.code)}
                          title={`${o.name} · ${o.manager}`}
                          style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: selected ? 700 : 500,
                            cursor: 'pointer', userSelect: 'none',
                            background: selected ? '#F0194A' : '#F9FAFB',
                            color: selected ? 'white' : '#374151',
                            border: selected ? '1px solid #F0194A' : '1px solid #E5E7EB',
                            fontFamily: 'IBM Plex Mono, monospace',
                          }}
                        >
                          {o.code}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 8, fontSize: '0.7rem', color: '#9CA3AF' }}>
            {isFR
              ? 'Sélectionnez les bureaux dont vous êtes responsable. Les entrevues seront filtrées en conséquence.'
              : 'Select the offices you manage. Interview views will be filtered accordingly.'}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Week card (compact) ───────────────────────────────────────────────────────
function WeekCard({ candidate, updateCandidate, onEdit }) {
  const [note, setNote] = useState(candidate.calendarNote || '')

  useEffect(() => { setNote(candidate.calendarNote || '') }, [candidate.calendarNote])

  const st = STATUS_STYLES[candidate.status] || STATUS_STYLES['Pending']

  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB', borderRadius: 8,
      padding: '10px 10px 8px', marginBottom: 8,
      borderLeft: `3px solid ${st.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 5 }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111827', lineHeight: 1.3 }}>
          {candidate.firstName} {candidate.lastName}
        </div>
        <CalStatusBadge status={candidate.status || 'Pending'} onStatusChange={(s) => updateCandidate(candidate.id, { status: s })} />
      </div>

      {candidate.source && (
        <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: 4 }}>{candidate.source}</div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {candidate.officeCode ? (
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', padding: '1px 5px', borderRadius: 3 }}>
            {candidate.officeCode}
          </span>
        ) : candidate.region ? (
          <span style={{ fontSize: '0.65rem', color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3 }}>
            {candidate.region}
          </span>
        ) : null}
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, padding: '1px 5px', borderRadius: 3,
          background: candidate.languagePreference === 'FR' ? '#DBEAFE' : '#F3F4F6',
          color: candidate.languagePreference === 'FR' ? '#1E40AF' : '#374151',
        }}>
          {candidate.languagePreference || 'EN'}
        </span>
        {candidate.isRehire && (
          <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: '#FEF3C7', color: '#92400E' }}>
            R
          </span>
        )}
      </div>

      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        onBlur={() => updateCandidate(candidate.id, { calendarNote: note })}
        placeholder="Add note..."
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid #E5E7EB', borderRadius: 5,
          padding: '4px 8px', fontSize: '0.7rem',
          fontFamily: 'IBM Plex Sans, sans-serif',
          color: '#374151', outline: 'none', marginBottom: 6,
        }}
        onClick={e => e.stopPropagation()}
      />

      <button
        onClick={(e) => { e.stopPropagation(); onEdit(candidate.id) }}
        style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: 5, border: '1px solid #E5E7EB', background: 'white', color: '#374151', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        Edit
      </button>
    </div>
  )
}

// ─── Day card (full info, used in "All" day view) ─────────────────────────────
function DayCard({ candidate, updateCandidate, onEdit, isFR }) {
  const [note, setNote] = useState(candidate.calendarNote || '')
  const st = STATUS_STYLES[candidate.status] || STATUS_STYLES['Pending']

  useEffect(() => { setNote(candidate.calendarNote || '') }, [candidate.calendarNote])

  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
      padding: '14px 16px', marginBottom: 10,
      borderLeft: `4px solid ${st.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
            {candidate.firstName} {candidate.lastName}
            {candidate.preferredName && <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.82rem' }}> ({candidate.preferredName})</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {candidate.phone && <span style={{ fontSize: '0.75rem', color: '#374151', fontFamily: 'IBM Plex Mono, monospace' }}>{candidate.phone}</span>}
            {candidate.email && <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{candidate.email}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <CalStatusBadge status={candidate.status || 'Pending'} onStatusChange={(s) => updateCandidate(candidate.id, { status: s })} />
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4,
            background: candidate.languagePreference === 'FR' ? '#DBEAFE' : '#F3F4F6',
            color: candidate.languagePreference === 'FR' ? '#1E40AF' : '#374151',
          }}>
            {candidate.languagePreference || 'EN'}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 16px', marginBottom: 8, fontSize: '0.78rem' }}>
        {candidate.source && <div><span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>Source</span><div style={{ color: '#111827' }}>{candidate.source}</div></div>}
        {candidate.interviewer && <div><span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>Interviewer</span><div style={{ color: '#111827' }}>{candidate.interviewer}</div></div>}
        {candidate.charity && <div><span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>Charity</span><div style={{ color: '#111827' }}>{candidate.charity}</div></div>}
        {candidate.availability && <div><span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>Availability</span><div style={{ color: '#111827' }}>{candidate.availability}</div></div>}
        {candidate.day0 && <div><span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>Day 0</span><div style={{ color: '#111827', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem' }}>{candidate.day0}</div></div>}
        {candidate.manager && <div><span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>Manager</span><div style={{ color: '#111827' }}>{candidate.manager}</div></div>}
      </div>

      {(candidate.isRehire || candidate.payrollId) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {candidate.isRehire && <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#FEF3C7', color: '#92400E' }}>{isFR ? 'Réembauche' : 'Rehire'}</span>}
          {candidate.payrollId && <span style={{ fontSize: '0.72rem', color: '#6B7280', fontFamily: 'IBM Plex Mono, monospace' }}>ID: {candidate.payrollId}</span>}
        </div>
      )}

      {/* Note */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {isFR ? 'Note calendrier' : 'Calendar Note'}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={() => updateCandidate(candidate.id, { calendarNote: note })}
          placeholder={isFR ? 'Ajouter une note...' : 'Add note...'}
          rows={2}
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 10px', fontSize: '0.78rem', fontFamily: 'IBM Plex Sans, sans-serif', color: '#374151', outline: 'none', resize: 'vertical' }}
        />
      </div>

      <button
        onClick={() => onEdit(candidate.id)}
        style={{ fontSize: '0.78rem', padding: '6px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        {isFR ? 'Modifier le profil complet' : 'Edit Full Profile'}
      </button>
    </div>
  )
}

// ─── Office section header (used in grouped day view) ─────────────────────────
function OfficeSectionHeader({ officeCode, candidates, isFR }) {
  const officeData = OFFICES.find(o => o.code === officeCode)
  const rc = officeData ? (REGION_COLORS[officeData.region] || REGION_COLORS.SON) : REGION_COLORS.SON

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '10px 14px', borderRadius: 8, marginBottom: 8,
      background: rc.bg, border: `1px solid ${rc.border}`,
    }}>
      {/* Office code */}
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 800, fontSize: '0.85rem', color: rc.color }}>
        {officeCode || (isFR ? 'Non assigné' : 'Unassigned')}
      </span>

      {officeData && (
        <>
          <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>
            {officeData.name}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>·</span>
          <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>
            {isFR ? 'Gestionnaire' : 'Manager'}: {officeData.manager}
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
            {officeData.region}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>·</span>
          <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{officeData.medium}</span>
        </>
      )}

      {/* Count */}
      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: rc.color, background: 'white', padding: '2px 8px', borderRadius: 20, border: `1px solid ${rc.border}` }}>
        {candidates.length} {isFR ? 'entrevue(s)' : candidates.length === 1 ? 'interview' : 'interviews'}
      </span>
    </div>
  )
}

// ─── Region section header ────────────────────────────────────────────────────
function RegionSectionHeader({ region, candidates, isFR }) {
  const rc = REGION_COLORS[region] || REGION_COLORS.SON
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 8, marginBottom: 8,
      background: rc.bg, border: `1px solid ${rc.border}`,
    }}>
      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: rc.color }}>{region || (isFR ? 'Sans région' : 'No Region')}</span>
      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: rc.color, background: 'white', padding: '2px 8px', borderRadius: 20, border: `1px solid ${rc.border}` }}>
        {candidates.length} {isFR ? 'entrevue(s)' : candidates.length === 1 ? 'interview' : 'interviews'}
      </span>
    </div>
  )
}

// ─── Compact day card (for grouped view with many cards) ──────────────────────
function CompactDayCard({ candidate, updateCandidate, onEdit, isFR }) {
  const [note, setNote] = useState(candidate.calendarNote || '')
  const [expanded, setExpanded] = useState(false)
  const st = STATUS_STYLES[candidate.status] || STATUS_STYLES['Pending']

  useEffect(() => { setNote(candidate.calendarNote || '') }, [candidate.calendarNote])

  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB', borderRadius: 8,
      marginBottom: 8, borderLeft: `3px solid ${st.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Collapsed row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer' }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.border, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#111827' }}>
            {candidate.firstName} {candidate.lastName}
          </span>
          {candidate.preferredName && (
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: 6 }}>({candidate.preferredName})</span>
          )}
          {candidate.phone && (
            <span style={{ fontSize: '0.72rem', color: '#6B7280', fontFamily: 'IBM Plex Mono, monospace', marginLeft: 10 }}>{candidate.phone}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
          {candidate.isRehire && (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#FEF3C7', color: '#92400E' }}>R</span>
          )}
          {candidate.languagePreference === 'FR' && (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#DBEAFE', color: '#1E40AF' }}>FR</span>
          )}
          <CalStatusBadge
            status={candidate.status || 'Pending'}
            onStatusChange={(s) => { updateCandidate(candidate.id, { status: s }) }}
          />
          <span style={{ color: '#9CA3AF', fontSize: '0.7rem', marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 16px', fontSize: '0.76rem', margin: '10px 0' }}>
            {candidate.email && <div><span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>Email</span><div style={{ color: '#374151' }}>{candidate.email}</div></div>}
            {candidate.source && <div><span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>Source</span><div style={{ color: '#374151' }}>{candidate.source}</div></div>}
            {candidate.interviewer && <div><span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>Interviewer</span><div style={{ color: '#374151' }}>{candidate.interviewer}</div></div>}
            {candidate.charity && <div><span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>Charity</span><div style={{ color: '#374151' }}>{candidate.charity}</div></div>}
            {candidate.availability && <div><span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>Availability</span><div style={{ color: '#374151' }}>{candidate.availability}</div></div>}
            {candidate.day0 && <div><span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>Day 0</span><div style={{ color: '#374151', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.72rem' }}>{candidate.day0}</div></div>}
            {candidate.payrollId && <div><span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>Payroll ID</span><div style={{ color: '#374151', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.72rem' }}>{candidate.payrollId}</div></div>}
          </div>

          <div style={{ marginBottom: 8 }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => updateCandidate(candidate.id, { calendarNote: note })}
              placeholder={isFR ? 'Note calendrier...' : 'Calendar note...'}
              rows={2}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 5, padding: '5px 8px', fontSize: '0.74rem', fontFamily: 'IBM Plex Sans, sans-serif', color: '#374151', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onEdit(candidate.id) }}
            style={{ fontSize: '0.72rem', padding: '4px 12px', borderRadius: 5, border: '1px solid #D1D5DB', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            {isFR ? 'Modifier le profil' : 'Edit Profile'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Calendar ─────────────────────────────────────────────────────────────
export default function Calendar() {
  const candidates      = useStore(s => s.candidates)
  const updateCandidate = useStore(s => s.updateCandidate)
  const setOpenAddPanel = useStore(s => s.setOpenAddPanel)
  const openAddPanel    = useStore(s => s.openAddPanel)
  const editingCandidateId = useStore(s => s.editingCandidateId)
  const language        = useStore(s => s.language)
  const role            = useStore(s => s.role)
  const assignedOffices = useStore(s => s.assignedOffices)
  const setAssignedOffices = useStore(s => s.setAssignedOffices)

  const [view, setView]       = useState('week')
  const [baseDate, setBaseDate] = useState(new Date())
  const [groupBy, setGroupBy] = useState('office') // 'office' | 'region'
  const [dayViewMode, setDayViewMode] = useState('grouped') // 'grouped' | 'all'

  const isFR    = language === 'FR'
  const isOps   = role === 'operations'
  const todayStr = toDateStr(new Date())

  // ── Filter candidates for ops ──────────────────────────────────────────────
  const visibleCandidates = isOps && assignedOffices.length > 0
    ? candidates.filter(c => assignedOffices.includes(c.officeCode))
    : candidates

  // ── Group by date ──────────────────────────────────────────────────────────
  const byDate = {}
  visibleCandidates.forEach(c => {
    if (!c.interviewDate) return
    if (!byDate[c.interviewDate]) byDate[c.interviewDate] = []
    byDate[c.interviewDate].push(c)
  })

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = (dir) => {
    if (view === 'month') setBaseDate(d => addMonths(d, dir))
    else if (view === 'week') setBaseDate(d => addWeeks(d, dir))
    else setBaseDate(d => addDays(d, dir))
  }

  const goToDay = (date) => { setBaseDate(date); setView('day') }

  // ── Day names ──────────────────────────────────────────────────────────────
  const DAY_SHORT = isFR
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // ── Range label ────────────────────────────────────────────────────────────
  const locale = isFR ? 'fr-CA' : 'en-CA'
  let rangeLabel = ''
  if (view === 'month') {
    rangeLabel = baseDate.toLocaleString(locale, { month: 'long', year: 'numeric' })
  } else if (view === 'week') {
    const ws = getWeekStart(baseDate)
    const we = addDays(ws, 6)
    const sameMonth = ws.getMonth() === we.getMonth()
    if (sameMonth) {
      rangeLabel = `${ws.toLocaleString(locale, { month: 'long' })} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`
    } else {
      rangeLabel = `${ws.toLocaleString(locale, { month: 'short' })} ${ws.getDate()} – ${we.toLocaleString(locale, { month: 'short' })} ${we.getDate()}, ${ws.getFullYear()}`
    }
  } else {
    rangeLabel = baseDate.toLocaleString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }
  rangeLabel = rangeLabel.charAt(0).toUpperCase() + rangeLabel.slice(1)

  const btnBase = {
    border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 14px',
    fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500,
    fontFamily: 'IBM Plex Sans, sans-serif',
  }

  const viewBtn = (v) => ({
    ...btnBase,
    background: view === v ? '#F0194A' : 'white',
    color: view === v ? 'white' : '#374151',
    border: view === v ? '1px solid #F0194A' : '1px solid #E5E7EB',
    fontWeight: view === v ? 700 : 500,
  })

  // ── MONTH VIEW ─────────────────────────────────────────────────────────────
  const MonthView = () => {
    const grid = getMonthGrid(baseDate)
    const curMonth = baseDate.getMonth()

    return (
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E5E7EB' }}>
          {DAY_SHORT.map(d => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {grid.map((day, idx) => {
            const ds = toDateStr(day)
            const isToday = ds === todayStr
            const isCurrentMonth = day.getMonth() === curMonth
            const dayCandidates = byDate[ds] || []

            return (
              <div
                key={ds}
                onClick={() => goToDay(day)}
                style={{
                  minHeight: 90,
                  borderRight: (idx + 1) % 7 !== 0 ? '1px solid #F3F4F6' : 'none',
                  borderBottom: idx < 35 ? '1px solid #F3F4F6' : 'none',
                  padding: '6px 6px 4px',
                  background: isToday ? '#FFF0F5' : isCurrentMonth ? 'white' : '#FAFAFA',
                  outline: isToday ? '2px solid #F0194A' : 'none',
                  outlineOffset: '-2px',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? '#FFF0F5' : isCurrentMonth ? 'white' : '#FAFAFA' }}
              >
                <div style={{ textAlign: 'right', fontSize: '0.78rem', fontWeight: isToday ? 700 : 400, color: isToday ? '#F0194A' : isCurrentMonth ? '#111827' : '#D1D5DB', marginBottom: 4 }}>
                  {day.getDate()}
                </div>
                {dayCandidates.length > 0 && (
                  <div style={{ marginBottom: 3 }}>
                    <span style={{ background: '#F0194A', color: 'white', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px' }}>
                      {dayCandidates.length}
                    </span>
                  </div>
                )}
                {dayCandidates.slice(0, 2).map(c => (
                  <div key={c.id} style={{ fontSize: '0.65rem', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 1, fontWeight: 500 }}>
                    {c.firstName} {c.lastName}
                  </div>
                ))}
                {dayCandidates.length > 2 && (
                  <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: 1 }}>+{dayCandidates.length - 2} {isFR ? 'autres' : 'more'}</div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {days.map((day, i) => {
          const ds = toDateStr(day)
          const isToday = ds === todayStr
          const dayCandidates = byDate[ds] || []

          return (
            <div key={ds} style={{ borderRight: i < 6 ? '1px solid #E5E7EB' : 'none', display: 'flex', flexDirection: 'column', minHeight: 480 }}>
              <div
                onClick={() => goToDay(day)}
                style={{ padding: '8px 6px', borderBottom: '1px solid #E5E7EB', textAlign: 'center', background: isToday ? '#FFF0F5' : '#F9FAFB', flexShrink: 0, cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.65rem', color: isToday ? '#F0194A' : '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{DAY_SHORT[i]}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: isToday ? 800 : 500, color: isToday ? '#F0194A' : '#374151', marginTop: 1 }}>{day.getDate()}</div>
                {dayCandidates.length > 0 && (
                  <div style={{ marginTop: 3 }}>
                    <span style={{ background: '#F0194A', color: 'white', borderRadius: 20, fontSize: '0.55rem', fontWeight: 700, padding: '1px 5px' }}>
                      {dayCandidates.length}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
                {dayCandidates.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#D1D5DB', fontSize: '0.7rem', marginTop: 24 }}>
                    {isFR ? 'Aucune entrevue' : 'No interviews'}
                  </div>
                ) : (
                  dayCandidates.map(c => (
                    <WeekCard key={c.id} candidate={c} updateCandidate={updateCandidate} onEdit={(id) => setOpenAddPanel(true, id)} />
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

    // Grouped by office
    const groupedByOffice = {}
    dayCandidates.forEach(c => {
      const key = c.officeCode || '__none__'
      if (!groupedByOffice[key]) groupedByOffice[key] = []
      groupedByOffice[key].push(c)
    })

    // Grouped by region
    const groupedByRegion = {}
    dayCandidates.forEach(c => {
      const key = c.region || '__none__'
      if (!groupedByRegion[key]) groupedByRegion[key] = []
      groupedByRegion[key].push(c)
    })

    // Sort offices: assigned ones first (if ops), then alphabetically
    const officeKeys = Object.keys(groupedByOffice).sort((a, b) => {
      if (a === '__none__') return 1
      if (b === '__none__') return -1
      const aAssigned = assignedOffices.includes(a)
      const bAssigned = assignedOffices.includes(b)
      if (aAssigned && !bAssigned) return -1
      if (!aAssigned && bAssigned) return 1
      return a.localeCompare(b)
    })

    const regionKeys = Object.keys(groupedByRegion).sort((a, b) => {
      if (a === '__none__') return 1
      if (b === '__none__') return -1
      return a.localeCompare(b)
    })

    return (
      <div>
        {/* Day view controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {dayCandidates.length > 0 && (
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
                {dayCandidates.length} {isFR ? 'entrevue(s)' : dayCandidates.length === 1 ? 'interview' : 'interviews'}
                {isOps && assignedOffices.length > 0 && (
                  <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.75rem', marginLeft: 6 }}>
                    ({isFR ? 'vos bureaux' : 'your offices'})
                  </span>
                )}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Group by toggle (only when there are candidates) */}
            {dayCandidates.length > 0 && (
              <>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{isFR ? 'Grouper par:' : 'Group by:'}</span>
                {[
                  { key: 'grouped', label: isFR ? 'Bureau' : 'Office' },
                  { key: 'region',  label: isFR ? 'Région' : 'Region' },
                  { key: 'all',     label: isFR ? 'Tout' : 'All' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setDayViewMode(opt.key)}
                    style={{
                      ...btnBase, padding: '4px 10px',
                      background: dayViewMode === opt.key ? '#111827' : 'white',
                      color: dayViewMode === opt.key ? 'white' : '#374151',
                      border: dayViewMode === opt.key ? '1px solid #111827' : '1px solid #E5E7EB',
                      fontWeight: dayViewMode === opt.key ? 700 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </>
            )}

            {(role === 'recruitment' || role === 'operations') && (
              <button
                onClick={() => setOpenAddPanel(true)}
                style={{ background: '#F0194A', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#C9123A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F0194A')}
              >
                + {isFR ? 'Ajouter candidat' : 'Add Candidate'}
              </button>
            )}
          </div>
        </div>

        {dayCandidates.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
            {isOps && assignedOffices.length > 0
              ? (isFR ? 'Aucune entrevue pour vos bureaux ce jour.' : 'No interviews for your offices on this day.')
              : (isFR ? 'Aucune entrevue planifiée pour cette journée.' : 'No interviews scheduled for this day.')}
          </div>
        ) : dayViewMode === 'all' ? (
          // Flat list
          dayCandidates.map(c => (
            <DayCard key={c.id} candidate={c} updateCandidate={updateCandidate} onEdit={(id) => setOpenAddPanel(true, id)} isFR={isFR} />
          ))
        ) : dayViewMode === 'region' ? (
          // Grouped by region
          regionKeys.map(region => {
            const group = groupedByRegion[region]
            return (
              <div key={region} style={{ marginBottom: 20 }}>
                <RegionSectionHeader region={region === '__none__' ? null : region} candidates={group} isFR={isFR} />
                {group.map(c => (
                  <CompactDayCard key={c.id} candidate={c} updateCandidate={updateCandidate} onEdit={(id) => setOpenAddPanel(true, id)} isFR={isFR} />
                ))}
              </div>
            )
          })
        ) : (
          // Grouped by office (default)
          officeKeys.map(officeKey => {
            const group = groupedByOffice[officeKey]
            return (
              <div key={officeKey} style={{ marginBottom: 20 }}>
                <OfficeSectionHeader officeCode={officeKey === '__none__' ? null : officeKey} candidates={group} isFR={isFR} />
                {group.map(c => (
                  <CompactDayCard key={c.id} candidate={c} updateCandidate={updateCandidate} onEdit={(id) => setOpenAddPanel(true, id)} isFR={isFR} />
                ))}
              </div>
            )
          })
        )}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
        {isFR ? 'Calendrier' : 'Calendar'}
        {isOps && assignedOffices.length > 0 && (
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9CA3AF', marginLeft: 10 }}>
            {assignedOffices.length} {isFR ? 'bureau(x)' : 'office(s)'}
          </span>
        )}
      </h1>

      {/* Ops: office setup */}
      {isOps && (
        <OfficeSetup
          assignedOffices={assignedOffices}
          setAssignedOffices={setAssignedOffices}
          isFR={isFR}
        />
      )}

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, gap: 12, flexWrap: 'wrap',
        background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', padding: '12px 16px',
      }}>
        {/* View tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'month', en: 'Month', fr: 'Mois' },
            { key: 'week',  en: 'Week',  fr: 'Semaine' },
            { key: 'day',   en: 'Day',   fr: 'Jour' },
          ].map(({ key, en, fr }) => (
            <button key={key} onClick={() => setView(key)} style={viewBtn(key)}
              onMouseEnter={e => { if (view !== key) e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={e => { if (view !== key) e.currentTarget.style.background = 'white' }}
            >
              {isFR ? fr : en}
            </button>
          ))}
        </div>

        {/* Center date label */}
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827', textAlign: 'center', flex: 1, minWidth: 180 }}>
          {rangeLabel}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setBaseDate(new Date())} style={{ ...btnBase, background: 'white', color: '#374151' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            {isFR ? "Aujourd'hui" : 'Today'}
          </button>
          <button onClick={() => navigate(-1)} style={{ ...btnBase, background: 'white', color: '#374151', padding: '5px 10px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            ‹ {isFR ? 'Préc' : 'Prev'}
          </button>
          <button onClick={() => navigate(1)} style={{ ...btnBase, background: 'white', color: '#374151', padding: '5px 10px' }}
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

      {openAddPanel && (
        <AddCandidatePanel candidateId={editingCandidateId} onClose={() => setOpenAddPanel(false)} />
      )}
    </div>
  )
}
