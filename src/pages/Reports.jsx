import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { REGIONS, OFFICES } from '../data/offices'

const todayStr = () => new Date().toISOString().slice(0, 10)
const weekAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10) }
const monthStartStr = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }

const STATUS_COLORS = {
  Pending: '#F59E0B', Hired: '#10B981', Rejected: '#EF4444',
  'No Show': '#9CA3AF', 'Follow-up': '#3B82F6', '2nd Interview': '#8B5CF6',
}
const STATUSES = ['Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview']

function StatCard({ label, value, sub, color, small, accent }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: small ? '14px 18px' : '18px 20px', border: '1px solid #E8EAF6', boxShadow: '0 1px 3px rgba(30,39,105,0.05)', borderTop: accent ? `3px solid ${accent}` : undefined }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: small ? '1.6rem' : '2rem', fontWeight: 800, color: color || '#1E2769', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function BarChart({ data, total }) {
  if (!total) return <div style={{ color: '#9CA3AF', fontSize: '0.85rem', padding: '16px 0' }}>{total === 0 ? 'No data' : ''}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map(({ label, count, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 110, fontSize: '0.75rem', color: '#374151', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 4, height: 18, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((count / (total || 1)) * 100)}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.5s', minWidth: count > 0 ? 4 : 0 }} />
          </div>
          <div style={{ width: 28, fontSize: '0.75rem', fontWeight: 600, color: '#374151', textAlign: 'right' }}>{count}</div>
          <div style={{ width: 36, fontSize: '0.68rem', color: '#9CA3AF' }}>{Math.round((count / (total || 1)) * 100)}%</div>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', margin: '0 0 16px', padding: '0 0 10px', borderBottom: '1px solid #E8EAF6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {title}
    </h3>
  )
}

const DATE_PRESETS = [
  { key: 'today', labelEN: 'Today', labelFR: "Aujourd'hui" },
  { key: 'week', labelEN: 'This Week', labelFR: 'Cette semaine' },
  { key: 'month', labelEN: 'This Month', labelFR: 'Ce mois-ci' },
  { key: 'custom', labelEN: 'Custom', labelFR: 'Personnalisé' },
]

export default function Reports() {
  const language = useStore((s) => s.language)
  const candidates = useStore((s) => s.candidates)

  const [preset, setPreset] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [filterOffice, setFilterOffice] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')

  const today = todayStr()

  const { dateFrom, dateTo } = useMemo(() => {
    if (preset === 'today') return { dateFrom: today, dateTo: today }
    if (preset === 'week') return { dateFrom: weekAgoStr(), dateTo: today }
    if (preset === 'month') return { dateFrom: monthStartStr(), dateTo: today }
    return { dateFrom: customFrom, dateTo: customTo }
  }, [preset, customFrom, customTo, today])

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (filterOffice && c.officeCode !== filterOffice) return false
      if (filterRegion !== 'all' && c.region !== filterRegion) return false
      const d = c.interviewDate || c.createdAt?.slice(0, 10) || ''
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      return true
    })
  }, [candidates, dateFrom, dateTo, filterOffice, filterRegion])

  // Core counts
  const total = filtered.length
  const hired = filtered.filter((c) => c.status === 'Hired')
  const hiredCount = hired.length
  const rejectedCount = filtered.filter((c) => c.status === 'Rejected').length
  const noShowCount = filtered.filter((c) => c.status === 'No Show').length
  const interviewed = filtered.filter((c) => c.status !== 'Pending').length
  const hireRate = interviewed > 0 ? Math.round((hiredCount / interviewed) * 100) : 0
  const noShowRate = interviewed > 0 ? Math.round((noShowCount / interviewed) * 100) : 0

  // New vs Rehire (of hired)
  const newHiresHired = hired.filter((c) => !c.isRehire).length
  const rehiresHired = hired.filter((c) => c.isRehire).length

  // All candidates: new vs rehire
  const newHiresTotal = filtered.filter((c) => !c.isRehire).length
  const rehiresTotal = filtered.filter((c) => c.isRehire).length

  // Missing docs
  const missingDocsCount = hired.filter((c) => {
    const md = c.onboarding?.missingDocs || {}
    return Object.values(md).some(Boolean)
  }).length

  // Language
  const frCount = filtered.filter((c) => c.languagePreference === 'FR').length
  const enCount = filtered.filter((c) => c.languagePreference !== 'FR').length

  // By status chart
  const statusData = STATUSES.map((s) => ({
    label: t(s, language),
    count: filtered.filter((c) => c.status === s).length,
    color: STATUS_COLORS[s],
  }))

  // By region — full breakdown table
  const regionBreakdown = REGIONS.map((r) => {
    const rc = filtered.filter((c) => c.region === r)
    const rcHired = rc.filter((c) => c.status === 'Hired').length
    const rcInterviewed = rc.filter((c) => c.status !== 'Pending').length
    const rcNoShow = rc.filter((c) => c.status === 'No Show').length
    return {
      region: r,
      total: rc.length,
      hired: rcHired,
      rejected: rc.filter((c) => c.status === 'Rejected').length,
      noShow: rcNoShow,
      pending: rc.filter((c) => c.status === 'Pending').length,
      followUp: rc.filter((c) => c.status === 'Follow-up').length,
      second: rc.filter((c) => c.status === '2nd Interview').length,
      hireRate: rcInterviewed > 0 ? Math.round((rcHired / rcInterviewed) * 100) : 0,
      rehires: rc.filter((c) => c.isRehire).length,
      newHires: rc.filter((c) => !c.isRehire).length,
      fr: rc.filter((c) => c.languagePreference === 'FR').length,
      missingDocs: rc.filter((c) => c.status === 'Hired' && Object.values(c.onboarding?.missingDocs || {}).some(Boolean)).length,
    }
  }).filter((r) => r.total > 0)

  // By source
  const sourceBreakdown = [...new Set(candidates.map((c) => c.source).filter(Boolean))].map((src) => ({
    label: src,
    count: filtered.filter((c) => c.source === src).length,
    color: '#F0194A',
  })).sort((a, b) => b.count - a.count)

  const inputStyle = { padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', outline: 'none', background: 'white' }
  const presetBtnStyle = (active) => ({
    padding: '5px 12px', fontSize: '0.75rem', fontWeight: active ? 600 : 400,
    borderRadius: 6, border: active ? '1.5px solid #F0194A' : '1px solid #E5E7EB',
    background: active ? '#FFF0F5' : 'white', color: active ? '#F0194A' : '#6B7280',
    cursor: 'pointer',
  })

  const FR = language === 'FR'

  const thStyle = {
    padding: '8px 12px', fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB', textAlign: 'right', whiteSpace: 'nowrap',
  }
  const tdStyle = (bold, color) => ({
    padding: '8px 12px', fontSize: '0.8rem', textAlign: 'right',
    fontWeight: bold ? 700 : 400, color: color || '#374151',
    borderBottom: '1px solid #F9FAFB',
  })

  return (
    <div style={{ padding: 24 }}>
      {/* Header + filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E2769', margin: 0, letterSpacing: '-0.02em' }}>{t('reports', language)}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {DATE_PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)} style={presetBtnStyle(preset === p.key)}>
              {FR ? p.labelFR : p.labelEN}
            </button>
          ))}
          {preset === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={inputStyle} />
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={inputStyle} />
            </>
          )}
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={inputStyle}>
            <option value="all">{FR ? 'Toutes les régions' : 'All Regions'}</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} style={inputStyle}>
            <option value="">{FR ? 'Tous les bureaux' : 'All Offices'}</option>
            {OFFICES.map((o) => <option key={o.code} value={o.code}>{o.code} — {o.name}</option>)}
          </select>
          {(filterOffice || filterRegion !== 'all') && (
            <button onClick={() => { setFilterOffice(''); setFilterRegion('all') }} style={{ ...inputStyle, cursor: 'pointer', color: '#6B7280' }}>✕</button>
          )}
        </div>
      </div>

      {/* Top KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label={FR ? 'Total' : 'Total Candidates'} value={total} sub={`${dateFrom || '—'} → ${dateTo || '—'}`} accent="#1E2769" />
        <StatCard label={FR ? 'Embauché(e)s' : 'Hired'} value={hiredCount} sub={`${hireRate}% ${FR ? 'taux' : 'hire rate'}`} color={hireRate >= 30 ? '#059669' : '#D97706'} accent="#2DCDB8" />
        <StatCard label={FR ? 'Taux embauche' : 'Hire Rate'} value={`${hireRate}%`} sub={`${hiredCount} / ${interviewed} ${FR ? 'interviewé(e)s' : 'interviewed'}`} color={hireRate >= 30 ? '#059669' : '#D97706'} accent={hireRate >= 30 ? '#2DCDB8' : '#F59E0B'} />
        <StatCard label={FR ? 'Taux d\'absence' : 'No-Show Rate'} value={`${noShowRate}%`} sub={`${noShowCount} ${FR ? 'absent(e)s' : 'no-shows'}`} color={noShowRate > 20 ? '#DC2626' : '#64748B'} accent={noShowRate > 20 ? '#F0194A' : '#E8EAF6'} />
        <StatCard label={FR ? 'Docs manquants' : 'Missing Docs'} value={missingDocsCount} sub={FR ? 'embauché(e)s avec docs manquants' : 'hired w/ missing docs'} color={missingDocsCount > 0 ? '#D97706' : '#64748B'} accent={missingDocsCount > 0 ? '#F59E0B' : '#E8EAF6'} />
        <StatCard label={FR ? 'Rejeté(e)s' : 'Rejected'} value={rejectedCount} color="#EF4444" accent="#F0194A" />
        <StatCard label={FR ? 'FR / EN' : 'FR / EN'} value={`${frCount} / ${enCount}`} sub={FR ? 'candidat(e)s' : 'candidates'} accent="#3B82F6" />
        <StatCard label={FR ? 'En attente' : 'Pending'} value={filtered.filter((c) => c.status === 'Pending').length} color="#F59E0B" accent="#F59E0B" />
      </div>

      {/* New Hires vs Rehires */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid #E8EAF6', boxShadow: '0 1px 3px rgba(30,39,105,0.05)' }}>
          <SectionHeader title={FR ? 'Nouvelles embauches vs Réembauches (tous candidat(e)s)' : 'New Hires vs Rehires (all candidates)'} />
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: 4 }}>{FR ? 'Nouvelles embauches' : 'New Hires'}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827' }}>{newHiresTotal}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: 4 }}>{FR ? 'Réembauches' : 'Rehires'}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#5B21B6' }}>{rehiresTotal}</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: 6 }}>{FR ? 'Des embauché(e)s' : 'Of hired candidates'}</div>
            <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', height: 24 }}>
              {hiredCount > 0 && (
                <>
                  <div style={{ flex: newHiresHired, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>
                    {newHiresHired > 0 && newHiresHired}
                  </div>
                  <div style={{ flex: rehiresHired, background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>
                    {rehiresHired > 0 && rehiresHired}
                  </div>
                </>
              )}
              {hiredCount === 0 && <div style={{ flex: 1, background: '#F3F4F6' }} />}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#6B7280' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981' }} />
                {FR ? 'Nouvelles' : 'New'}: {newHiresHired}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#6B7280' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#8B5CF6' }} />
                {FR ? 'Réembauches' : 'Rehires'}: {rehiresHired}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid #E8EAF6', boxShadow: '0 1px 3px rgba(30,39,105,0.05)' }}>
          <SectionHeader title={FR ? 'Par statut' : 'By Status'} />
          <BarChart data={statusData} total={total} />
        </div>
      </div>

      {/* By source */}
      {sourceBreakdown.length > 0 && (
        <div style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid #E8EAF6', boxShadow: '0 1px 3px rgba(30,39,105,0.05)', marginBottom: 24 }}>
          <SectionHeader title={FR ? 'Par source' : 'By Source'} />
          <BarChart data={sourceBreakdown} total={total} />
        </div>
      )}

      {/* Region breakdown table */}
      {regionBreakdown.length > 0 && (
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E8EAF6', boxShadow: '0 1px 3px rgba(30,39,105,0.05)', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', margin: 0 }}>
              {FR ? 'Rapport par région' : 'Region Breakdown'}
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 20 }}>{FR ? 'Région' : 'Region'}</th>
                  <th style={thStyle}>{FR ? 'Total' : 'Total'}</th>
                  <th style={thStyle}>{FR ? 'Embauché(e)s' : 'Hired'}</th>
                  <th style={thStyle}>{FR ? 'Rejeté(e)s' : 'Rejected'}</th>
                  <th style={thStyle}>{FR ? 'Absent(e)s' : 'No Show'}</th>
                  <th style={thStyle}>{FR ? 'En attente' : 'Pending'}</th>
                  <th style={thStyle}>{FR ? 'Suivi' : 'Follow-up'}</th>
                  <th style={thStyle}>2e / 2nd</th>
                  <th style={thStyle}>{FR ? 'Taux' : 'Hire %'}</th>
                  <th style={thStyle}>{FR ? 'Nouvelles' : 'New'}</th>
                  <th style={thStyle}>{FR ? 'Réemb.' : 'Rehire'}</th>
                  <th style={thStyle}>FR</th>
                  <th style={thStyle}>{FR ? 'Docs man.' : 'Miss. Docs'}</th>
                </tr>
              </thead>
              <tbody>
                {regionBreakdown.map((r) => (
                  <tr key={r.region} style={{ borderBottom: '1px solid #F9FAFB' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ ...tdStyle(true), textAlign: 'left', paddingLeft: 20 }}>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', color: '#F0194A', fontWeight: 700 }}>{r.region}</span>
                    </td>
                    <td style={tdStyle(true)}>{r.total}</td>
                    <td style={tdStyle(true, '#059669')}>{r.hired}</td>
                    <td style={tdStyle(false, '#EF4444')}>{r.rejected}</td>
                    <td style={tdStyle(false, '#9CA3AF')}>{r.noShow}</td>
                    <td style={tdStyle(false, '#F59E0B')}>{r.pending}</td>
                    <td style={tdStyle(false, '#3B82F6')}>{r.followUp}</td>
                    <td style={tdStyle(false, '#8B5CF6')}>{r.second}</td>
                    <td style={tdStyle(true, r.hireRate >= 30 ? '#059669' : '#D97706')}>
                      {r.hireRate}%
                    </td>
                    <td style={tdStyle(false)}>{r.newHires}</td>
                    <td style={tdStyle(false, '#5B21B6')}>{r.rehires}</td>
                    <td style={tdStyle(false, '#1E40AF')}>{r.fr}</td>
                    <td style={tdStyle(false, r.missingDocs > 0 ? '#D97706' : '#9CA3AF')}>
                      {r.missingDocs > 0 ? `⚠ ${r.missingDocs}` : '—'}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: '#F9FAFB', borderTop: '2px solid #E5E7EB' }}>
                  <td style={{ ...tdStyle(true), textAlign: 'left', paddingLeft: 20, color: '#111827' }}>
                    {FR ? 'TOTAL' : 'TOTAL'}
                  </td>
                  <td style={tdStyle(true, '#111827')}>{total}</td>
                  <td style={tdStyle(true, '#059669')}>{hiredCount}</td>
                  <td style={tdStyle(true, '#EF4444')}>{rejectedCount}</td>
                  <td style={tdStyle(true, '#9CA3AF')}>{noShowCount}</td>
                  <td style={tdStyle(true, '#F59E0B')}>{filtered.filter((c) => c.status === 'Pending').length}</td>
                  <td style={tdStyle(true, '#3B82F6')}>{filtered.filter((c) => c.status === 'Follow-up').length}</td>
                  <td style={tdStyle(true, '#8B5CF6')}>{filtered.filter((c) => c.status === '2nd Interview').length}</td>
                  <td style={tdStyle(true, hireRate >= 30 ? '#059669' : '#D97706')}>{hireRate}%</td>
                  <td style={tdStyle(true)}>{newHiresTotal}</td>
                  <td style={tdStyle(true, '#5B21B6')}>{rehiresTotal}</td>
                  <td style={tdStyle(true, '#1E40AF')}>{frCount}</td>
                  <td style={tdStyle(true, missingDocsCount > 0 ? '#D97706' : '#9CA3AF')}>
                    {missingDocsCount > 0 ? `⚠ ${missingDocsCount}` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          {FR ? 'Aucune donnée pour cette période.' : 'No data for the selected period.'}
        </div>
      )}
    </div>
  )
}
