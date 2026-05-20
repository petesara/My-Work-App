import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'

const TH = { padding: '9px 12px', fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }
const TD = { padding: '9px 12px', fontSize: '0.8rem', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }

function getYear(rec) {
  const dates = [
    rec.onboarding?.podActivatedAt,
    rec.onboarding?.adpCompleteAt,
    rec.onboarding?.adpSentAt,
    rec.createdAt,
  ]
  for (const d of dates) {
    if (d) {
      const yr = new Date(d).getFullYear()
      if (yr > 2018) return yr
    }
  }
  return null
}

export default function HistoricalRecords() {
  const language = useStore((s) => s.language)
  const candidates = useStore((s) => s.candidates)
  const FR = language === 'FR'

  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState('all')
  const [filterOffice, setFilterOffice] = useState('')
  const [filterRehire, setFilterRehire] = useState('all')
  const [filterPOD, setFilterPOD] = useState('all')

  const historical = candidates.filter((c) => c.isHistorical)

  const years = [...new Set(historical.map(getYear).filter(Boolean))].sort((a, b) => b - a)

  const filtered = historical.filter((c) => {
    if (search) {
      const q = search.toLowerCase()
      const name = `${c.firstName} ${c.lastName}`.toLowerCase()
      const phone = (c.phone || '').replace(/\D/g, '')
      const id = (c.payrollId || '').toLowerCase()
      const office = (c.officeCode || '').toLowerCase()
      if (!name.includes(q) && !phone.includes(q) && !id.includes(q) && !office.includes(q)) return false
    }
    if (filterYear !== 'all') {
      const yr = getYear(c)
      if (String(yr) !== filterYear) return false
    }
    if (filterOffice && c.officeCode !== filterOffice) return false
    if (filterRehire === 'yes' && !c.isRehire) return false
    if (filterRehire === 'no' && c.isRehire) return false
    if (filterPOD === 'yes' && !c.onboarding?.podActivated) return false
    if (filterPOD === 'no' && c.onboarding?.podActivated) return false
    return true
  })

  const offices = [...new Set(historical.map(c => c.officeCode).filter(Boolean))].sort()

  const hasFilters = search || filterYear !== 'all' || filterOffice || filterRehire !== 'all' || filterPOD !== 'all'

  const clearFilters = () => {
    setSearch('')
    setFilterYear('all')
    setFilterOffice('')
    setFilterRehire('all')
    setFilterPOD('all')
  }

  const podCount = historical.filter(c => c.onboarding?.podActivated).length
  const rehireCount = historical.filter(c => c.isRehire).length
  const frCount = historical.filter(c => c.languagePreference === 'FR').length

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E2769', margin: 0, letterSpacing: '-0.02em' }}>
          {FR ? 'Données historiques' : 'Historical Records'}
        </h1>
        <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: '0.75rem', color: '#6B7280', flexWrap: 'wrap' }}>
          <span><strong style={{ color: '#1E40AF' }}>{historical.length}</strong> {FR ? 'total' : 'total'}</span>
          <span><strong style={{ color: '#059669' }}>{podCount}</strong> POD ✓</span>
          <span><strong style={{ color: '#D97706' }}>{rehireCount}</strong> {FR ? 'réembauches' : 'rehires'}</span>
          <span><strong style={{ color: '#1D4ED8' }}>{frCount}</strong> FR</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={FR ? 'Rechercher nom, ID, bureau...' : 'Search name, ID, office...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', width: 220, outline: 'none' }}
        />
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}
        >
          <option value="all">{FR ? 'Toutes les années' : 'All years'}</option>
          {years.map(yr => <option key={yr} value={String(yr)}>{yr}</option>)}
        </select>
        <select
          value={filterOffice}
          onChange={(e) => setFilterOffice(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}
        >
          <option value="">{FR ? 'Tous les bureaux' : 'All offices'}</option>
          {offices.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          value={filterRehire}
          onChange={(e) => setFilterRehire(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}
        >
          <option value="all">{FR ? 'Réembauches: tous' : 'Rehires: all'}</option>
          <option value="yes">{FR ? 'Réembauches seulement' : 'Rehires only'}</option>
          <option value="no">{FR ? 'Nouvelles embauches seulement' : 'New hires only'}</option>
        </select>
        <select
          value={filterPOD}
          onChange={(e) => setFilterPOD(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}
        >
          <option value="all">POD: {FR ? 'tous' : 'all'}</option>
          <option value="yes">POD ✓</option>
          <option value="no">POD ✗</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: 'pointer' }}
          >
            ✕ {FR ? 'Effacer' : 'Clear'}
          </button>
        )}
      </div>

      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 10 }}>
        {filtered.length} {FR ? 'enregistrement(s)' : 'record(s)'}
        {hasFilters && ` ${FR ? 'sur' : 'of'} ${historical.length}`}
      </div>

      {historical.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🕓</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {FR ? 'Aucune donnée historique importée.' : 'No historical data imported yet.'}
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            {FR
              ? 'Allez dans Pipeline → Importer → Données historiques pour importer historical_data.json.'
              : 'Go to Pipeline → Import → Historical Data tab to import historical_data.json.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>{FR ? 'Nom' : 'Name'}</th>
                <th style={TH}>{FR ? 'Téléphone' : 'Phone'}</th>
                <th style={TH}>Email</th>
                <th style={TH}>{FR ? 'Bureau' : 'Office'}</th>
                <th style={TH}>{FR ? 'ID paie' : 'Payroll ID'}</th>
                <th style={TH}>{FR ? 'Année' : 'Year'}</th>
                <th style={TH}>Lang</th>
                <th style={TH}>{FR ? 'Réembauche' : 'Rehire'}</th>
                <th style={TH}>POD</th>
                <th style={TH}>{FR ? 'Gestionnaire' : 'Manager'}</th>
                <th style={TH}>{FR ? 'Organisme' : 'Charity'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                    {t('noResults', language)}
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const yr = getYear(c)
                  const podAt = c.onboarding?.podActivatedAt
                    ? new Date(c.onboarding.podActivatedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
                    : null
                  return (
                    <tr
                      key={c.id}
                      style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F9FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#FAFAFA')}
                    >
                      <td style={{ ...TD, fontWeight: 600, color: '#111827' }}>
                        {c.firstName} {c.lastName}
                        {c.preferredName && <span style={{ color: '#9CA3AF', fontWeight: 400 }}> ({c.preferredName})</span>}
                      </td>
                      <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', color: '#374151' }}>
                        {c.phone || '—'}
                      </td>
                      <td style={{ ...TD, color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.email || '—'}
                      </td>
                      <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF' }}>
                        {c.officeCode || '—'}
                      </td>
                      <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', color: '#374151' }}>
                        {c.payrollId || <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ ...TD }}>
                        {yr ? (
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                            background: yr >= 2025 ? '#DBEAFE' : yr >= 2024 ? '#FEF3C7' : '#F3F4F6',
                            color: yr >= 2025 ? '#1E40AF' : yr >= 2024 ? '#B45309' : '#6B7280',
                          }}>
                            {yr}
                          </span>
                        ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={TD}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: c.languagePreference === 'FR' ? '#DBEAFE' : '#F3F4F6', color: c.languagePreference === 'FR' ? '#1E40AF' : '#374151' }}>
                          {c.languagePreference || 'EN'}
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        {c.isRehire
                          ? <span style={{ color: '#D97706', fontWeight: 700, fontSize: '0.7rem' }}>✓ {FR ? 'Oui' : 'Yes'}</span>
                          : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ ...TD }}>
                        {c.onboarding?.podActivated ? (
                          <span title={podAt || ''} style={{ color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>
                            ✓ {podAt ? podAt.slice(0, 7) : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#D1D5DB', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...TD, color: '#374151', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.manager || '—'}
                      </td>
                      <td style={{ ...TD, color: '#374151' }}>
                        {c.charity || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
