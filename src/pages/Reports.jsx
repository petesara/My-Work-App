import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { REGIONS, OFFICES } from '../data/offices'

const startOfDay = (date) => { const d = new Date(date); d.setHours(0,0,0,0); return d }
const todayStr = () => new Date().toISOString().slice(0,10)
const weekAgo = () => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10) }
const monthAgo = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) }

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '18px 22px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color || '#111827', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function BarChart({ data, total }) {
  if (!total) return <div style={{ color: '#9CA3AF', fontSize: '0.85rem', padding: '16px 0' }}>No data</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(({ label, count, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 100, fontSize: '0.75rem', color: '#374151', textAlign: 'right', flexShrink: 0 }}>{label}</div>
          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 4, height: 20, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((count / total) * 100)}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.5s', minWidth: count > 0 ? 4 : 0 }} />
          </div>
          <div style={{ width: 32, fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>{count}</div>
        </div>
      ))}
    </div>
  )
}

const STATUS_COLORS = {
  Pending: '#F59E0B', Hired: '#10B981', Rejected: '#EF4444',
  'No Show': '#9CA3AF', 'Follow-up': '#3B82F6', '2nd Interview': '#8B5CF6',
}

export default function Reports() {
  const language = useStore((s) => s.language)
  const candidates = useStore((s) => s.candidates)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterOffice, setFilterOffice] = useState('')

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (filterOffice && c.officeCode !== filterOffice) return false
      const d = c.interviewDate || c.createdAt?.slice(0,10) || ''
      if (dateFrom && d && d < dateFrom) return false
      if (dateTo && d && d > dateTo) return false
      return true
    })
  }, [candidates, dateFrom, dateTo, filterOffice])

  const today = todayStr()
  const weekStart = weekAgo()
  const monthStart = monthAgo()

  const totalToday = filtered.filter((c) => (c.interviewDate || c.createdAt?.slice(0,10)) === today).length
  const totalWeek = filtered.filter((c) => (c.interviewDate || c.createdAt?.slice(0,10)) >= weekStart).length
  const totalMonth = filtered.filter((c) => (c.interviewDate || c.createdAt?.slice(0,10)) >= monthStart).length

  const hired = filtered.filter((c) => c.status === 'Hired').length
  const rejected = filtered.filter((c) => c.status === 'Rejected').length
  const noShow = filtered.filter((c) => c.status === 'No Show').length
  const interviewed = filtered.filter((c) => c.status !== 'Pending').length
  const hireRate = interviewed > 0 ? Math.round((hired / interviewed) * 100) : 0
  const noShowRate = interviewed > 0 ? Math.round((noShow / interviewed) * 100) : 0

  const missingDocsCount = filtered.filter((c) => {
    if (c.status !== 'Hired') return false
    const md = c.onboarding?.missingDocs || {}
    return Object.values(md).some(Boolean)
  }).length

  const rehireCount = filtered.filter((c) => c.isRehire).length
  const newHireCount = hired - filtered.filter((c) => c.isRehire && c.status === 'Hired').length
  const frCount = filtered.filter((c) => c.languagePreference === 'FR').length
  const enCount = filtered.filter((c) => c.languagePreference !== 'FR').length

  const statusData = ['Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview'].map((s) => ({
    label: t(s, language),
    count: filtered.filter((c) => c.status === s).length,
    color: STATUS_COLORS[s],
  }))

  const regionData = REGIONS.map((r) => ({
    label: r,
    count: filtered.filter((c) => c.region === r).length,
    color: '#CF2B1A',
  }))

  const inputStyle = { padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', outline: 'none' }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{t('reports', language)}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{t('from', language)}</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{t('to', language)}</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
          <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} style={{ ...inputStyle, background: 'white' }}>
            <option value="">{language === 'FR' ? 'Tous les bureaux' : 'All Offices'}</option>
            {OFFICES.map((o) => <option key={o.code} value={o.code}>{o.code} — {o.name}</option>)}
          </select>
          {(dateFrom || dateTo || filterOffice) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterOffice('') }} style={{ ...inputStyle, background: 'white', cursor: 'pointer', color: '#6B7280' }}>✕</button>
          )}
        </div>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label={t('totalToday', language)} value={totalToday} sub={today} />
        <StatCard label={t('totalWeek', language)} value={totalWeek} />
        <StatCard label={t('totalMonth', language)} value={totalMonth} />
        <StatCard label={t('hireRate', language)} value={`${hireRate}%`} sub={`${hired} / ${interviewed}`} color={hireRate >= 30 ? '#059669' : '#D97706'} />
        <StatCard label={t('noShowRate', language)} value={`${noShowRate}%`} sub={`${noShow} no-shows`} color={noShowRate > 20 ? '#DC2626' : '#374151'} />
        <StatCard label={t('missingDocsCount', language)} value={missingDocsCount} color={missingDocsCount > 0 ? '#D97706' : '#374151'} />
        <StatCard label={t('rehireCount', language)} value={rehireCount} sub={`${t('newHireCount', language)}: ${newHireCount}`} />
        <StatCard label="FR / EN" value={`${frCount} / ${enCount}`} sub={language === 'FR' ? 'Candidat(e)s' : 'Candidates'} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 16 }}>{t('byStatus', language)}</h3>
          <BarChart data={statusData} total={filtered.length || 1} />
        </div>
        <div style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 16 }}>{t('byRegion', language)}</h3>
          <BarChart data={regionData} total={filtered.length || 1} />
        </div>
      </div>

      {/* Total count */}
      <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', border: '1px solid #E5E7EB', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{t('totalCandidates', language)}:</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{filtered.length}</span>
        {(dateFrom || dateTo || filterOffice) && <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>({language === 'FR' ? 'filtré' : 'filtered'})</span>}
      </div>
    </div>
  )
}
