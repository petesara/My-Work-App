import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { REGIONS, OFFICES } from '../data/offices'

// ── Date helpers ─────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)

const getWeekStart = () => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().slice(0, 10)
}

const getMonthStart = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

const getQuarterStart = () => {
  const d = new Date()
  const q = Math.floor(d.getMonth() / 3)
  return new Date(d.getFullYear(), q * 3, 1).toISOString().slice(0, 10)
}

const getYearStart = () => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)

const daysBetween = (a, b) => {
  if (!a || !b) return null
  const diff = new Date(b) - new Date(a)
  return Math.round(diff / 86400000)
}

// ── Shared UI atoms ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending: '#F59E0B', Hired: '#10B981', Rejected: '#EF4444',
  'No Show': '#9CA3AF', 'Follow-up': '#3B82F6', '2nd Interview': '#8B5CF6',
}
const STATUSES = ['Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview']
const DOC_KEYS = ['directDeposit', 'sin', 'govId', 'contract', 'workPermit']

function StatCard({ label, value, sub, color, accent, small }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12,
      padding: small ? '14px 18px' : '20px 22px',
      border: '1px solid #E8EAF6',
      boxShadow: '0 1px 4px rgba(30,39,105,0.06)',
      borderLeft: accent ? `4px solid ${accent}` : '4px solid transparent',
    }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: small ? '1.75rem' : '2.25rem', fontWeight: 800, color: color || '#1E2769', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 7 }}>{sub}</div>}
    </div>
  )
}

function BarChart({ data, total }) {
  if (!total) return <div style={{ color: '#9CA3AF', fontSize: '0.85rem', padding: '16px 0' }}>—</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.filter(d => d.count > 0).map(({ label, count, color }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>
              {count} <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.72rem' }}>({Math.round((count / (total || 1)) * 100)}%)</span>
            </span>
          </div>
          <div style={{ background: '#F3F4F6', borderRadius: 6, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((count / (total || 1)) * 100)}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.4s', minWidth: count > 0 ? 6 : 0 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Funnel({ steps }) {
  const first = steps[0]?.count || 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
      {steps.map((step, i) => {
        const ofFirst = first > 0 ? Math.round((step.count / first) * 100) : 0
        const dropPct = i > 0 && steps[i - 1].count > 0
          ? Math.round(((steps[i - 1].count - step.count) / steps[i - 1].count) * 100)
          : null
        return (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {i > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, padding: '0 6px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: dropPct > 30 ? '#EF4444' : '#94A3B8', marginBottom: 2 }}>
                  {dropPct !== null ? `−${dropPct}%` : ''}
                </span>
                <span style={{ color: '#CBD5E1', fontSize: '1.4rem', lineHeight: 1 }}>›</span>
              </div>
            )}
            <div style={{
              flex: 1, background: 'white', borderRadius: 10, padding: '16px 12px', textAlign: 'center',
              border: `1.5px solid ${step.color}40`,
              borderTop: `4px solid ${step.color}`,
              boxShadow: '0 1px 4px rgba(30,39,105,0.05)',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: step.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{step.count}</div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748B', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.label}</div>
              {i > 0 && (
                <div style={{ fontSize: '0.68rem', color: '#CBD5E1', marginTop: 4 }}>{ofFirst}% of start</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SectionDivider({ title, color = '#1E2769' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '32px 0 16px' }}>
      <div style={{ width: 4, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: '#E8EAF6' }} />
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 22, border: '1px solid #E8EAF6', boxShadow: '0 1px 4px rgba(30,39,105,0.05)', ...style }}>
      {children}
    </div>
  )
}

function TableCard({ title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E8EAF6', boxShadow: '0 1px 4px rgba(30,39,105,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '2px solid #F3F4F6', background: '#FAFBFF' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E2769' }}>{title}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  )
}

// ── Period presets ────────────────────────────────────────────────────────────
const PRESETS = [
  { key: 'weekly',    EN: 'Weekly',    FR: 'Hebdomadaire' },
  { key: 'monthly',   EN: 'Monthly',   FR: 'Mensuel' },
  { key: 'quarterly', EN: 'Quarterly', FR: 'Trimestriel' },
  { key: 'yearly',    EN: 'Yearly',    FR: 'Annuel' },
  { key: 'custom',    EN: 'Custom',    FR: 'Personnalisé' },
]

function getDateRange(preset) {
  const today = todayStr()
  if (preset === 'weekly')    return { from: getWeekStart(),    to: today }
  if (preset === 'monthly')   return { from: getMonthStart(),   to: today }
  if (preset === 'quarterly') return { from: getQuarterStart(), to: today }
  if (preset === 'yearly')    return { from: getYearStart(),    to: today }
  return { from: '', to: '' }
}

// ── Shared filter bar ─────────────────────────────────────────────────────────
function FilterBar({ preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filterRegion, setFilterRegion, filterOffice, setFilterOffice, language, allManagers }) {
  const FR = language === 'FR'
  const inputStyle = { padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.78rem', outline: 'none', background: 'white' }
  const btnStyle = (active) => ({
    padding: '5px 12px', fontSize: '0.73rem', fontWeight: active ? 700 : 400,
    borderRadius: 6, border: active ? '1.5px solid #1E2769' : '1px solid #E5E7EB',
    background: active ? '#1E2769' : 'white', color: active ? 'white' : '#6B7280',
    cursor: 'pointer',
  })
  const officeOptions = allManagers && allManagers.length > 0 ? allManagers : OFFICES
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {PRESETS.map((p) => (
        <button key={p.key} onClick={() => setPreset(p.key)} style={btnStyle(preset === p.key)}>
          {FR ? p.FR : p.EN}
        </button>
      ))}
      {preset === 'custom' && (
        <>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>→</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={inputStyle} />
        </>
      )}
      <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={inputStyle}>
        <option value="all">{FR ? 'Toutes les régions' : 'All Regions'}</option>
        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} style={inputStyle}>
        <option value="">{FR ? 'Tous les bureaux' : 'All Offices'}</option>
        {officeOptions.map((o) => <option key={o.code} value={o.code}>{o.code}{o.name ? ` — ${o.name}` : ''}</option>)}
      </select>
      {(filterOffice || filterRegion !== 'all') && (
        <button onClick={() => { setFilterOffice(''); setFilterRegion('all') }}
          style={{ ...inputStyle, cursor: 'pointer', color: '#6B7280' }}>✕</button>
      )}
    </div>
  )
}

// ── Shared table helpers ──────────────────────────────────────────────────────
const TH = (right) => ({
  padding: '8px 12px', fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF',
  textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB', textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap',
})
const TD = (bold, color, right) => ({
  padding: '8px 12px', fontSize: '0.8rem', textAlign: right ? 'right' : 'left',
  fontWeight: bold ? 700 : 400, color: color || '#374151',
  borderBottom: '1px solid #F9FAFB',
})

// ── Recruitment view ──────────────────────────────────────────────────────────
function RecruitmentReport({ candidates, dateFrom, dateTo, filterRegion, filterOffice, language, managers }) {
  const FR = language === 'FR'

  const filtered = useMemo(() => candidates.filter((c) => {
    if (filterOffice && c.officeCode !== filterOffice) return false
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    const d = c.interviewDate || c.createdAt?.slice(0, 10) || ''
    if (dateFrom && d < dateFrom) return false
    if (dateTo && d > dateTo) return false
    return true
  }), [candidates, dateFrom, dateTo, filterOffice, filterRegion])

  const total = filtered.length
  const hired = filtered.filter(c => c.status === 'Hired').length
  const rejected = filtered.filter(c => c.status === 'Rejected').length
  const noShow = filtered.filter(c => c.status === 'No Show').length
  const pending = filtered.filter(c => c.status === 'Pending').length
  const followUp = filtered.filter(c => c.status === 'Follow-up').length
  const secondInt = filtered.filter(c => c.status === '2nd Interview').length
  const showed = total - noShow - pending
  const hireRate = showed > 0 ? Math.round((hired / showed) * 100) : 0
  const noShowRate = (total - pending) > 0 ? Math.round((noShow / (total - pending)) * 100) : 0

  const statusData = STATUSES.map(s => ({ label: t(s, language), count: filtered.filter(c => c.status === s).length, color: STATUS_COLORS[s] }))

  const SOURCES = [...new Set(candidates.map(c => c.source).filter(Boolean))]
  const sourceData = SOURCES.map(src => ({ label: src, count: filtered.filter(c => c.source === src).length, color: '#F0194A' })).sort((a, b) => b.count - a.count)

  const allOffices = managers && managers.length > 0 ? managers : OFFICES
  const regionRows = REGIONS.map(r => {
    const rc = filtered.filter(c => c.region === r)
    if (!rc.length) return null
    const rcHired = rc.filter(c => c.status === 'Hired').length
    const rcShowed = rc.length - rc.filter(c => c.status === 'No Show').length - rc.filter(c => c.status === 'Pending').length
    return {
      region: r, total: rc.length, hired: rcHired, rejected: rc.filter(c => c.status === 'Rejected').length,
      noShow: rc.filter(c => c.status === 'No Show').length, pending: rc.filter(c => c.status === 'Pending').length,
      followUp: rc.filter(c => c.status === 'Follow-up').length, second: rc.filter(c => c.status === '2nd Interview').length,
      hireRate: rcShowed > 0 ? Math.round((rcHired / rcShowed) * 100) : 0,
    }
  }).filter(Boolean)

  const officeRows = allOffices.map(o => {
    const oc = filtered.filter(c => c.officeCode === o.code)
    if (!oc.length) return null
    const ocHired = oc.filter(c => c.status === 'Hired').length
    const ocShowed = oc.length - oc.filter(c => c.status === 'No Show').length - oc.filter(c => c.status === 'Pending').length
    return {
      code: o.code, name: o.name || '', total: oc.length, hired: ocHired,
      rejected: oc.filter(c => c.status === 'Rejected').length,
      noShow: oc.filter(c => c.status === 'No Show').length,
      hireRate: ocShowed > 0 ? Math.round((ocHired / ocShowed) * 100) : 0,
    }
  }).filter(Boolean).sort((a, b) => b.hired - a.hired)

  return (
    <div>
      {/* ── Overview KPIs ── */}
      <SectionDivider title={FR ? 'Aperçu de la période' : 'Period Overview'} color="#1E2769" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 8 }}>
        <StatCard label={FR ? 'Total candidat(e)s' : 'Total Candidates'} value={total} sub={`${dateFrom || '—'} → ${dateTo || '—'}`} accent="#1E2769" />
        <StatCard label={FR ? 'Embauché(e)s' : 'Hired'} value={hired} sub={`${FR ? 'sur' : 'out of'} ${showed} ${FR ? 'présenté(e)s' : 'who showed'}`} color="#059669" accent="#2DCDB8" />
        <StatCard label={FR ? 'Taux d\'embauche' : 'Hire Rate'} value={`${hireRate}%`} sub={hireRate >= 30 ? (FR ? '✓ Bon taux' : '✓ Good rate') : (FR ? '↓ En dessous de 30%' : '↓ Below 30%')} color={hireRate >= 30 ? '#059669' : '#D97706'} accent={hireRate >= 30 ? '#2DCDB8' : '#F59E0B'} />
        <StatCard label={FR ? 'Taux d\'absence' : 'No-Show Rate'} value={`${noShowRate}%`} sub={`${noShow} ${FR ? 'absent(e)s' : 'no-shows'}`} color={noShowRate > 25 ? '#DC2626' : '#64748B'} accent={noShowRate > 25 ? '#F0194A' : '#E8EAF6'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label={FR ? 'Rejeté(e)s' : 'Rejected'} value={rejected} color="#EF4444" accent="#F0194A" small />
        <StatCard label={FR ? 'En attente' : 'Pending'} value={pending} color="#F59E0B" accent="#F59E0B" small />
        <StatCard label={FR ? 'Suivi' : 'Follow-up'} value={followUp} color="#3B82F6" accent="#3B82F6" small />
        <StatCard label={FR ? '2e entrevue' : '2nd Interview'} value={secondInt} color="#8B5CF6" accent="#8B5CF6" small />
      </div>

      {/* ── Recruitment Funnel ── */}
      <SectionDivider title={FR ? 'Entonnoir de recrutement' : 'Recruitment Funnel'} color="#2DCDB8" />
      <Card>
        <Funnel steps={[
          { label: FR ? 'En pipeline' : 'In Pipeline', count: total, color: '#1E2769' },
          { label: FR ? 'Présenté(e)s' : 'Showed Up', count: showed, color: '#3B82F6' },
          { label: FR ? '2e entrevue' : '2nd Interview', count: secondInt, color: '#8B5CF6' },
          { label: FR ? 'Embauché(e)s' : 'Hired', count: hired, color: '#059669' },
        ]} />
        <div style={{ display: 'flex', gap: 20, marginTop: 18, paddingTop: 14, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            {FR ? 'Absent(e)s' : 'No-Shows'}: <strong style={{ color: '#9CA3AF' }}>{noShow}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            {FR ? 'Rejeté(e)s' : 'Rejected'}: <strong style={{ color: '#EF4444' }}>{rejected}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            {FR ? 'En attente' : 'Still Pending'}: <strong style={{ color: '#F59E0B' }}>{pending}</strong>
          </span>
        </div>
      </Card>

      {/* ── Breakdowns ── */}
      <SectionDivider title={FR ? 'Répartition' : 'Breakdown'} color="#F0194A" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 16 }}>{FR ? 'Par statut' : 'By Status'}</div>
          <BarChart data={statusData} total={total} />
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 16 }}>{FR ? 'Par source' : 'By Source'}</div>
          {sourceData.length > 0 ? <BarChart data={sourceData} total={total} /> : <div style={{ color: '#9CA3AF', fontSize: '0.82rem', paddingTop: 8 }}>{FR ? 'Aucune source enregistrée.' : 'No source data recorded.'}</div>}
        </Card>
      </div>

      {/* ── By Region ── */}
      {regionRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Par région' : 'By Region'} color="#F59E0B" />
          <TableCard title={FR ? 'Résultats par région' : 'Results by Region'}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[FR ? 'Région' : 'Region', 'Total', FR ? 'Embauché(e)s' : 'Hired', FR ? 'Rejeté(e)s' : 'Rejected', FR ? 'Absent(e)s' : 'No Show', FR ? 'En attente' : 'Pending', FR ? 'Suivi' : 'Follow-up', '2nd', FR ? 'Taux emb.' : 'Hire Rate'].map((h, i) => (
                  <th key={h} style={TH(i > 0)}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {regionRows.map(r => (
                  <tr key={r.region} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), paddingLeft: 20 }}><span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0194A', fontWeight: 700 }}>{r.region}</span></td>
                    <td style={TD(true, '#111827', true)}>{r.total}</td>
                    <td style={TD(true, '#059669', true)}>{r.hired}</td>
                    <td style={TD(false, '#EF4444', true)}>{r.rejected}</td>
                    <td style={TD(false, '#9CA3AF', true)}>{r.noShow}</td>
                    <td style={TD(false, '#F59E0B', true)}>{r.pending}</td>
                    <td style={TD(false, '#3B82F6', true)}>{r.followUp}</td>
                    <td style={TD(false, '#8B5CF6', true)}>{r.second}</td>
                    <td style={TD(true, r.hireRate >= 30 ? '#059669' : '#D97706', true)}>{r.hireRate}%</td>
                  </tr>
                ))}
                <tr style={{ background: '#F0F2FF', borderTop: '2px solid #E8EAF6' }}>
                  <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20, letterSpacing: '0.05em' }}>TOTAL</td>
                  <td style={TD(true, '#111827', true)}>{total}</td>
                  <td style={TD(true, '#059669', true)}>{hired}</td>
                  <td style={TD(true, '#EF4444', true)}>{rejected}</td>
                  <td style={TD(true, '#9CA3AF', true)}>{noShow}</td>
                  <td style={TD(true, '#F59E0B', true)}>{pending}</td>
                  <td style={TD(true, '#3B82F6', true)}>{followUp}</td>
                  <td style={TD(true, '#8B5CF6', true)}>{secondInt}</td>
                  <td style={TD(true, hireRate >= 30 ? '#059669' : '#D97706', true)}>{hireRate}%</td>
                </tr>
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {/* ── By Office ── */}
      {officeRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Par bureau' : 'By Office'} color="#8B5CF6" />
          <TableCard title={FR ? 'Résultats par bureau (top 20)' : 'Results by Office (top 20)'}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Code', FR ? 'Bureau' : 'Office', 'Total', FR ? 'Embauché(e)s' : 'Hired', FR ? 'Rejeté(e)s' : 'Rejected', FR ? 'Absent(e)s' : 'No Show', FR ? 'Taux emb.' : 'Hire Rate'].map((h, i) => (
                  <th key={h} style={TH(i > 1)}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {officeRows.slice(0, 20).map(o => (
                  <tr key={o.code} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), fontFamily: 'IBM Plex Mono, monospace', color: '#1E2769', paddingLeft: 20 }}>{o.code}</td>
                    <td style={TD(false, '#374151')}>{o.name}</td>
                    <td style={TD(true, '#111827', true)}>{o.total}</td>
                    <td style={TD(true, '#059669', true)}>{o.hired}</td>
                    <td style={TD(false, '#EF4444', true)}>{o.rejected}</td>
                    <td style={TD(false, '#9CA3AF', true)}>{o.noShow}</td>
                    <td style={TD(true, o.hireRate >= 30 ? '#059669' : '#D97706', true)}>{o.hireRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {total === 0 && (
        <div style={{ textAlign: 'center', padding: 56, color: '#9CA3AF', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', marginTop: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{FR ? 'Aucune donnée pour cette période.' : 'No data for the selected period.'}</div>
          <div style={{ fontSize: '0.78rem' }}>{FR ? 'Essayez une période plus longue ou retirez les filtres.' : 'Try a longer period or remove filters.'}</div>
        </div>
      )}
    </div>
  )
}

// ── Admin view ────────────────────────────────────────────────────────────────
function AdminReport({ candidates, dateFrom, dateTo, filterRegion, filterOffice, language, managers }) {
  const FR = language === 'FR'

  const hired = useMemo(() => candidates.filter((c) => {
    if (c.status !== 'Hired') return false
    if (filterOffice && c.officeCode !== filterOffice) return false
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    const d = c.interviewDate || c.createdAt?.slice(0, 10) || ''
    if (dateFrom && d < dateFrom) return false
    if (dateTo && d > dateTo) return false
    return true
  }), [candidates, dateFrom, dateTo, filterOffice, filterRegion])

  const total = hired.length
  const adpSent = hired.filter(c => c.onboarding?.adpSentDate).length
  const adpComplete = hired.filter(c => c.onboarding?.adpCompleteDate).length
  const podActive = hired.filter(c => c.onboarding?.podActivatedDate).length
  const hasMissingDocs = hired.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean)).length

  // Average days hire → POD
  const podTimes = hired
    .filter(c => c.interviewDate && c.onboarding?.podActivatedDate)
    .map(c => daysBetween(c.interviewDate, c.onboarding.podActivatedDate))
    .filter(d => d !== null && d >= 0)
  const avgDaysToPod = podTimes.length > 0 ? Math.round(podTimes.reduce((a, b) => a + b, 0) / podTimes.length) : null

  // Avg days hire → ADP complete
  const adpCompleteTimes = hired
    .filter(c => c.interviewDate && c.onboarding?.adpCompleteDate)
    .map(c => daysBetween(c.interviewDate, c.onboarding.adpCompleteDate))
    .filter(d => d !== null && d >= 0)
  const avgDaysToAdpComplete = adpCompleteTimes.length > 0 ? Math.round(adpCompleteTimes.reduce((a, b) => a + b, 0) / adpCompleteTimes.length) : null

  // Missing doc breakdown
  const docBreakdown = DOC_KEYS.map(key => ({
    key,
    label: t(key, language),
    count: hired.filter(c => c.onboarding?.missingDocs?.[key]).length,
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count)

  const allOffices = managers && managers.length > 0 ? managers : OFFICES
  const regionRows = REGIONS.map(r => {
    const rc = hired.filter(c => c.region === r)
    if (!rc.length) return null
    return {
      region: r, total: rc.length,
      adpSent: rc.filter(c => c.onboarding?.adpSentDate).length,
      adpComplete: rc.filter(c => c.onboarding?.adpCompleteDate).length,
      podActive: rc.filter(c => c.onboarding?.podActivatedDate).length,
      missingDocs: rc.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean)).length,
    }
  }).filter(Boolean)

  const officeRows = allOffices.map(o => {
    const oc = hired.filter(c => c.officeCode === o.code)
    if (!oc.length) return null
    return {
      code: o.code, name: o.name || '', total: oc.length,
      adpSent: oc.filter(c => c.onboarding?.adpSentDate).length,
      adpComplete: oc.filter(c => c.onboarding?.adpCompleteDate).length,
      podActive: oc.filter(c => c.onboarding?.podActivatedDate).length,
      missingDocs: oc.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean)).length,
    }
  }).filter(Boolean).sort((a, b) => b.total - a.total)

  const daysLabel = (n) => n !== null ? `${n} ${FR ? 'jours' : 'days'}` : '—'

  return (
    <div>
      {/* ── Overview KPIs ── */}
      <SectionDivider title={FR ? 'Aperçu de la période' : 'Period Overview'} color="#1E2769" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label={FR ? 'Total embauché(e)s' : 'Total Hired'} value={total} sub={`${dateFrom || '—'} → ${dateTo || '—'}`} accent="#1E2769" />
        <StatCard label={FR ? 'ADP Envoyé' : 'ADP Sent'} value={adpSent} sub={`${total > 0 ? Math.round((adpSent/total)*100) : 0}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#3B82F6" accent="#3B82F6" />
        <StatCard label={FR ? 'ADP Complété' : 'ADP Complete'} value={adpComplete} sub={`${total > 0 ? Math.round((adpComplete/total)*100) : 0}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#8B5CF6" accent="#8B5CF6" />
        <StatCard label={FR ? 'POD Actif' : 'POD Active'} value={podActive} sub={`${total > 0 ? Math.round((podActive/total)*100) : 0}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#059669" accent="#2DCDB8" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label={FR ? 'Docs manquants' : 'Candidates w/ Missing Docs'} value={hasMissingDocs} sub={`${total > 0 ? Math.round((hasMissingDocs/total)*100) : 0}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color={hasMissingDocs > 0 ? '#D97706' : '#059669'} accent={hasMissingDocs > 0 ? '#F59E0B' : '#2DCDB8'} small />
        <StatCard
          label={FR ? 'Délai moyen embauche → POD' : 'Avg. Hire to POD Active'}
          value={daysLabel(avgDaysToPod)}
          sub={avgDaysToPod !== null && avgDaysToPod > 14 ? (FR ? '⚠ Plus de 14 jours' : '⚠ Over 14 days') : (FR ? '✓ Dans les délais' : '✓ On track')}
          color={avgDaysToPod !== null && avgDaysToPod > 14 ? '#D97706' : '#059669'}
          accent={avgDaysToPod !== null && avgDaysToPod > 14 ? '#F59E0B' : '#2DCDB8'} small
        />
        <StatCard
          label={FR ? 'Délai moyen embauche → ADP complet' : 'Avg. Hire to ADP Complete'}
          value={daysLabel(avgDaysToAdpComplete)}
          sub={FR ? 'depuis la date d\'entrevue' : 'from interview date'}
          color="#64748B" accent="#E8EAF6" small
        />
      </div>

      {/* ── Onboarding Funnel ── */}
      <SectionDivider title={FR ? 'Entonnoir d\'intégration' : 'Onboarding Funnel'} color="#2DCDB8" />
      <Card>
        <Funnel steps={[
          { label: FR ? 'Embauché(e)s' : 'Hired', count: total, color: '#1E2769' },
          { label: FR ? 'ADP Envoyé' : 'ADP Sent', count: adpSent, color: '#3B82F6' },
          { label: FR ? 'ADP Complété' : 'ADP Complete', count: adpComplete, color: '#8B5CF6' },
          { label: FR ? 'POD Actif' : 'POD Active', count: podActive, color: '#059669' },
        ]} />
      </Card>

      {/* ── Missing Docs Breakdown ── */}
      {docBreakdown.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Documents manquants' : 'Missing Documents'} color="#F59E0B" />
          <Card>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 16 }}>
              {FR ? 'Par type de document' : 'By Document Type'}
              <span style={{ marginLeft: 10, fontSize: '0.72rem', fontWeight: 400, color: '#9CA3AF' }}>
                — {hasMissingDocs} {FR ? 'candidat(e)s affecté(e)s' : 'candidates affected'} ({total > 0 ? Math.round((hasMissingDocs/total)*100) : 0}%)
              </span>
            </div>
            <BarChart data={docBreakdown.map(d => ({ label: d.label, count: d.count, color: '#F59E0B' }))} total={hasMissingDocs} />
          </Card>
        </>
      )}

      {/* ── By Region ── */}
      {regionRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Par région' : 'By Region'} color="#F59E0B" />
          <TableCard title={FR ? 'Intégration par région' : 'Onboarding by Region'}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[FR ? 'Région' : 'Region', FR ? 'Embauché(e)s' : 'Hired', FR ? 'ADP Envoyé' : 'ADP Sent', FR ? 'ADP Complet' : 'ADP Complete', FR ? 'POD Actif' : 'POD Active', FR ? 'Docs manq.' : 'Missing Docs'].map((h, i) => (
                  <th key={h} style={TH(i > 0)}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {regionRows.map(r => (
                  <tr key={r.region} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), paddingLeft: 20 }}><span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0194A', fontWeight: 700 }}>{r.region}</span></td>
                    <td style={TD(true, '#1E2769', true)}>{r.total}</td>
                    <td style={TD(false, '#3B82F6', true)}>{r.adpSent}</td>
                    <td style={TD(false, '#8B5CF6', true)}>{r.adpComplete}</td>
                    <td style={TD(true, '#059669', true)}>{r.podActive}</td>
                    <td style={TD(false, r.missingDocs > 0 ? '#D97706' : '#9CA3AF', true)}>{r.missingDocs > 0 ? `⚠ ${r.missingDocs}` : '—'}</td>
                  </tr>
                ))}
                <tr style={{ background: '#F0F2FF', borderTop: '2px solid #E8EAF6' }}>
                  <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>TOTAL</td>
                  <td style={TD(true, '#1E2769', true)}>{total}</td>
                  <td style={TD(true, '#3B82F6', true)}>{adpSent}</td>
                  <td style={TD(true, '#8B5CF6', true)}>{adpComplete}</td>
                  <td style={TD(true, '#059669', true)}>{podActive}</td>
                  <td style={TD(true, hasMissingDocs > 0 ? '#D97706' : '#9CA3AF', true)}>{hasMissingDocs > 0 ? `⚠ ${hasMissingDocs}` : '—'}</td>
                </tr>
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {/* ── By Office ── */}
      {officeRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Par bureau' : 'By Office'} color="#8B5CF6" />
          <TableCard title={FR ? 'Intégration par bureau (top 20)' : 'Onboarding by Office (top 20)'}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Code', FR ? 'Bureau' : 'Office', FR ? 'Embauché(e)s' : 'Hired', FR ? 'ADP Envoyé' : 'ADP Sent', FR ? 'ADP Complet' : 'ADP Complete', FR ? 'POD Actif' : 'POD Active', FR ? 'Docs manq.' : 'Missing Docs'].map((h, i) => (
                  <th key={h} style={TH(i > 1)}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {officeRows.slice(0, 20).map(o => (
                  <tr key={o.code} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), fontFamily: 'IBM Plex Mono, monospace', color: '#1E2769', paddingLeft: 20 }}>{o.code}</td>
                    <td style={TD(false, '#374151')}>{o.name}</td>
                    <td style={TD(true, '#1E2769', true)}>{o.total}</td>
                    <td style={TD(false, '#3B82F6', true)}>{o.adpSent}</td>
                    <td style={TD(false, '#8B5CF6', true)}>{o.adpComplete}</td>
                    <td style={TD(true, '#059669', true)}>{o.podActive}</td>
                    <td style={TD(false, o.missingDocs > 0 ? '#D97706' : '#9CA3AF', true)}>{o.missingDocs > 0 ? `⚠ ${o.missingDocs}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {total === 0 && (
        <div style={{ textAlign: 'center', padding: 56, color: '#9CA3AF', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', marginTop: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{FR ? 'Aucune donnée pour cette période.' : 'No data for the selected period.'}</div>
          <div style={{ fontSize: '0.78rem' }}>{FR ? 'Essayez une période plus longue ou retirez les filtres.' : 'Try a longer period or remove filters.'}</div>
        </div>
      )}
    </div>
  )
}

// ── Operations view ───────────────────────────────────────────────────────────
function OperationsReport({ candidates, dateFrom, dateTo, filterRegion, filterOffice, language, managers }) {
  const FR = language === 'FR'

  const filtered = useMemo(() => candidates.filter((c) => {
    if (filterOffice && c.officeCode !== filterOffice) return false
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    const d = c.interviewDate || c.createdAt?.slice(0, 10) || ''
    if (dateFrom && d < dateFrom) return false
    if (dateTo && d > dateTo) return false
    return true
  }), [candidates, dateFrom, dateTo, filterOffice, filterRegion])

  const total = filtered.length
  const noShow = filtered.filter(c => c.status === 'No Show').length
  const pending = filtered.filter(c => c.status === 'Pending').length
  const showed = total - noShow - pending
  const hired = filtered.filter(c => c.status === 'Hired').length
  const onboardingStarted = filtered.filter(c => c.status === 'Hired' && (c.onboarding?.adpSentDate || c.onboarding?.userCreated)).length
  const adpComplete = filtered.filter(c => c.onboarding?.adpCompleteDate).length
  const podActive = filtered.filter(c => c.onboarding?.podActivatedDate).length
  const hireRate = showed > 0 ? Math.round((hired / showed) * 100) : 0
  const onboardingRate = hired > 0 ? Math.round((podActive / hired) * 100) : 0

  const allOffices = managers && managers.length > 0 ? managers : OFFICES
  const regionRows = REGIONS.map(r => {
    const rc = filtered.filter(c => c.region === r)
    if (!rc.length) return null
    const rcShowed = rc.length - rc.filter(c => c.status === 'No Show').length - rc.filter(c => c.status === 'Pending').length
    const rcHired = rc.filter(c => c.status === 'Hired').length
    return {
      region: r, total: rc.length, showed: rcShowed, hired: rcHired,
      onboardingStarted: rc.filter(c => c.status === 'Hired' && (c.onboarding?.adpSentDate || c.onboarding?.userCreated)).length,
      adpComplete: rc.filter(c => c.onboarding?.adpCompleteDate).length,
      podActive: rc.filter(c => c.onboarding?.podActivatedDate).length,
      hireRate: rcShowed > 0 ? Math.round((rcHired / rcShowed) * 100) : 0,
    }
  }).filter(Boolean)

  const officeRows = allOffices.map(o => {
    const oc = filtered.filter(c => c.officeCode === o.code)
    if (!oc.length) return null
    const ocShowed = oc.length - oc.filter(c => c.status === 'No Show').length - oc.filter(c => c.status === 'Pending').length
    const ocHired = oc.filter(c => c.status === 'Hired').length
    return {
      code: o.code, name: o.name || '', total: oc.length, showed: ocShowed, hired: ocHired,
      onboardingStarted: oc.filter(c => c.status === 'Hired' && (c.onboarding?.adpSentDate || c.onboarding?.userCreated)).length,
      podActive: oc.filter(c => c.onboarding?.podActivatedDate).length,
      hireRate: ocShowed > 0 ? Math.round((ocHired / ocShowed) * 100) : 0,
    }
  }).filter(Boolean).sort((a, b) => b.hired - a.hired)

  return (
    <div>
      {/* ── Overview KPIs ── */}
      <SectionDivider title={FR ? 'Aperçu de la période' : 'Period Overview'} color="#1E2769" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label={FR ? 'Total candidat(e)s' : 'Total Candidates'} value={total} sub={`${dateFrom || '—'} → ${dateTo || '—'}`} accent="#1E2769" />
        <StatCard label={FR ? 'Présenté(e)s' : 'Showed Up'} value={showed} sub={`${total > 0 ? Math.round((showed/total)*100) : 0}% ${FR ? 'du total' : 'of total'}`} color="#3B82F6" accent="#3B82F6" />
        <StatCard label={FR ? 'Embauché(e)s' : 'Hired'} value={hired} sub={`${hireRate}% ${FR ? 'taux d\'embauche' : 'hire rate'}`} color={hireRate >= 30 ? '#059669' : '#D97706'} accent="#2DCDB8" />
        <StatCard label={FR ? 'POD Actif' : 'POD Active'} value={podActive} sub={`${onboardingRate}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#059669" accent="#059669" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label={FR ? 'Intégration commencée' : 'Onboarding Started'} value={onboardingStarted} sub={`${hired > 0 ? Math.round((onboardingStarted/hired)*100) : 0}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#8B5CF6" accent="#8B5CF6" small />
        <StatCard label={FR ? 'ADP Complété' : 'ADP Complete'} value={adpComplete} color="#3B82F6" accent="#3B82F6" small />
        <StatCard label={FR ? 'Absent(e)s' : 'No-Shows'} value={noShow} color="#9CA3AF" accent="#E8EAF6" small />
        <StatCard label={FR ? 'En attente' : 'Pending'} value={pending} color="#F59E0B" accent="#F59E0B" small />
      </div>

      {/* ── Full Pipeline Funnel ── */}
      <SectionDivider title={FR ? 'Entonnoir global (recrutement + intégration)' : 'Full Pipeline (Recruitment → Onboarding)'} color="#2DCDB8" />
      <Card>
        <Funnel steps={[
          { label: FR ? 'En pipeline' : 'In Pipeline', count: total, color: '#1E2769' },
          { label: FR ? 'Présenté(e)s' : 'Showed Up', count: showed, color: '#3B82F6' },
          { label: FR ? 'Embauché(e)s' : 'Hired', count: hired, color: '#2DCDB8' },
          { label: FR ? 'Intégration' : 'Onboarding', count: onboardingStarted, color: '#8B5CF6' },
          { label: FR ? 'POD Actif' : 'POD Active', count: podActive, color: '#059669' },
        ]} />
      </Card>

      {/* ── By Region ── */}
      {regionRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Par région' : 'By Region'} color="#F59E0B" />
          <TableCard title={FR ? 'Vue combinée par région' : 'Combined View by Region'}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[FR ? 'Région' : 'Region', 'Total', FR ? 'Présenté(e)s' : 'Showed', FR ? 'Embauché(e)s' : 'Hired', FR ? 'Intégration' : 'Onboarding', FR ? 'ADP Complet' : 'ADP Complete', FR ? 'POD Actif' : 'POD Active', FR ? 'Taux emb.' : 'Hire Rate'].map((h, i) => (
                  <th key={h} style={TH(i > 0)}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {regionRows.map(r => (
                  <tr key={r.region} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), paddingLeft: 20 }}><span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0194A', fontWeight: 700 }}>{r.region}</span></td>
                    <td style={TD(true, '#111827', true)}>{r.total}</td>
                    <td style={TD(false, '#3B82F6', true)}>{r.showed}</td>
                    <td style={TD(true, '#2DCDB8', true)}>{r.hired}</td>
                    <td style={TD(false, '#8B5CF6', true)}>{r.onboardingStarted}</td>
                    <td style={TD(false, '#3B82F6', true)}>{r.adpComplete}</td>
                    <td style={TD(true, '#059669', true)}>{r.podActive}</td>
                    <td style={TD(true, r.hireRate >= 30 ? '#059669' : '#D97706', true)}>{r.hireRate}%</td>
                  </tr>
                ))}
                <tr style={{ background: '#F0F2FF', borderTop: '2px solid #E8EAF6' }}>
                  <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>TOTAL</td>
                  <td style={TD(true, '#111827', true)}>{total}</td>
                  <td style={TD(true, '#3B82F6', true)}>{showed}</td>
                  <td style={TD(true, '#2DCDB8', true)}>{hired}</td>
                  <td style={TD(true, '#8B5CF6', true)}>{onboardingStarted}</td>
                  <td style={TD(true, '#3B82F6', true)}>{adpComplete}</td>
                  <td style={TD(true, '#059669', true)}>{podActive}</td>
                  <td style={TD(true, hireRate >= 30 ? '#059669' : '#D97706', true)}>{hireRate}%</td>
                </tr>
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {/* ── By Office ── */}
      {officeRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Par bureau' : 'By Office'} color="#8B5CF6" />
          <TableCard title={FR ? 'Vue combinée par bureau (top 20)' : 'Combined View by Office (top 20)'}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Code', FR ? 'Bureau' : 'Office', 'Total', FR ? 'Embauché(e)s' : 'Hired', FR ? 'Intégration' : 'Onboarding', FR ? 'POD Actif' : 'POD Active', FR ? 'Taux emb.' : 'Hire Rate'].map((h, i) => (
                  <th key={h} style={TH(i > 1)}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {officeRows.slice(0, 20).map(o => (
                  <tr key={o.code} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), fontFamily: 'IBM Plex Mono, monospace', color: '#1E2769', paddingLeft: 20 }}>{o.code}</td>
                    <td style={TD(false, '#374151')}>{o.name}</td>
                    <td style={TD(true, '#111827', true)}>{o.total}</td>
                    <td style={TD(true, '#2DCDB8', true)}>{o.hired}</td>
                    <td style={TD(false, '#8B5CF6', true)}>{o.onboardingStarted}</td>
                    <td style={TD(true, '#059669', true)}>{o.podActive}</td>
                    <td style={TD(true, o.hireRate >= 30 ? '#059669' : '#D97706', true)}>{o.hireRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {total === 0 && (
        <div style={{ textAlign: 'center', padding: 56, color: '#9CA3AF', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', marginTop: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{FR ? 'Aucune donnée pour cette période.' : 'No data for the selected period.'}</div>
          <div style={{ fontSize: '0.78rem' }}>{FR ? 'Essayez une période plus longue ou retirez les filtres.' : 'Try a longer period or remove filters.'}</div>
        </div>
      )}
    </div>
  )
}

// ── Main Reports page ─────────────────────────────────────────────────────────
export default function Reports() {
  const language = useStore((s) => s.language)
  const role = useStore((s) => s.role)
  const candidates = useStore((s) => s.candidates)
  const managers = useStore((s) => s.managers)
  const FR = language === 'FR'

  const [preset, setPreset] = useState('monthly')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterOffice, setFilterOffice] = useState('')

  const { from: dateFrom, to: dateTo } = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo }
    return getDateRange(preset)
  }, [preset, customFrom, customTo])

  const roleLabel = {
    recruitment: FR ? 'Recrutement' : 'Recruitment',
    admin: 'Admin',
    operations: FR ? 'Opérations' : 'Operations',
  }[role] || ''

  const periodLabel = (() => {
    const p = PRESETS.find(p => p.key === preset)
    if (!p) return ''
    return FR ? p.FR : p.EN
  })()

  const handlePrint = () => {
    window.print()
  }

  const filterProps = {
    preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo,
    filterRegion, setFilterRegion, filterOffice, setFilterOffice,
    language, allManagers: managers,
  }

  const reportProps = { candidates, dateFrom, dateTo, filterRegion, filterOffice, language, managers }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }} className="no-print">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E2769', margin: 0, letterSpacing: '-0.02em' }}>
            {t('reports', language)}
            <span style={{ marginLeft: 10, fontSize: '0.75rem', fontWeight: 600, color: '#F0194A', background: '#FFF0F5', padding: '2px 10px', borderRadius: 20, verticalAlign: 'middle' }}>
              {roleLabel}
            </span>
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {periodLabel} · {dateFrom || '—'} → {dateTo || '—'}
          </p>
        </div>
        <button
          onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1E2769', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,39,105,0.2)' }}
        >
          ⬇ {FR ? 'Exporter PDF' : 'Export PDF'}
        </button>
      </div>

      {/* Print header (only shows on print) */}
      <div className="print-only" style={{ display: 'none', marginBottom: 20 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E2769' }}>
          {t('reports', language)} — {roleLabel}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>
          {periodLabel} · {dateFrom || '—'} → {dateTo || '—'}
          {filterRegion !== 'all' ? ` · ${filterRegion}` : ''}
          {filterOffice ? ` · ${filterOffice}` : ''}
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 20 }} className="no-print">
        <FilterBar {...filterProps} />
      </div>

      {/* Role-specific view */}
      {role === 'recruitment' && <RecruitmentReport {...reportProps} />}
      {role === 'admin' && <AdminReport {...reportProps} />}
      {role === 'operations' && <OperationsReport {...reportProps} />}
    </div>
  )
}
