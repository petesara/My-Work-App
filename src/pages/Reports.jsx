import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { REGIONS, OFFICES } from '../data/offices'

// ── Date helpers ──────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)
const getWeekStart = () => {
  const d = new Date(); const day = d.getDay()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + (day === 0 ? -6 : 1)).toISOString().slice(0, 10)
}
const getMonthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
const getQuarterStart = () => { const d = new Date(); return new Date(d.getFullYear(), Math.floor(d.getMonth()/3)*3, 1).toISOString().slice(0, 10) }
const getYearStart = () => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)

const daysBetween = (a, b) => {
  if (!a || !b) return null
  const d = Math.round((new Date(b) - new Date(a)) / 86400000)
  return d >= 0 ? d : null
}

// ── Statistical helpers ───────────────────────────────────────────────────────
const avgOf = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0

// Compute mean + stddev for an array of numbers
function stats(arr) {
  if (!arr.length) return { mean: 0, sd: 0 }
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  const sd = Math.sqrt(arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length)
  return { mean: Math.round(mean * 10) / 10, sd: Math.round(sd * 10) / 10 }
}

// Returns +X% / -X% badge text vs an average, or null if within noise
function vsBadge(value, mean, higherIsBetter = true) {
  if (mean === 0 || value == null) return null
  const diff = value - mean
  if (Math.abs(diff) < 3) return null // inside noise band
  const isGood = higherIsBetter ? diff > 0 : diff < 0
  return { text: `${diff > 0 ? '+' : ''}${Math.round(diff)}%`, good: isGood }
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending: '#F59E0B', Hired: '#10B981', Rejected: '#EF4444',
  'No Show': '#9CA3AF', 'Follow-up': '#3B82F6', '2nd Interview': '#8B5CF6',
}
const STATUSES = ['Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview']
const DOC_KEYS = ['directDeposit', 'sin', 'govId', 'contract', 'workPermit']

function StatCard({ label, value, sub, color, accent, small, flag }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12,
      padding: small ? '14px 18px' : '20px 22px',
      border: '1px solid #E8EAF6',
      boxShadow: '0 1px 4px rgba(30,39,105,0.06)',
      borderLeft: accent ? `4px solid ${accent}` : '4px solid transparent',
      position: 'relative',
    }}>
      {flag && (
        <div style={{ position: 'absolute', top: 10, right: 12, fontSize: '0.6rem', fontWeight: 700,
          background: flag === 'warn' ? '#FEF3C7' : flag === 'bad' ? '#FEE2E2' : '#ECFDF5',
          color: flag === 'warn' ? '#B45309' : flag === 'bad' ? '#DC2626' : '#059669',
          padding: '2px 7px', borderRadius: 8, letterSpacing: '0.06em' }}>
          {flag === 'warn' ? '⚠ WATCH' : flag === 'bad' ? '✕ ACTION' : '✓ GOOD'}
        </div>
      )}
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
      {data.filter(d => d.count > 0).map(({ label, count, color, rate }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>
              {count}
              <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.72rem', marginLeft: 4 }}>
                ({rate !== undefined ? `${rate}%` : `${pct(count, total)}%`})
              </span>
            </span>
          </div>
          <div style={{ background: '#F3F4F6', borderRadius: 6, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${rate !== undefined ? rate : pct(count, total)}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.4s', minWidth: count > 0 ? 6 : 0 }} />
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
        const ofFirst = first > 0 ? pct(step.count, first) : 0
        const dropPct = i > 0 && steps[i - 1].count > 0
          ? pct(steps[i - 1].count - step.count, steps[i - 1].count)
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

function TableCard({ title, subtitle, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E8EAF6', boxShadow: '0 1px 4px rgba(30,39,105,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '2px solid #F3F4F6', background: '#FAFBFF' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E2769' }}>{title}</span>
        {subtitle && <span style={{ marginLeft: 10, fontSize: '0.72rem', color: '#94A3B8' }}>{subtitle}</span>}
      </div>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  )
}

// Insights panel — auto-generated key findings
function InsightsPanel({ insights, FR }) {
  if (!insights.length) return null
  return (
    <div style={{
      background: 'linear-gradient(135deg, #F0F2FF 0%, #EEF9F7 100%)',
      borderRadius: 12, padding: '18px 22px',
      border: '1px solid #C7CAEA', marginBottom: 28,
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1E2769', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
        🔍 {FR ? 'Points clés' : 'Key Insights'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 8, padding: '12px 14px',
            border: `1px solid ${ins.color + '30' || '#E8EAF6'}`,
            borderLeft: `3px solid ${ins.color || '#1E2769'}`,
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: ins.color || '#1E2769', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {ins.icon} {ins.label}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.5, fontWeight: 500 }}>{ins.text}</div>
            {ins.sub && <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 3 }}>{ins.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// Speed breakdown — for admin onboarding pipeline
function SpeedBreakdown({ stages, FR }) {
  const total = stages.reduce((s, x) => s + (x.avg !== null ? x.avg : 0), 0)
  return (
    <div>
      {stages.map((stage) => (
        <div key={stage.label} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>{stage.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {stage.avg !== null ? (
                <>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: stage.avg > stage.target ? '#D97706' : '#059669' }}>
                    {stage.avg} {FR ? 'jours' : 'days'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: stage.avg > stage.target ? '#D97706' : '#059669',
                    background: stage.avg > stage.target ? '#FEF3C7' : '#ECFDF5',
                    padding: '1px 6px', borderRadius: 8 }}>
                    {stage.avg > stage.target ? `⚠ +${stage.avg - stage.target}d` : `✓ on track`}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>—</span>
              )}
            </div>
          </div>
          <div style={{ background: '#F3F4F6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            {stage.avg !== null && (
              <div style={{
                width: `${Math.min(pct(stage.avg, stage.target * 2.5), 100)}%`,
                background: stage.avg > stage.target ? '#F59E0B' : '#2DCDB8',
                height: '100%', borderRadius: 6, transition: 'width 0.4s',
              }} />
            )}
          </div>
          <div style={{ fontSize: '0.67rem', color: '#CBD5E1', marginTop: 3 }}>
            {FR ? `Cible: ${stage.target} jours` : `Target: ${stage.target} days`} · {stage.n} {FR ? 'candidat(e)s' : 'candidates'} measured
          </div>
        </div>
      ))}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #E8EAF6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {FR ? 'Total embauche → POD' : 'Total hire → POD'}
        </span>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1E2769' }}>
          {total > 0 ? `${total} ${FR ? 'jours' : 'days'}` : '—'}
        </span>
      </div>
    </div>
  )
}

// Table helpers
const TH = (right) => ({
  padding: '9px 12px', fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF',
  textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB', textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap',
})
const TD = (bold, color, right) => ({
  padding: '9px 12px', fontSize: '0.8rem', textAlign: right ? 'right' : 'left',
  fontWeight: bold ? 700 : 400, color: color || '#374151',
  borderBottom: '1px solid #F9FAFB',
})

// Vs-avg badge rendered inline in table cells
function VsBadge({ value, mean, higherIsBetter = true }) {
  const badge = vsBadge(value, mean, higherIsBetter)
  if (!badge) return null
  return (
    <span style={{
      marginLeft: 6, fontSize: '0.6rem', fontWeight: 700,
      color: badge.good ? '#059669' : '#DC2626',
      background: badge.good ? '#ECFDF5' : '#FEF2F2',
      padding: '1px 5px', borderRadius: 8, letterSpacing: '0.04em',
    }}>
      {badge.text}
    </span>
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

function FilterBar({ preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filterRegion, setFilterRegion, filterOffice, setFilterOffice, language, allManagers }) {
  const FR = language === 'FR'
  const inp = { padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.78rem', outline: 'none', background: 'white' }
  const btn = (active) => ({
    padding: '5px 12px', fontSize: '0.73rem', fontWeight: active ? 700 : 400,
    borderRadius: 6, border: active ? '1.5px solid #1E2769' : '1px solid #E5E7EB',
    background: active ? '#1E2769' : 'white', color: active ? 'white' : '#6B7280', cursor: 'pointer',
  })
  const officeOptions = allManagers && allManagers.length > 0 ? allManagers : OFFICES
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {PRESETS.map((p) => (
        <button key={p.key} onClick={() => setPreset(p.key)} style={btn(preset === p.key)}>
          {FR ? p.FR : p.EN}
        </button>
      ))}
      {preset === 'custom' && (
        <>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={inp} />
          <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>→</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={inp} />
        </>
      )}
      <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={inp}>
        <option value="all">{FR ? 'Toutes les régions' : 'All Regions'}</option>
        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} style={inp}>
        <option value="">{FR ? 'Tous les bureaux' : 'All Offices'}</option>
        {officeOptions.map((o) => <option key={o.code} value={o.code}>{o.code}{o.name ? ` — ${o.name}` : ''}</option>)}
      </select>
      {(filterOffice || filterRegion !== 'all') && (
        <button onClick={() => { setFilterOffice(''); setFilterRegion('all') }} style={{ ...inp, cursor: 'pointer', color: '#6B7280' }}>✕</button>
      )}
    </div>
  )
}

// ── Recruitment Report ────────────────────────────────────────────────────────
function RecruitmentReport({ candidates, dateFrom, dateTo, filterRegion, filterOffice, language, managers }) {
  const FR = language === 'FR'

  const filtered = useMemo(() => candidates.filter((c) => {
    if (c.isHistorical) return false
    if (filterOffice && !(c.officeCodes || [c.officeCode]).includes(filterOffice)) return false
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
  const hireRate = pct(hired, showed)
  const noShowRate = pct(noShow, total - pending)

  // ── Source efficiency ───────────────────────────────────────────────────
  const allSources = [...new Set(candidates.map(c => c.source).filter(Boolean))]
  const sourceRows = allSources.map(src => {
    const sc = filtered.filter(c => c.source === src)
    if (!sc.length) return null
    const scShowed = sc.length - sc.filter(c => c.status === 'No Show').length - sc.filter(c => c.status === 'Pending').length
    const scHired = sc.filter(c => c.status === 'Hired').length
    return {
      source: src,
      total: sc.length,
      showed: scShowed,
      hired: scHired,
      noShow: sc.filter(c => c.status === 'No Show').length,
      noShowRate: pct(sc.filter(c => c.status === 'No Show').length, sc.length - sc.filter(c => c.status === 'Pending').length),
      hireRate: pct(scHired, scShowed),
    }
  }).filter(Boolean).sort((a, b) => b.total - a.total)

  // ── Region & office breakdown ───────────────────────────────────────────
  const allOffices = managers && managers.length > 0 ? managers : OFFICES
  const regionRows = REGIONS.map(r => {
    const rc = filtered.filter(c => c.region === r)
    if (!rc.length) return null
    const rcShowed = rc.length - rc.filter(c => c.status === 'No Show').length - rc.filter(c => c.status === 'Pending').length
    const rcHired = rc.filter(c => c.status === 'Hired').length
    const rcNoShow = rc.filter(c => c.status === 'No Show').length
    return {
      region: r, total: rc.length, hired: rcHired,
      rejected: rc.filter(c => c.status === 'Rejected').length,
      noShow: rcNoShow,
      pending: rc.filter(c => c.status === 'Pending').length,
      followUp: rc.filter(c => c.status === 'Follow-up').length,
      second: rc.filter(c => c.status === '2nd Interview').length,
      hireRate: pct(rcHired, rcShowed),
      noShowRate: pct(rcNoShow, rc.length - rc.filter(c => c.status === 'Pending').length),
    }
  }).filter(Boolean)

  // Only include offices with enough candidates for meaningful comparison
  const officeRows = allOffices.map(o => {
    const oc = filtered.filter(c => (c.officeCodes || [c.officeCode]).includes(o.code))
    if (!oc.length) return null
    const ocShowed = oc.length - oc.filter(c => c.status === 'No Show').length - oc.filter(c => c.status === 'Pending').length
    const ocHired = oc.filter(c => c.status === 'Hired').length
    const ocNoShow = oc.filter(c => c.status === 'No Show').length
    return {
      code: o.code, name: o.name || '', total: oc.length, hired: ocHired,
      rejected: oc.filter(c => c.status === 'Rejected').length,
      noShow: ocNoShow,
      hireRate: pct(ocHired, ocShowed),
      noShowRate: pct(ocNoShow, oc.length - oc.filter(c => c.status === 'Pending').length),
    }
  }).filter(Boolean).sort((a, b) => b.hired - a.hired)

  // ── Statistical benchmarks ──────────────────────────────────────────────
  const regionHireRates = regionRows.map(r => r.hireRate)
  const regionNoShowRates = regionRows.map(r => r.noShowRate)
  const hireRateStats = stats(regionHireRates)
  const noShowRateStats = stats(regionNoShowRates)
  const officeHireRates = officeRows.filter(o => o.total >= 5).map(o => o.hireRate)
  const officeHireRateStats = stats(officeHireRates)

  const bestSource = [...sourceRows].sort((a, b) => b.hireRate - a.hireRate)[0]
  const worstNoShowRegion = [...regionRows].sort((a, b) => b.noShowRate - a.noShowRate)[0]
  const topOffice = officeRows.filter(o => o.total >= 5).sort((a, b) => b.hireRate - a.hireRate)[0]
  const bottomOffice = officeRows.filter(o => o.total >= 5).sort((a, b) => a.hireRate - b.hireRate)[0]
  const statusData = STATUSES.map(s => ({ label: t(s, language), count: filtered.filter(c => c.status === s).length, color: STATUS_COLORS[s] }))

  // ── Auto insights ───────────────────────────────────────────────────────
  const insights = []

  if (hireRate >= 30) {
    insights.push({ icon: '✓', label: FR ? 'Taux d\'embauche' : 'Hire Rate', color: '#059669',
      text: FR ? `Taux d'embauche de ${hireRate}% — au-dessus de la cible de 30%.` : `Hire rate of ${hireRate}% — above the 30% target.`,
      sub: `${hired} ${FR ? 'embauché(e)s' : 'hired'} / ${showed} ${FR ? 'présenté(e)s' : 'showed'}` })
  } else {
    insights.push({ icon: '↓', label: FR ? 'Taux d\'embauche' : 'Hire Rate', color: '#D97706',
      text: FR ? `Taux d'embauche de ${hireRate}% — en dessous de la cible de 30%. Révision du processus recommandée.` : `Hire rate of ${hireRate}% — below 30% target. Consider reviewing interview process.`,
      sub: `${hired} / ${showed} ${FR ? 'présenté(e)s' : 'showed'}` })
  }

  if (noShowRate > 20) {
    insights.push({ icon: '⚠', label: FR ? 'Taux d\'absence' : 'No-Show Rate', color: '#DC2626',
      text: FR ? `${noShowRate}% de taux d'absence — impact significatif sur la capacité de recrutement.` : `${noShowRate}% no-show rate — significantly impacting recruiting capacity.`,
      sub: FR ? `${noShow} absent(e)s sur ${total - pending} convoqué(e)s` : `${noShow} no-shows out of ${total - pending} called` })
  }

  if (bestSource && bestSource.total >= 3) {
    insights.push({ icon: '★', label: FR ? 'Meilleure source' : 'Best Source', color: '#8B5CF6',
      text: FR
        ? `"${bestSource.source}" génère le meilleur taux de conversion à ${bestSource.hireRate}% (${bestSource.hired}/${bestSource.showed}).`
        : `"${bestSource.source}" has the best conversion at ${bestSource.hireRate}% (${bestSource.hired}/${bestSource.showed}).`,
      sub: FR ? `${bestSource.total} candidat(e)s total` : `${bestSource.total} total candidates` })
  }

  if (worstNoShowRegion && worstNoShowRegion.noShowRate > 20 && worstNoShowRegion.total >= 5) {
    insights.push({ icon: '⚠', label: FR ? 'Absence par région' : 'No-Show by Region', color: '#F59E0B',
      text: FR
        ? `Région ${worstNoShowRegion.region}: ${worstNoShowRegion.noShowRate}% d'absence — la plus haute du portefeuille.`
        : `Region ${worstNoShowRegion.region} has the highest no-show rate at ${worstNoShowRegion.noShowRate}%.`,
      sub: `${worstNoShowRegion.noShow} / ${worstNoShowRegion.total - worstNoShowRegion.pending} called` })
  }

  if (topOffice && topOffice.code !== bottomOffice?.code) {
    insights.push({ icon: '↑↓', label: FR ? 'Écart bureaux' : 'Office Performance Gap', color: '#3B82F6',
      text: FR
        ? `Meilleur: ${topOffice.code} (${topOffice.hireRate}%) | Moins performant: ${bottomOffice?.code} (${bottomOffice?.hireRate}%) — écart de ${topOffice.hireRate - (bottomOffice?.hireRate || 0)} points.`
        : `Best: ${topOffice.code} (${topOffice.hireRate}%) | Lowest: ${bottomOffice?.code} (${bottomOffice?.hireRate}%) — ${topOffice.hireRate - (bottomOffice?.hireRate || 0)} pt spread.`,
      sub: FR ? 'Bureaux avec ≥5 candidat(e)s' : 'Offices with ≥5 candidates' })
  }

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 56, color: '#9CA3AF', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', marginTop: 24 }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{FR ? 'Aucune donnée pour cette période.' : 'No data for the selected period.'}</div>
        <div style={{ fontSize: '0.78rem' }}>{FR ? 'Essayez une période plus longue ou retirez les filtres.' : 'Try a longer period or remove filters.'}</div>
      </div>
    )
  }

  return (
    <div>
      <InsightsPanel insights={insights} FR={FR} />

      {/* ── Overview KPIs ── */}
      <SectionDivider title={FR ? 'Aperçu de la période' : 'Period Overview'} color="#1E2769" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label={FR ? 'Total candidat(e)s' : 'Total Candidates'} value={total} sub={`${dateFrom || '—'} → ${dateTo || '—'}`} accent="#1E2769" />
        <StatCard label={FR ? 'Embauché(e)s' : 'Hired'} value={hired} sub={`${FR ? 'sur' : 'of'} ${showed} ${FR ? 'présenté(e)s' : 'who showed'}`} color="#059669" accent="#2DCDB8" />
        <StatCard label={FR ? 'Taux d\'embauche' : 'Hire Rate'} value={`${hireRate}%`}
          sub={hireRate >= 30 ? (FR ? '✓ Au-dessus de la cible (30%)' : '✓ Above target (30%)') : (FR ? '↓ Sous la cible (30%)' : '↓ Below target (30%)')}
          color={hireRate >= 30 ? '#059669' : '#D97706'} accent={hireRate >= 30 ? '#2DCDB8' : '#F59E0B'}
          flag={hireRate >= 30 ? 'good' : hireRate < 20 ? 'bad' : 'warn'} />
        <StatCard label={FR ? 'Taux d\'absence' : 'No-Show Rate'} value={`${noShowRate}%`}
          sub={`${noShow} ${FR ? 'absent(e)s' : 'no-shows'} / ${total - pending} ${FR ? 'convoqué(e)s' : 'called'}`}
          color={noShowRate > 25 ? '#DC2626' : '#64748B'} accent={noShowRate > 25 ? '#F0194A' : '#E8EAF6'}
          flag={noShowRate > 30 ? 'bad' : noShowRate > 20 ? 'warn' : 'good'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label={FR ? 'Rejeté(e)s' : 'Rejected'} value={rejected} sub={`${pct(rejected, showed)}% ${FR ? 'des présenté(e)s' : 'of showed'}`} color="#EF4444" accent="#F0194A" small />
        <StatCard label={FR ? 'En attente' : 'Pending'} value={pending} sub={`${pct(pending, total)}% ${FR ? 'du total' : 'of total'}`} color="#F59E0B" accent="#F59E0B" small />
        <StatCard label={FR ? 'Suivi' : 'Follow-up'} value={followUp} sub={`${pct(followUp, showed)}% ${FR ? 'des présenté(e)s' : 'of showed'}`} color="#3B82F6" accent="#3B82F6" small />
        <StatCard label={FR ? '2e entrevue' : '2nd Interview'} value={secondInt} sub={`${pct(secondInt, showed)}% ${FR ? 'des présenté(e)s' : 'of showed'}`} color="#8B5CF6" accent="#8B5CF6" small />
      </div>

      {/* ── Funnel ── */}
      <SectionDivider title={FR ? 'Entonnoir de recrutement' : 'Recruitment Funnel'} color="#2DCDB8" />
      <Card>
        <Funnel steps={[
          { label: FR ? 'En pipeline' : 'In Pipeline', count: total, color: '#1E2769' },
          { label: FR ? 'Présenté(e)s' : 'Showed Up', count: showed, color: '#3B82F6' },
          { label: FR ? '2e entrevue' : '2nd Interview', count: secondInt, color: '#8B5CF6' },
          { label: FR ? 'Embauché(e)s' : 'Hired', count: hired, color: '#059669' },
        ]} />
        <div style={{ display: 'flex', gap: 20, marginTop: 18, paddingTop: 14, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{FR ? 'Absent(e)s' : 'No-Shows'}: <strong style={{ color: '#9CA3AF' }}>{noShow}</strong></span>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{FR ? 'Rejeté(e)s' : 'Rejected'}: <strong style={{ color: '#EF4444' }}>{rejected}</strong></span>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{FR ? 'En attente' : 'Still Pending'}: <strong style={{ color: '#F59E0B' }}>{pending}</strong></span>
        </div>
      </Card>

      {/* ── Source Efficiency ── */}
      {sourceRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Efficacité par source' : 'Source Efficiency'} color="#8B5CF6" />
          <TableCard
            title={FR ? 'Taux de conversion par source' : 'Conversion Rate by Source'}
            subtitle={FR ? '— les % reflètent la qualité réelle de chaque source' : '— % reflects true quality of each source, not volume'}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[
                  FR ? 'Source' : 'Source',
                  FR ? 'Total' : 'Total',
                  FR ? 'Présenté(e)s' : 'Showed',
                  FR ? 'Embauché(e)s' : 'Hired',
                  FR ? 'Taux conversion' : 'Conversion Rate',
                  FR ? 'Absent(e)s' : 'No-Shows',
                  FR ? 'Taux absence' : 'No-Show Rate',
                ].map((h, i) => <th key={h} style={TH(i > 1)}>{h}</th>)}
              </tr></thead>
              <tbody>
                {sourceRows.map(s => (
                  <tr key={s.source} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>{s.source}</td>
                    <td style={TD(false, '#374151', true)}>{s.total}</td>
                    <td style={TD(false, '#374151', true)}>{s.showed}</td>
                    <td style={TD(true, '#059669', true)}>{s.hired}</td>
                    <td style={{ ...TD(true, s.hireRate >= 30 ? '#059669' : '#D97706', true) }}>
                      {s.hireRate}%
                      <VsBadge value={s.hireRate} mean={hireRate} higherIsBetter />
                    </td>
                    <td style={TD(false, '#9CA3AF', true)}>{s.noShow}</td>
                    <td style={{ ...TD(false, s.noShowRate > 20 ? '#DC2626' : '#9CA3AF', true) }}>
                      {s.noShowRate}%
                      <VsBadge value={s.noShowRate} mean={noShowRate} higherIsBetter={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {/* ── Breakdown ── */}
      <SectionDivider title={FR ? 'Répartition par statut' : 'Status Breakdown'} color="#F0194A" />
      <Card>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 16 }}>{FR ? 'Distribution des statuts' : 'Status Distribution'}</div>
        <BarChart data={statusData} total={total} />
      </Card>

      {/* ── By Region ── */}
      {regionRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Performance par région' : 'Performance by Region'} color="#F59E0B" />
          <TableCard
            title={FR ? 'Résultats normalisés par région' : 'Normalized Results by Region'}
            subtitle={FR ? '— les taux permettent une comparaison équitable' : '— rates allow fair comparison regardless of volume'}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[
                  FR ? 'Région' : 'Region', 'Total',
                  FR ? 'Embauché(e)s' : 'Hired',
                  FR ? 'Taux emb.' : 'Hire Rate',
                  FR ? 'Absent(e)s' : 'No-Shows',
                  FR ? 'Taux absence' : 'No-Show Rate',
                  FR ? 'En attente' : 'Pending', FR ? 'Suivi' : 'Follow-up', '2nd',
                ].map((h, i) => <th key={h} style={TH(i > 0)}>{h}</th>)}
              </tr></thead>
              <tbody>
                {regionRows.map(r => (
                  <tr key={r.region} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), paddingLeft: 20 }}><span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0194A', fontWeight: 700 }}>{r.region}</span></td>
                    <td style={TD(true, '#111827', true)}>{r.total}</td>
                    <td style={TD(true, '#059669', true)}>{r.hired}</td>
                    <td style={{ ...TD(true, r.hireRate >= 30 ? '#059669' : '#D97706', true) }}>
                      {r.hireRate}%
                      <VsBadge value={r.hireRate} mean={hireRateStats.mean} higherIsBetter />
                    </td>
                    <td style={TD(false, '#9CA3AF', true)}>{r.noShow}</td>
                    <td style={{ ...TD(false, r.noShowRate > 20 ? '#DC2626' : '#9CA3AF', true) }}>
                      {r.noShowRate}%
                      <VsBadge value={r.noShowRate} mean={noShowRateStats.mean} higherIsBetter={false} />
                    </td>
                    <td style={TD(false, '#F59E0B', true)}>{r.pending}</td>
                    <td style={TD(false, '#3B82F6', true)}>{r.followUp}</td>
                    <td style={TD(false, '#8B5CF6', true)}>{r.second}</td>
                  </tr>
                ))}
                <tr style={{ background: '#F0F2FF', borderTop: '2px solid #E8EAF6' }}>
                  <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>TOTAL / AVG</td>
                  <td style={TD(true, '#111827', true)}>{total}</td>
                  <td style={TD(true, '#059669', true)}>{hired}</td>
                  <td style={TD(true, hireRate >= 30 ? '#059669' : '#D97706', true)}>{hireRate}% <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#94A3B8' }}>avg</span></td>
                  <td style={TD(true, '#9CA3AF', true)}>{noShow}</td>
                  <td style={TD(true, noShowRate > 20 ? '#DC2626' : '#9CA3AF', true)}>{noShowRate}% <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#94A3B8' }}>avg</span></td>
                  <td style={TD(true, '#F59E0B', true)}>{pending}</td>
                  <td style={TD(true, '#3B82F6', true)}>{followUp}</td>
                  <td style={TD(true, '#8B5CF6', true)}>{secondInt}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ padding: '10px 20px', background: '#F9FAFB', borderTop: '1px solid #E8EAF6', fontSize: '0.7rem', color: '#9CA3AF' }}>
              {FR
                ? `Écart-type taux d'embauche: ±${hireRateStats.sd}pp — ${hireRateStats.sd > 10 ? 'forte disparité entre régions' : 'régions relativement homogènes'}`
                : `Hire rate std dev: ±${hireRateStats.sd}pp — ${hireRateStats.sd > 10 ? 'high variation between regions' : 'regions relatively consistent'}`}
            </div>
          </TableCard>
        </>
      )}

      {/* ── By Office ── */}
      {officeRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Performance par bureau' : 'Performance by Office'} color="#8B5CF6" />
          <TableCard
            title={FR ? 'Résultats par bureau (top 20 par embauches)' : 'Results by Office (top 20 by hires)'}
            subtitle={FR ? '— taux normalisé sur les candidat(e)s présenté(e)s, pas le volume total' : '— rate normalized on showed candidates, not total volume'}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Code', FR ? 'Bureau' : 'Office', 'Total', FR ? 'Embauché(e)s' : 'Hired',
                  FR ? 'Taux emb.' : 'Hire Rate', FR ? 'Absent(e)s' : 'No-Shows',
                  FR ? 'Taux absence' : 'No-Show Rate',
                ].map((h, i) => <th key={h} style={TH(i > 1)}>{h}</th>)}
              </tr></thead>
              <tbody>
                {officeRows.slice(0, 20).map(o => (
                  <tr key={o.code} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), fontFamily: 'IBM Plex Mono, monospace', color: '#1E2769', paddingLeft: 20 }}>{o.code}</td>
                    <td style={TD(false, '#374151')}>{o.name}</td>
                    <td style={TD(false, '#374151', true)}>{o.total}</td>
                    <td style={TD(true, '#059669', true)}>{o.hired}</td>
                    <td style={{ ...TD(true, o.hireRate >= 30 ? '#059669' : '#D97706', true) }}>
                      {o.hireRate}%
                      {o.total >= 5 && <VsBadge value={o.hireRate} mean={officeHireRateStats.mean} higherIsBetter />}
                    </td>
                    <td style={TD(false, '#9CA3AF', true)}>{o.noShow}</td>
                    <td style={{ ...TD(false, o.noShowRate > 20 ? '#DC2626' : '#9CA3AF', true) }}>
                      {o.noShowRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {officeHireRates.length > 2 && (
              <div style={{ padding: '10px 20px', background: '#F9FAFB', borderTop: '1px solid #E8EAF6', fontSize: '0.7rem', color: '#9CA3AF' }}>
                {FR
                  ? `Moyenne des bureaux (≥5 candidat(e)s): ${officeHireRateStats.mean}% | Écart-type: ±${officeHireRateStats.sd}pp`
                  : `Office avg (≥5 candidates): ${officeHireRateStats.mean}% | Std dev: ±${officeHireRateStats.sd}pp`}
                {' · '}
                {FR ? 'Badges +/- indiquent la déviation vs la moyenne.' : 'Badges show deviation vs average.'}
              </div>
            )}
          </TableCard>
        </>
      )}

      {/* ── Rehire Analysis ── */}
      {(() => {
        const rehires = filtered.filter(c => c.isRehire)
        const newHires = filtered.filter(c => !c.isRehire)
        if (rehires.length === 0 && newHires.length === 0) return null
        const rehireShowed = rehires.filter(c => c.status !== 'No Show' && c.status !== 'Pending').length
        const rehireHired = rehires.filter(c => c.status === 'Hired').length
        const newShowed = newHires.filter(c => c.status !== 'No Show' && c.status !== 'Pending').length
        const newHired = newHires.filter(c => c.status === 'Hired').length
        const rehireRate = pct(rehireHired, rehireShowed)
        const newRate = pct(newHired, newShowed)
        return (
          <>
            <SectionDivider title={FR ? 'Réembauches vs Nouvelles candidatures' : 'Rehires vs New Candidates'} color="#F59E0B" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#D97706', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {FR ? '🔄 Réembauches' : '🔄 Rehires'} <span style={{ fontWeight: 400, color: '#9CA3AF' }}>({rehires.length})</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', lineHeight: 1 }}>{rehireRate}%</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 4 }}>{FR ? 'Taux embauche' : 'Hire rate'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#374151', lineHeight: 1 }}>{rehireHired}</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 4 }}>{FR ? 'Embauché(e)s' : 'Hired'}</div>
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1E2769', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {FR ? '✨ Nouveaux' : '✨ New Candidates'} <span style={{ fontWeight: 400, color: '#9CA3AF' }}>({newHires.length})</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E2769', lineHeight: 1 }}>{newRate}%</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 4 }}>{FR ? 'Taux embauche' : 'Hire rate'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#374151', lineHeight: 1 }}>{newHired}</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 4 }}>{FR ? 'Embauché(e)s' : 'Hired'}</div>
                  </div>
                </div>
              </Card>
            </div>
            {(rehires.length > 0 && newHires.length > 0) && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: rehireRate > newRate ? '#F0FDF4' : '#FFF7ED', borderRadius: 8, border: `1px solid ${rehireRate > newRate ? '#BBF7D0' : '#FDE68A'}`, fontSize: '0.78rem', color: '#374151' }}>
                {FR
                  ? `Les réembauches ont un taux de conversion ${rehireRate > newRate ? `de ${rehireRate - newRate}pp supérieur` : `de ${newRate - rehireRate}pp inférieur`} aux nouveaux candidat(e)s.`
                  : `Rehires have a hire rate ${rehireRate > newRate ? `${rehireRate - newRate}pp higher` : `${newRate - rehireRate}pp lower`} than new candidates.`}
              </div>
            )}
          </>
        )
      })()}

      {/* ── Medium Breakdown ── */}
      {(() => {
        const mediums = [...new Set(filtered.map(c => c.medium).filter(Boolean))]
        if (mediums.length < 2) return null
        const mediumRows = mediums.map(med => {
          const mc = filtered.filter(c => c.medium === med)
          const mcShowed = mc.filter(c => c.status !== 'No Show' && c.status !== 'Pending').length
          const mcHired = mc.filter(c => c.status === 'Hired').length
          const mcNoShow = mc.filter(c => c.status === 'No Show').length
          return {
            medium: med, total: mc.length, hired: mcHired,
            hireRate: pct(mcHired, mcShowed),
            noShowRate: pct(mcNoShow, mc.length - mc.filter(c => c.status === 'Pending').length),
          }
        }).sort((a, b) => b.total - a.total)
        const medHireRates = mediumRows.map(m => m.hireRate)
        const medStats = stats(medHireRates)
        return (
          <>
            <SectionDivider title={FR ? 'Performance par médium' : 'Performance by Medium'} color="#8B5CF6" />
            <TableCard title={FR ? 'Taux de conversion par médium' : 'Conversion Rate by Medium'} subtitle={FR ? '— Streets vs Doors vs Malls vs Phones' : '— compares recruiting channels'}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {[FR ? 'Médium' : 'Medium', 'Total', FR ? 'Emb.' : 'Hired',
                    FR ? 'Taux emb.' : 'Hire Rate', FR ? 'Taux absence' : 'No-Show Rate',
                  ].map((h, i) => <th key={h} style={TH(i > 0)}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {mediumRows.map(m => (
                    <tr key={m.medium} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>{m.medium}</td>
                      <td style={TD(false, '#374151', true)}>{m.total}</td>
                      <td style={TD(true, '#059669', true)}>{m.hired}</td>
                      <td style={{ ...TD(true, m.hireRate >= 30 ? '#059669' : '#D97706', true) }}>
                        {m.hireRate}%
                        {m.total >= 3 && <VsBadge value={m.hireRate} mean={medStats.mean} higherIsBetter />}
                      </td>
                      <td style={{ ...TD(false, m.noShowRate > 20 ? '#DC2626' : '#9CA3AF', true) }}>
                        {m.noShowRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
          </>
        )
      })()}

      {/* ── Language Breakdown ── */}
      {(() => {
        const enCandidates = filtered.filter(c => c.languagePreference !== 'FR')
        const frCandidates = filtered.filter(c => c.languagePreference === 'FR')
        if (!frCandidates.length) return null
        const enShowed = enCandidates.filter(c => c.status !== 'No Show' && c.status !== 'Pending').length
        const frShowed = frCandidates.filter(c => c.status !== 'No Show' && c.status !== 'Pending').length
        const enHired = enCandidates.filter(c => c.status === 'Hired').length
        const frHired = frCandidates.filter(c => c.status === 'Hired').length
        return (
          <>
            <SectionDivider title={FR ? 'Répartition linguistique' : 'Language Breakdown'} color="#3B82F6" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <StatCard label="EN Candidates" value={enCandidates.length}
                sub={`${pct(enHired, enShowed)}% ${FR ? 'taux embauche' : 'hire rate'} · ${enHired} ${FR ? 'embauché(e)s' : 'hired'}`}
                color="#1E2769" accent="#1E2769" small />
              <StatCard label="FR Candidates" value={frCandidates.length}
                sub={`${pct(frHired, frShowed)}% ${FR ? 'taux embauche' : 'hire rate'} · ${frHired} ${FR ? 'embauché(e)s' : 'hired'}`}
                color="#3B82F6" accent="#3B82F6" small />
            </div>
          </>
        )
      })()}

      {/* ── Interviewer Performance ── */}
      {(() => {
        const interviewerMap = {}
        filtered.forEach(c => {
          if (!c.interviewer) return
          const key = c.interviewer.trim()
          if (!interviewerMap[key]) interviewerMap[key] = { name: key, total: 0, showed: 0, hired: 0, noShow: 0 }
          interviewerMap[key].total++
          if (c.status !== 'No Show' && c.status !== 'Pending') interviewerMap[key].showed++
          if (c.status === 'Hired') interviewerMap[key].hired++
          if (c.status === 'No Show') interviewerMap[key].noShow++
        })
        const interviewerRows = Object.values(interviewerMap)
          .filter(i => i.total >= 3)
          .map(i => ({ ...i, hireRate: pct(i.hired, i.showed), noShowRate: pct(i.noShow, i.total) }))
          .sort((a, b) => b.hired - a.hired)
        if (interviewerRows.length < 2) return null
        const intHireRates = interviewerRows.map(i => i.hireRate)
        const intStats = stats(intHireRates)
        return (
          <>
            <SectionDivider title={FR ? 'Performance par intervieweur' : 'Interviewer Performance'} color="#2DCDB8" />
            <TableCard
              title={FR ? 'Taux de conversion par intervieweur' : 'Conversion Rate by Interviewer'}
              subtitle={FR ? '— minimum 3 candidat(e)s requis' : '— minimum 3 candidates required for inclusion'}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {[FR ? 'Intervieweur' : 'Interviewer', 'Total', FR ? 'Présenté(e)s' : 'Showed',
                    FR ? 'Emb.' : 'Hired', FR ? 'Taux emb.' : 'Hire Rate', FR ? 'Absent(e)s' : 'No-Shows',
                  ].map((h, i) => <th key={h} style={TH(i > 0)}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {interviewerRows.map(i => (
                    <tr key={i.name} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>{i.name}</td>
                      <td style={TD(false, '#374151', true)}>{i.total}</td>
                      <td style={TD(false, '#374151', true)}>{i.showed}</td>
                      <td style={TD(true, '#059669', true)}>{i.hired}</td>
                      <td style={{ ...TD(true, i.hireRate >= 30 ? '#059669' : '#D97706', true) }}>
                        {i.hireRate}%
                        <VsBadge value={i.hireRate} mean={intStats.mean} higherIsBetter />
                      </td>
                      <td style={TD(false, '#9CA3AF', true)}>{i.noShow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 20px', background: '#F9FAFB', borderTop: '1px solid #E8EAF6', fontSize: '0.7rem', color: '#9CA3AF' }}>
                {FR
                  ? `Moyenne du groupe: ${intStats.mean}% · Écart-type: ±${intStats.sd}pp`
                  : `Group average: ${intStats.mean}% · Std dev: ±${intStats.sd}pp`}
              </div>
            </TableCard>
          </>
        )
      })()}
    </div>
  )
}

// ── Admin Report ──────────────────────────────────────────────────────────────
function AdminReport({ candidates, dateFrom, dateTo, filterRegion, filterOffice, language, managers }) {
  const FR = language === 'FR'

  const hiredCandidates = useMemo(() => candidates.filter((c) => {
    if (c.isHistorical) return false
    if (c.status !== 'Hired') return false
    if (filterOffice && !(c.officeCodes || [c.officeCode]).includes(filterOffice)) return false
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    const d = c.interviewDate || c.createdAt?.slice(0, 10) || ''
    if (dateFrom && d < dateFrom) return false
    if (dateTo && d > dateTo) return false
    return true
  }), [candidates, dateFrom, dateTo, filterOffice, filterRegion])

  const total = hiredCandidates.length
  const adpSent = hiredCandidates.filter(c => c.onboarding?.adpSentDate).length
  const adpComplete = hiredCandidates.filter(c => c.onboarding?.adpCompleteDate).length
  const podActive = hiredCandidates.filter(c => c.onboarding?.podActivatedDate).length
  const withMissingDocs = hiredCandidates.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean))
  const missingDocsCount = withMissingDocs.length
  const missingDocsRate = pct(missingDocsCount, total)

  // ── Onboarding speed — per-stage breakdown ──────────────────────────────
  const stage1Times = hiredCandidates
    .filter(c => c.interviewDate && c.onboarding?.adpSentDate)
    .map(c => daysBetween(c.interviewDate, c.onboarding.adpSentDate))
    .filter(d => d !== null)
  const stage2Times = hiredCandidates
    .filter(c => c.onboarding?.adpSentDate && c.onboarding?.adpCompleteDate)
    .map(c => daysBetween(c.onboarding.adpSentDate, c.onboarding.adpCompleteDate))
    .filter(d => d !== null)
  const stage3Times = hiredCandidates
    .filter(c => c.onboarding?.adpCompleteDate && c.onboarding?.podActivatedDate)
    .map(c => daysBetween(c.onboarding.adpCompleteDate, c.onboarding.podActivatedDate))
    .filter(d => d !== null)
  const totalTimes = hiredCandidates
    .filter(c => c.interviewDate && c.onboarding?.podActivatedDate)
    .map(c => daysBetween(c.interviewDate, c.onboarding.podActivatedDate))
    .filter(d => d !== null)

  const avgStage1 = avgOf(stage1Times)
  const avgStage2 = avgOf(stage2Times)
  const avgStage3 = avgOf(stage3Times)
  const avgTotal = avgOf(totalTimes)

  const speedStages = [
    { label: FR ? 'Embauche → ADP envoyé' : 'Hire → ADP Sent', avg: avgStage1, target: 3, n: stage1Times.length },
    { label: FR ? 'ADP envoyé → ADP complété' : 'ADP Sent → ADP Complete', avg: avgStage2, target: 7, n: stage2Times.length },
    { label: FR ? 'ADP complété → POD actif' : 'ADP Complete → POD Active', avg: avgStage3, target: 3, n: stage3Times.length },
  ]

  // ── Missing docs breakdown ──────────────────────────────────────────────
  const docBreakdown = DOC_KEYS.map(key => ({
    key, label: t(key, language),
    count: hiredCandidates.filter(c => c.onboarding?.missingDocs?.[key]).length,
    rate: pct(hiredCandidates.filter(c => c.onboarding?.missingDocs?.[key]).length, total),
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count)

  // ── Region & office breakdown ───────────────────────────────────────────
  const allOffices = managers && managers.length > 0 ? managers : OFFICES
  const regionRows = REGIONS.map(r => {
    const rc = hiredCandidates.filter(c => c.region === r)
    if (!rc.length) return null
    const rcMissing = rc.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean)).length
    const rcPodTimes = rc.filter(c => c.interviewDate && c.onboarding?.podActivatedDate)
      .map(c => daysBetween(c.interviewDate, c.onboarding.podActivatedDate)).filter(d => d !== null)
    return {
      region: r, total: rc.length,
      adpSent: rc.filter(c => c.onboarding?.adpSentDate).length,
      adpComplete: rc.filter(c => c.onboarding?.adpCompleteDate).length,
      podActive: rc.filter(c => c.onboarding?.podActivatedDate).length,
      missingDocs: rcMissing,
      missingDocsRate: pct(rcMissing, rc.length),
      avgDaysToPod: avgOf(rcPodTimes),
      podRate: pct(rc.filter(c => c.onboarding?.podActivatedDate).length, rc.length),
    }
  }).filter(Boolean)

  const officeRows = allOffices.map(o => {
    const oc = hiredCandidates.filter(c => (c.officeCodes || [c.officeCode]).includes(o.code))
    if (!oc.length) return null
    const ocMissing = oc.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean)).length
    const ocPodTimes = oc.filter(c => c.interviewDate && c.onboarding?.podActivatedDate)
      .map(c => daysBetween(c.interviewDate, c.onboarding.podActivatedDate)).filter(d => d !== null)
    return {
      code: o.code, name: o.name || '', total: oc.length,
      adpSent: oc.filter(c => c.onboarding?.adpSentDate).length,
      adpComplete: oc.filter(c => c.onboarding?.adpCompleteDate).length,
      podActive: oc.filter(c => c.onboarding?.podActivatedDate).length,
      missingDocs: ocMissing,
      missingDocsRate: pct(ocMissing, oc.length),
      avgDaysToPod: avgOf(ocPodTimes),
      podRate: pct(oc.filter(c => c.onboarding?.podActivatedDate).length, oc.length),
    }
  }).filter(Boolean).sort((a, b) => b.total - a.total)

  // ── Statistical benchmarks ──────────────────────────────────────────────
  const regionMissingRates = regionRows.map(r => r.missingDocsRate)
  const missingRateStats = stats(regionMissingRates)
  const regionPodTimes = regionRows.map(r => r.avgDaysToPod).filter(d => d !== null)
  const podTimeStats = stats(regionPodTimes)

  const worstMissingRegion = [...regionRows].sort((a, b) => b.missingDocsRate - a.missingDocsRate)[0]
  const slowestRegion = [...regionRows].filter(r => r.avgDaysToPod !== null).sort((a, b) => b.avgDaysToPod - a.avgDaysToPod)[0]
  const bottleneck = speedStages.filter(s => s.avg !== null).sort((a, b) => (b.avg/b.target) - (a.avg/a.target))[0]

  // ── Auto insights ───────────────────────────────────────────────────────
  const insights = []

  const podRate = pct(podActive, total)
  if (podRate >= 80) {
    insights.push({ icon: '✓', label: FR ? 'Intégration complétée' : 'Onboarding Completion', color: '#059669',
      text: FR ? `${podRate}% des embauché(e)s ont atteint POD actif — excellent taux de complétion.` : `${podRate}% of hires reached POD active — excellent completion rate.`,
      sub: `${podActive} / ${total}` })
  } else if (podRate < 60) {
    insights.push({ icon: '⚠', label: FR ? 'Intégration incomplète' : 'Incomplete Onboarding', color: '#D97706',
      text: FR ? `Seulement ${podRate}% ont atteint POD actif. ${total - podActive} embauché(e)s n'ont pas terminé.` : `Only ${podRate}% reached POD active. ${total - podActive} hires haven't completed.`,
      sub: `${podActive} / ${total}` })
  }

  if (missingDocsRate > 20) {
    insights.push({ icon: '⚠', label: FR ? 'Documents manquants' : 'Missing Documents', color: '#DC2626',
      text: FR ? `${missingDocsRate}% des embauché(e)s ont des documents manquants. ${docBreakdown[0] ? `Document le plus problématique: "${docBreakdown[0].label}" (${docBreakdown[0].count} cas).` : ''}` : `${missingDocsRate}% of hires have missing docs. ${docBreakdown[0] ? `Top missing: "${docBreakdown[0].label}" (${docBreakdown[0].count} cases).` : ''}`,
      sub: `${missingDocsCount} / ${total} ${FR ? 'candidat(e)s affecté(e)s' : 'candidates affected'}` })
  } else if (total > 0) {
    insights.push({ icon: '✓', label: FR ? 'Documents manquants' : 'Missing Documents', color: '#059669',
      text: FR ? `${missingDocsRate}% de taux de documents manquants — sous le seuil de 20%.` : `${missingDocsRate}% missing docs rate — under 20% threshold.`,
      sub: `${missingDocsCount} / ${total}` })
  }

  if (avgTotal !== null) {
    insights.push({ icon: avgTotal > 13 ? '⚠' : '✓', label: FR ? 'Délai moyen embauche → POD' : 'Avg. Hire to POD', color: avgTotal > 13 ? '#D97706' : '#059669',
      text: FR ? `Délai moyen de ${avgTotal} jours entre l'embauche et le POD actif.${avgTotal > 13 ? ' Au-dessus de la cible de 13 jours.' : ' Dans la cible.'}` : `Average ${avgTotal} days from hire to POD active.${avgTotal > 13 ? ' Above 13-day target.' : ' Within target.'}`,
      sub: `${FR ? 'Mesuré sur' : 'Measured on'} ${totalTimes.length} ${FR ? 'candidat(e)s' : 'candidates'}` })
  }

  if (bottleneck && bottleneck.avg > bottleneck.target) {
    insights.push({ icon: '↓', label: FR ? 'Goulot d\'étranglement' : 'Bottleneck Identified', color: '#8B5CF6',
      text: FR ? `Étape la plus lente: "${bottleneck.label}" (${bottleneck.avg} jours, cible ${bottleneck.target}j). Opportunité d'amélioration de processus.` : `Slowest stage: "${bottleneck.label}" (${bottleneck.avg} days, target ${bottleneck.target}d). Process improvement opportunity.`,
      sub: `${FR ? 'Cible:' : 'Target:'} ${bottleneck.target} ${FR ? 'jours' : 'days'}` })
  }

  if (worstMissingRegion && worstMissingRegion.missingDocsRate > missingRateStats.mean + missingRateStats.sd && worstMissingRegion.total >= 3) {
    insights.push({ icon: '⚠', label: FR ? 'Région à surveiller' : 'Region Flagged', color: '#F59E0B',
      text: FR ? `Région ${worstMissingRegion.region}: ${worstMissingRegion.missingDocsRate}% de documents manquants — au-dessus de la moyenne nationale (${Math.round(missingRateStats.mean)}%).` : `Region ${worstMissingRegion.region}: ${worstMissingRegion.missingDocsRate}% missing docs — above national avg (${Math.round(missingRateStats.mean)}%).`,
      sub: `${worstMissingRegion.missingDocs} / ${worstMissingRegion.total}` })
  }

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 56, color: '#9CA3AF', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', marginTop: 24 }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{FR ? 'Aucun(e) embauché(e) pour cette période.' : 'No hired candidates for this period.'}</div>
      </div>
    )
  }

  return (
    <div>
      <InsightsPanel insights={insights} FR={FR} />

      {/* ── Overview KPIs ── */}
      <SectionDivider title={FR ? 'Aperçu de la période' : 'Period Overview'} color="#1E2769" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label={FR ? 'Total embauché(e)s' : 'Total Hired'} value={total} sub={`${dateFrom || '—'} → ${dateTo || '—'}`} accent="#1E2769" />
        <StatCard label={FR ? 'ADP Envoyé' : 'ADP Sent'} value={adpSent} sub={`${pct(adpSent, total)}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#3B82F6" accent="#3B82F6"
          flag={pct(adpSent, total) < 80 ? 'warn' : 'good'} />
        <StatCard label={FR ? 'ADP Complété' : 'ADP Complete'} value={adpComplete} sub={`${pct(adpComplete, total)}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#8B5CF6" accent="#8B5CF6"
          flag={pct(adpComplete, total) < 70 ? 'warn' : 'good'} />
        <StatCard label={FR ? 'POD Actif' : 'POD Active'} value={podActive} sub={`${podRate}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#059669" accent="#2DCDB8"
          flag={podRate >= 80 ? 'good' : podRate < 60 ? 'bad' : 'warn'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label={FR ? 'Taux docs manquants' : 'Missing Docs Rate'} value={`${missingDocsRate}%`}
          sub={`${missingDocsCount} ${FR ? 'candidat(e)s affecté(e)s' : 'candidates'} / ${total} ${FR ? 'total' : 'total'}`}
          color={missingDocsRate > 20 ? '#D97706' : '#059669'} accent={missingDocsRate > 20 ? '#F59E0B' : '#2DCDB8'}
          flag={missingDocsRate > 30 ? 'bad' : missingDocsRate > 15 ? 'warn' : 'good'} small />
        <StatCard label={FR ? 'Délai moyen → POD' : 'Avg Days → POD Active'} value={avgTotal !== null ? `${avgTotal} days` : '—'}
          sub={avgTotal !== null && avgTotal > 13 ? (FR ? '⚠ Au-dessus de la cible (13j)' : '⚠ Above target (13 days)') : (FR ? '✓ Dans la cible' : '✓ Within target')}
          color={avgTotal !== null && avgTotal > 13 ? '#D97706' : '#059669'} accent="#E8EAF6"
          flag={avgTotal !== null ? (avgTotal > 20 ? 'bad' : avgTotal > 13 ? 'warn' : 'good') : undefined} small />
        <StatCard label={FR ? 'Goulot principal' : 'Main Bottleneck'} value={bottleneck?.avg !== null && bottleneck?.avg > bottleneck?.target ? `${bottleneck.avg}d` : (FR ? 'Aucun' : 'None')}
          sub={bottleneck?.avg > bottleneck?.target ? (FR ? `Étape: ADP` : `Stage: ADP`) : (FR ? 'Toutes étapes dans les cibles' : 'All stages on track')}
          color={bottleneck?.avg > bottleneck?.target ? '#D97706' : '#059669'} accent="#E8EAF6" small />
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

      {/* ── Onboarding Speed ── */}
      <SectionDivider title={FR ? 'Vitesse d\'intégration par étape' : 'Onboarding Speed by Stage'} color="#3B82F6" />
      <Card>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 18 }}>
          {FR ? 'Délai moyen par transition (embauche → POD actif)' : 'Average time per transition (hire → POD active)'}
          <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#9CA3AF', marginLeft: 8 }}>
            {FR ? '— identifie où les candidat(e)s bloquent' : '— identifies where candidates get stuck'}
          </span>
        </div>
        <SpeedBreakdown stages={speedStages} FR={FR} />
      </Card>

      {/* ── Missing Docs ── */}
      {docBreakdown.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Documents manquants' : 'Missing Documents'} color="#F59E0B" />
          <Card>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 16 }}>
              {FR ? 'Taux par type de document' : 'Rate by Document Type'}
              <span style={{ marginLeft: 8, fontSize: '0.72rem', fontWeight: 400, color: '#9CA3AF' }}>
                — {FR ? 'taux = documents manquants / total embauché(e)s' : 'rate = missing / total hired'}
              </span>
            </div>
            <BarChart
              data={docBreakdown.map(d => ({ label: d.label, count: d.count, rate: d.rate, color: d.rate > 15 ? '#F0194A' : '#F59E0B' }))}
              total={total}
            />
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#FEF9EC', borderRadius: 8, border: '1px solid #FDE68A' }}>
              <span style={{ fontSize: '0.72rem', color: '#92400E' }}>
                {FR
                  ? `${missingDocsCount} candidat(e)s (${missingDocsRate}%) ont ≥1 document manquant. Les taux indiqués sont calculés sur les ${total} embauché(e)s — permettant la comparaison entre bureaux de différentes tailles.`
                  : `${missingDocsCount} candidates (${missingDocsRate}%) have ≥1 missing doc. Rates are calculated over ${total} total hires — allowing fair comparison across offices of different sizes.`}
              </span>
            </div>
          </Card>
        </>
      )}

      {/* ── By Region ── */}
      {regionRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Performance par région' : 'Performance by Region'} color="#F59E0B" />
          <TableCard
            title={FR ? 'Intégration normalisée par région' : 'Normalized Onboarding by Region'}
            subtitle={FR ? '— taux de documents manquants = docs manquants / total embauché(e)s (comparable entre régions)' : '— missing docs rate = missing / hired (comparable across regions regardless of size)'}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[
                  FR ? 'Région' : 'Region', FR ? 'Embauché(e)s' : 'Hired',
                  FR ? 'ADP Envoyé' : 'ADP Sent', FR ? 'ADP Complet' : 'ADP Complete',
                  FR ? 'POD Actif' : 'POD Active', FR ? 'Taux POD' : 'POD Rate',
                  FR ? 'Taux docs manq.' : 'Missing Docs %',
                  FR ? 'Moy. jours → POD' : 'Avg Days → POD',
                ].map((h, i) => <th key={h} style={TH(i > 0)}>{h}</th>)}
              </tr></thead>
              <tbody>
                {regionRows.map(r => (
                  <tr key={r.region} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), paddingLeft: 20 }}><span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0194A', fontWeight: 700 }}>{r.region}</span></td>
                    <td style={TD(true, '#1E2769', true)}>{r.total}</td>
                    <td style={TD(false, '#3B82F6', true)}>{r.adpSent}</td>
                    <td style={TD(false, '#8B5CF6', true)}>{r.adpComplete}</td>
                    <td style={TD(true, '#059669', true)}>{r.podActive}</td>
                    <td style={{ ...TD(true, r.podRate >= 80 ? '#059669' : '#D97706', true) }}>
                      {r.podRate}%
                      <VsBadge value={r.podRate} mean={pct(podActive, total)} higherIsBetter />
                    </td>
                    <td style={{ ...TD(true, r.missingDocsRate > 20 ? '#DC2626' : r.missingDocsRate > 10 ? '#D97706' : '#059669', true) }}>
                      {r.missingDocsRate}%
                      <VsBadge value={r.missingDocsRate} mean={missingRateStats.mean} higherIsBetter={false} />
                    </td>
                    <td style={{ ...TD(false, r.avgDaysToPod !== null && r.avgDaysToPod > 13 ? '#D97706' : '#059669', true) }}>
                      {r.avgDaysToPod !== null ? `${r.avgDaysToPod}d` : '—'}
                      {r.avgDaysToPod !== null && <VsBadge value={r.avgDaysToPod} mean={podTimeStats.mean} higherIsBetter={false} />}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#F0F2FF', borderTop: '2px solid #E8EAF6' }}>
                  <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>TOTAL / AVG</td>
                  <td style={TD(true, '#1E2769', true)}>{total}</td>
                  <td style={TD(true, '#3B82F6', true)}>{adpSent}</td>
                  <td style={TD(true, '#8B5CF6', true)}>{adpComplete}</td>
                  <td style={TD(true, '#059669', true)}>{podActive}</td>
                  <td style={TD(true, podRate >= 80 ? '#059669' : '#D97706', true)}>{podRate}% <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#94A3B8' }}>avg</span></td>
                  <td style={TD(true, missingDocsRate > 20 ? '#DC2626' : '#059669', true)}>{missingDocsRate}% <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#94A3B8' }}>avg</span></td>
                  <td style={TD(true, '#64748B', true)}>{avgTotal !== null ? `${avgTotal}d` : '—'}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ padding: '10px 20px', background: '#F9FAFB', borderTop: '1px solid #E8EAF6', fontSize: '0.7rem', color: '#9CA3AF' }}>
              {FR
                ? `Écart-type taux docs manquants: ±${missingRateStats.sd}pp · Écart-type délai POD: ±${podTimeStats.sd} jours`
                : `Missing docs rate std dev: ±${missingRateStats.sd}pp · POD days std dev: ±${podTimeStats.sd} days`}
            </div>
          </TableCard>
        </>
      )}

      {/* ── By Office ── */}
      {officeRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Performance par bureau' : 'Performance by Office'} color="#8B5CF6" />
          <TableCard
            title={FR ? 'Intégration par bureau (top 20)' : 'Onboarding by Office (top 20)'}
            subtitle={FR ? '— taux de docs manquants normalisé sur les embauché(e)s du bureau' : '— missing docs % normalized per office hired (not raw count)'}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Code', FR ? 'Bureau' : 'Office', FR ? 'Embauché(e)s' : 'Hired',
                  FR ? 'POD Actif' : 'POD Active', FR ? 'Taux POD' : 'POD Rate',
                  FR ? 'Taux docs manq.' : 'Missing Docs %',
                  FR ? 'Moy. jours → POD' : 'Avg Days → POD',
                ].map((h, i) => <th key={h} style={TH(i > 1)}>{h}</th>)}
              </tr></thead>
              <tbody>
                {officeRows.slice(0, 20).map(o => (
                  <tr key={o.code} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), fontFamily: 'IBM Plex Mono, monospace', color: '#1E2769', paddingLeft: 20 }}>{o.code}</td>
                    <td style={TD(false, '#374151')}>{o.name}</td>
                    <td style={TD(true, '#1E2769', true)}>{o.total}</td>
                    <td style={TD(true, '#059669', true)}>{o.podActive}</td>
                    <td style={{ ...TD(true, o.podRate >= 80 ? '#059669' : '#D97706', true) }}>
                      {o.podRate}%
                      <VsBadge value={o.podRate} mean={pct(podActive, total)} higherIsBetter />
                    </td>
                    <td style={{ ...TD(true, o.missingDocsRate > 20 ? '#DC2626' : o.missingDocsRate > 10 ? '#D97706' : '#059669', true) }}>
                      {o.missingDocsRate}%
                      <VsBadge value={o.missingDocsRate} mean={missingDocsRate} higherIsBetter={false} />
                    </td>
                    <td style={{ ...TD(false, o.avgDaysToPod !== null && o.avgDaysToPod > 13 ? '#D97706' : '#059669', true) }}>
                      {o.avgDaysToPod !== null ? `${o.avgDaysToPod}d` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {/* ── FR vs EN Office Onboarding ── */}
      {(() => {
        const frOffices = hiredCandidates.filter(c => {
          const o = OFFICES.find(x => x.code === (c.officeCodes?.[0] || c.officeCode))
          return o?.isFR
        })
        const enOffices = hiredCandidates.filter(c => {
          const o = OFFICES.find(x => x.code === (c.officeCodes?.[0] || c.officeCode))
          return o && !o.isFR
        })
        if (!frOffices.length || !enOffices.length) return null
        const frPod = frOffices.filter(c => c.onboarding?.podActivatedDate).length
        const enPod = enOffices.filter(c => c.onboarding?.podActivatedDate).length
        const frMissing = frOffices.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean)).length
        const enMissing = enOffices.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean)).length
        return (
          <>
            <SectionDivider title={FR ? 'Bureaux francophones vs anglophones' : 'FR vs EN Office Onboarding'} color="#3B82F6" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#3B82F6', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🇫🇷 {FR ? 'Bureaux francophones' : 'French Offices'} ({frOffices.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{pct(frPod, frOffices.length)}%</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 3 }}>POD Rate</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: frMissing / frOffices.length > 0.2 ? '#DC2626' : '#059669', lineHeight: 1 }}>{pct(frMissing, frOffices.length)}%</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 3 }}>{FR ? 'Docs manq.' : 'Missing Docs'}</div>
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1E2769', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🇨🇦 {FR ? 'Bureaux anglophones' : 'English Offices'} ({enOffices.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{pct(enPod, enOffices.length)}%</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 3 }}>POD Rate</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: enMissing / enOffices.length > 0.2 ? '#DC2626' : '#059669', lineHeight: 1 }}>{pct(enMissing, enOffices.length)}%</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 3 }}>{FR ? 'Docs manq.' : 'Missing Docs'}</div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )
      })()}
    </div>
  )
}

// ── Operations Report ─────────────────────────────────────────────────────────
function OperationsReport({ candidates, dateFrom, dateTo, filterRegion, filterOffice, language, managers }) {
  const FR = language === 'FR'

  const filtered = useMemo(() => candidates.filter((c) => {
    if (c.isHistorical) return false
    if (filterOffice && !(c.officeCodes || [c.officeCode]).includes(filterOffice)) return false
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
  const hireRate = pct(hired, showed)
  const onboardingRate = pct(podActive, hired)

  // Overall pipeline conversion rates between stages
  const funnelSteps = [
    { label: FR ? 'En pipeline' : 'In Pipeline', count: total },
    { label: FR ? 'Présenté(e)s' : 'Showed Up', count: showed },
    { label: FR ? 'Embauché(e)s' : 'Hired', count: hired },
    { label: FR ? 'Intégration' : 'Onboarding', count: onboardingStarted },
    { label: FR ? 'POD Actif' : 'POD Active', count: podActive },
  ]

  // Stage-by-stage conversion rates
  const conversionRates = funnelSteps.slice(1).map((step, i) => ({
    from: funnelSteps[i].label,
    to: step.label,
    rate: pct(step.count, funnelSteps[i].count),
    lost: funnelSteps[i].count - step.count,
  }))

  const bottleneckStage = conversionRates.reduce((worst, cur) => cur.rate < worst.rate ? cur : worst, conversionRates[0] || { rate: 100 })
  const overallConversion = pct(podActive, total)

  // ── Region & office breakdown ───────────────────────────────────────────
  const allOffices = managers && managers.length > 0 ? managers : OFFICES
  const regionRows = REGIONS.map(r => {
    const rc = filtered.filter(c => c.region === r)
    if (!rc.length) return null
    const rcShowed = rc.length - rc.filter(c => c.status === 'No Show').length - rc.filter(c => c.status === 'Pending').length
    const rcHired = rc.filter(c => c.status === 'Hired').length
    const rcPod = rc.filter(c => c.onboarding?.podActivatedDate).length
    const rcMissing = rc.filter(c => c.onboarding?.missingDocs && Object.values(c.onboarding.missingDocs).some(Boolean)).length
    return {
      region: r, total: rc.length, showed: rcShowed, hired: rcHired,
      onboarding: rc.filter(c => c.status === 'Hired' && (c.onboarding?.adpSentDate || c.onboarding?.userCreated)).length,
      adpComplete: rc.filter(c => c.onboarding?.adpCompleteDate).length,
      podActive: rcPod,
      hireRate: pct(rcHired, rcShowed),
      podRate: pct(rcPod, rcHired),
      endToEndRate: pct(rcPod, rc.length),
      missingDocsRate: pct(rcMissing, rcHired),
    }
  }).filter(Boolean)

  const officeRows = allOffices.map(o => {
    const oc = filtered.filter(c => (c.officeCodes || [c.officeCode]).includes(o.code))
    if (!oc.length) return null
    const ocShowed = oc.length - oc.filter(c => c.status === 'No Show').length - oc.filter(c => c.status === 'Pending').length
    const ocHired = oc.filter(c => c.status === 'Hired').length
    const ocPod = oc.filter(c => c.onboarding?.podActivatedDate).length
    return {
      code: o.code, name: o.name || '', total: oc.length, showed: ocShowed, hired: ocHired,
      onboarding: oc.filter(c => c.status === 'Hired' && (c.onboarding?.adpSentDate || c.onboarding?.userCreated)).length,
      podActive: ocPod,
      hireRate: pct(ocHired, ocShowed),
      podRate: pct(ocPod, ocHired),
      endToEndRate: pct(ocPod, oc.length),
    }
  }).filter(Boolean).sort((a, b) => b.hired - a.hired)

  // ── Statistical benchmarks ──────────────────────────────────────────────
  const regionEndToEnd = regionRows.map(r => r.endToEndRate)
  const e2eStats = stats(regionEndToEnd)

  // ── Auto insights ───────────────────────────────────────────────────────
  const insights = []

  insights.push({ icon: overallConversion >= 30 ? '✓' : '⚠',
    label: FR ? 'Efficacité globale' : 'End-to-End Efficiency',
    color: overallConversion >= 30 ? '#059669' : '#D97706',
    text: FR
      ? `${overallConversion}% des candidat(e)s en pipeline atteignent POD actif (${podActive}/${total}). ${overallConversion >= 30 ? 'Performance solide.' : 'Des améliorations sont possibles.'}`
      : `${overallConversion}% of candidates in pipeline reach POD active (${podActive}/${total}). ${overallConversion >= 30 ? 'Strong performance.' : 'Improvement opportunities exist.'}`,
    sub: FR ? 'Indicateur clé opérations' : 'Key operations indicator' })

  if (conversionRates.length && bottleneckStage.rate < 70) {
    insights.push({ icon: '↓', label: FR ? 'Goulot d\'étranglement' : 'Pipeline Bottleneck', color: '#DC2626',
      text: FR
        ? `Transition la plus faible: "${bottleneckStage.from} → ${bottleneckStage.to}" — seulement ${bottleneckStage.rate}% de conversion (${bottleneckStage.lost} candidat(e)s perdu(e)s).`
        : `Weakest stage: "${bottleneckStage.from} → ${bottleneckStage.to}" — only ${bottleneckStage.rate}% conversion (${bottleneckStage.lost} candidates lost).`,
      sub: FR ? 'Cibler ce stade pour maximiser le rendement' : 'Target this stage for maximum throughput gain' })
  }

  if (hireRate >= 30) {
    insights.push({ icon: '✓', label: FR ? 'Taux d\'embauche' : 'Hire Rate', color: '#059669',
      text: FR ? `Taux d'embauche de ${hireRate}% — cible de 30% atteinte.` : `Hire rate of ${hireRate}% — 30% target met.`,
      sub: `${hired}/${showed}` })
  } else {
    insights.push({ icon: '↓', label: FR ? 'Taux d\'embauche' : 'Hire Rate', color: '#D97706',
      text: FR ? `Taux d'embauche de ${hireRate}% — en dessous de 30%. Impact direct sur l'intégration.` : `Hire rate of ${hireRate}% — below 30% target. Directly impacts onboarding pipeline.`,
      sub: `${hired}/${showed}` })
  }

  if (onboardingRate >= 80) {
    insights.push({ icon: '✓', label: FR ? 'Complétion intégration' : 'Onboarding Completion', color: '#2DCDB8',
      text: FR ? `${onboardingRate}% des embauché(e)s ont atteint POD actif — excellent taux de rétention dans l'intégration.` : `${onboardingRate}% of hires reached POD active — excellent onboarding retention.`,
      sub: `${podActive}/${hired}` })
  } else if (onboardingRate < 60 && hired > 0) {
    insights.push({ icon: '⚠', label: FR ? 'Complétion intégration' : 'Onboarding Completion', color: '#D97706',
      text: FR ? `Seulement ${onboardingRate}% des embauché(e)s ont atteint POD actif. ${hired - podActive} embauché(e)s n'ont pas terminé leur intégration.` : `Only ${onboardingRate}% of hires reached POD active. ${hired - podActive} hires haven't completed onboarding.`,
      sub: `${podActive}/${hired}` })
  }

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 56, color: '#9CA3AF', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', marginTop: 24 }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{FR ? 'Aucune donnée pour cette période.' : 'No data for the selected period.'}</div>
      </div>
    )
  }

  return (
    <div>
      <InsightsPanel insights={insights} FR={FR} />

      {/* ── Overview KPIs ── */}
      <SectionDivider title={FR ? 'Aperçu de la période' : 'Period Overview'} color="#1E2769" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label={FR ? 'Total candidat(e)s' : 'Total Candidates'} value={total} sub={`${dateFrom || '—'} → ${dateTo || '—'}`} accent="#1E2769" />
        <StatCard label={FR ? 'Embauché(e)s' : 'Hired'} value={hired} sub={`${hireRate}% ${FR ? 'taux d\'embauche' : 'hire rate'}`} color={hireRate >= 30 ? '#059669' : '#D97706'} accent="#2DCDB8"
          flag={hireRate >= 30 ? 'good' : hireRate < 20 ? 'bad' : 'warn'} />
        <StatCard label={FR ? 'POD Actif' : 'POD Active'} value={podActive} sub={`${onboardingRate}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#059669" accent="#059669"
          flag={onboardingRate >= 80 ? 'good' : onboardingRate < 60 ? 'bad' : 'warn'} />
        <StatCard label={FR ? 'Efficacité pipeline' : 'Pipeline Efficiency'} value={`${overallConversion}%`}
          sub={FR ? 'pipeline → POD actif' : 'pipeline → POD active'}
          color={overallConversion >= 30 ? '#059669' : '#D97706'} accent={overallConversion >= 30 ? '#2DCDB8' : '#F59E0B'}
          flag={overallConversion >= 30 ? 'good' : overallConversion < 15 ? 'bad' : 'warn'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label={FR ? 'Présenté(e)s' : 'Showed Up'} value={showed} sub={`${pct(showed, total)}% ${FR ? 'du pipeline' : 'of pipeline'}`} color="#3B82F6" accent="#3B82F6" small />
        <StatCard label={FR ? 'Intégration démarrée' : 'Onboarding Started'} value={onboardingStarted} sub={`${pct(onboardingStarted, hired)}% ${FR ? 'des embauché(e)s' : 'of hired'}`} color="#8B5CF6" accent="#8B5CF6" small />
        <StatCard label={FR ? 'Absent(e)s' : 'No-Shows'} value={noShow} sub={`${pct(noShow, total)}% ${FR ? 'du pipeline' : 'of pipeline'}`} color="#9CA3AF" accent="#E8EAF6" small />
        <StatCard label={FR ? 'En attente' : 'Pending'} value={pending} sub={`${pct(pending, total)}% ${FR ? 'du pipeline' : 'of pipeline'}`} color="#F59E0B" accent="#F59E0B" small />
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
        {/* Stage conversion rates */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {FR ? 'Taux de conversion par étape' : 'Conversion rate per stage'}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {conversionRates.map(cr => (
              <div key={cr.from} style={{
                background: cr.rate < 70 ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${cr.rate < 70 ? '#FECACA' : '#BBF7D0'}`,
                borderRadius: 8, padding: '8px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: 2 }}>{cr.from} →</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cr.rate < 70 ? '#DC2626' : '#059669' }}>{cr.rate}%</div>
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{cr.lost} {FR ? 'perdu(e)s' : 'lost'}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── By Region ── */}
      {regionRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Performance par région' : 'Performance by Region'} color="#F59E0B" />
          <TableCard
            title={FR ? 'Vue combinée normalisée par région' : 'Normalized Combined View by Region'}
            subtitle={FR ? '— "Efficacité pipeline" = POD actif / total pipeline' : '— "Pipeline efficiency" = POD active / total pipeline'}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[
                  FR ? 'Région' : 'Region', 'Total',
                  FR ? 'Présenté(e)s' : 'Showed', FR ? 'Emb.' : 'Hired',
                  FR ? 'Taux emb.' : 'Hire Rate', FR ? 'POD Actif' : 'POD Active',
                  FR ? 'Taux POD/emb.' : 'POD/Hire Rate',
                  FR ? 'Efficacité pipeline' : 'Pipeline Efficiency',
                  FR ? 'Docs manq.' : 'Missing Docs%',
                ].map((h, i) => <th key={h} style={TH(i > 0)}>{h}</th>)}
              </tr></thead>
              <tbody>
                {regionRows.map(r => (
                  <tr key={r.region} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), paddingLeft: 20 }}><span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0194A', fontWeight: 700 }}>{r.region}</span></td>
                    <td style={TD(true, '#111827', true)}>{r.total}</td>
                    <td style={TD(false, '#3B82F6', true)}>{r.showed}</td>
                    <td style={TD(true, '#2DCDB8', true)}>{r.hired}</td>
                    <td style={{ ...TD(true, r.hireRate >= 30 ? '#059669' : '#D97706', true) }}>
                      {r.hireRate}%
                      <VsBadge value={r.hireRate} mean={hireRate} higherIsBetter />
                    </td>
                    <td style={TD(true, '#059669', true)}>{r.podActive}</td>
                    <td style={{ ...TD(true, r.podRate >= 80 ? '#059669' : '#D97706', true) }}>
                      {r.podRate}%
                      <VsBadge value={r.podRate} mean={onboardingRate} higherIsBetter />
                    </td>
                    <td style={{ ...TD(true, r.endToEndRate >= 30 ? '#059669' : '#D97706', true) }}>
                      {r.endToEndRate}%
                      <VsBadge value={r.endToEndRate} mean={e2eStats.mean} higherIsBetter />
                    </td>
                    <td style={{ ...TD(false, r.missingDocsRate > 20 ? '#DC2626' : '#9CA3AF', true) }}>
                      {r.missingDocsRate > 0 ? `${r.missingDocsRate}%` : '—'}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#F0F2FF', borderTop: '2px solid #E8EAF6' }}>
                  <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>TOTAL / AVG</td>
                  <td style={TD(true, '#111827', true)}>{total}</td>
                  <td style={TD(true, '#3B82F6', true)}>{showed}</td>
                  <td style={TD(true, '#2DCDB8', true)}>{hired}</td>
                  <td style={TD(true, hireRate >= 30 ? '#059669' : '#D97706', true)}>{hireRate}%</td>
                  <td style={TD(true, '#059669', true)}>{podActive}</td>
                  <td style={TD(true, onboardingRate >= 80 ? '#059669' : '#D97706', true)}>{onboardingRate}%</td>
                  <td style={TD(true, overallConversion >= 30 ? '#059669' : '#D97706', true)}>{overallConversion}%</td>
                  <td style={TD(false, '#9CA3AF', true)}>—</td>
                </tr>
              </tbody>
            </table>
            <div style={{ padding: '10px 20px', background: '#F9FAFB', borderTop: '1px solid #E8EAF6', fontSize: '0.7rem', color: '#9CA3AF' }}>
              {FR
                ? `Écart-type efficacité pipeline: ±${e2eStats.sd}pp — ${e2eStats.sd > 10 ? 'forte disparité, certaines régions surperforment' : 'régions relativement homogènes'}`
                : `Pipeline efficiency std dev: ±${e2eStats.sd}pp — ${e2eStats.sd > 10 ? 'high variance, some regions outperforming significantly' : 'regions relatively consistent'}`}
            </div>
          </TableCard>
        </>
      )}

      {/* ── By Office ── */}
      {officeRows.length > 0 && (
        <>
          <SectionDivider title={FR ? 'Performance par bureau' : 'Performance by Office'} color="#8B5CF6" />
          <TableCard title={FR ? 'Vue combinée par bureau (top 20)' : 'Combined View by Office (top 20)'}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Code', FR ? 'Bureau' : 'Office', 'Total',
                  FR ? 'Emb.' : 'Hired', FR ? 'Taux emb.' : 'Hire Rate',
                  FR ? 'POD Actif' : 'POD Active', FR ? 'Taux POD/emb.' : 'POD/Hire',
                  FR ? 'Efficacité pipeline' : 'Pipeline Eff.',
                ].map((h, i) => <th key={h} style={TH(i > 1)}>{h}</th>)}
              </tr></thead>
              <tbody>
                {officeRows.slice(0, 20).map(o => (
                  <tr key={o.code} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...TD(true), fontFamily: 'IBM Plex Mono, monospace', color: '#1E2769', paddingLeft: 20 }}>{o.code}</td>
                    <td style={TD(false, '#374151')}>{o.name}</td>
                    <td style={TD(false, '#374151', true)}>{o.total}</td>
                    <td style={TD(true, '#2DCDB8', true)}>{o.hired}</td>
                    <td style={{ ...TD(true, o.hireRate >= 30 ? '#059669' : '#D97706', true) }}>
                      {o.hireRate}%
                      {o.total >= 5 && <VsBadge value={o.hireRate} mean={hireRate} higherIsBetter />}
                    </td>
                    <td style={TD(true, '#059669', true)}>{o.podActive}</td>
                    <td style={{ ...TD(true, o.podRate >= 80 ? '#059669' : '#D97706', true) }}>
                      {o.podRate}%
                      {o.hired >= 3 && <VsBadge value={o.podRate} mean={onboardingRate} higherIsBetter />}
                    </td>
                    <td style={{ ...TD(true, o.endToEndRate >= 30 ? '#059669' : '#D97706', true) }}>
                      {o.endToEndRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {/* ── Medium Breakdown (Operations) ── */}
      {(() => {
        const mediums = [...new Set(filtered.map(c => c.medium).filter(Boolean))]
        if (mediums.length < 2) return null
        const mediumRows = mediums.map(med => {
          const mc = filtered.filter(c => c.medium === med)
          const mcShowed = mc.filter(c => c.status !== 'No Show' && c.status !== 'Pending').length
          const mcHired = mc.filter(c => c.status === 'Hired').length
          const mcPod = mc.filter(c => c.onboarding?.podActivatedDate).length
          return {
            medium: med, total: mc.length, hired: mcHired, podActive: mcPod,
            hireRate: pct(mcHired, mcShowed),
            podRate: pct(mcPod, mcHired),
            endToEnd: pct(mcPod, mc.length),
          }
        }).sort((a, b) => b.total - a.total)
        return (
          <>
            <SectionDivider title={FR ? 'Performance par médium' : 'Performance by Medium'} color="#8B5CF6" />
            <TableCard title={FR ? 'Vue combinée par médium' : 'Combined View by Medium'}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {[FR ? 'Médium' : 'Medium', 'Total', FR ? 'Emb.' : 'Hired',
                    FR ? 'Taux emb.' : 'Hire Rate', FR ? 'POD Actif' : 'POD Active',
                    FR ? 'Taux POD' : 'POD Rate', FR ? 'Eff. pipeline' : 'Pipeline Eff.',
                  ].map((h, i) => <th key={h} style={TH(i > 0)}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {mediumRows.map(m => (
                    <tr key={m.medium} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ ...TD(true, '#1E2769'), paddingLeft: 20 }}>{m.medium}</td>
                      <td style={TD(false, '#374151', true)}>{m.total}</td>
                      <td style={TD(true, '#2DCDB8', true)}>{m.hired}</td>
                      <td style={{ ...TD(true, m.hireRate >= 30 ? '#059669' : '#D97706', true) }}>{m.hireRate}%</td>
                      <td style={TD(true, '#059669', true)}>{m.podActive}</td>
                      <td style={{ ...TD(true, m.podRate >= 80 ? '#059669' : '#D97706', true) }}>{m.podRate}%</td>
                      <td style={{ ...TD(true, m.endToEnd >= 30 ? '#059669' : '#D97706', true) }}>{m.endToEnd}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
          </>
        )
      })()}
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

  const roleLabel = { recruitment: FR ? 'Recrutement' : 'Recruitment', admin: 'Admin', operations: FR ? 'Opérations' : 'Operations' }[role] || ''
  const periodLabel = (() => { const p = PRESETS.find(p => p.key === preset); return p ? (FR ? p.FR : p.EN) : '' })()

  const filterProps = { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filterRegion, setFilterRegion, filterOffice, setFilterOffice, language, allManagers: managers }
  const reportProps = { candidates, dateFrom, dateTo, filterRegion, filterOffice, language, managers }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }} className="no-print">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E2769', margin: 0, letterSpacing: '-0.02em' }}>
            {t('reports', language)}
            <span style={{ marginLeft: 10, fontSize: '0.75rem', fontWeight: 600, color: '#F0194A', background: '#FFF0F5', padding: '2px 10px', borderRadius: 20, verticalAlign: 'middle' }}>{roleLabel}</span>
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: '4px 0 0' }}>{periodLabel} · {dateFrom || '—'} → {dateTo || '—'}</p>
        </div>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1E2769', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,39,105,0.2)' }}>
          ⬇ {FR ? 'Exporter PDF' : 'Export PDF'}
        </button>
      </div>

      {/* Print header */}
      <div className="print-only" style={{ display: 'none', marginBottom: 20 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E2769' }}>{t('reports', language)} — {roleLabel}</div>
        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>{periodLabel} · {dateFrom || '—'} → {dateTo || '—'}{filterRegion !== 'all' ? ` · ${filterRegion}` : ''}{filterOffice ? ` · ${filterOffice}` : ''}</div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 20 }} className="no-print">
        <FilterBar {...filterProps} />
      </div>

      {role === 'recruitment' && <RecruitmentReport {...reportProps} />}
      {role === 'admin' && <AdminReport {...reportProps} />}
      {role === 'operations' && <OperationsReport {...reportProps} />}
    </div>
  )
}
