import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { REGIONS, STATUSES, OFFICES } from '../data/offices'
import StatusBadge from '../components/StatusBadge'
import AddCandidatePanel from './AddCandidatePanel'
import ImportModal from './ImportModal'

const COL_STYLE = { padding: '10px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }
const TH_STYLE = { ...COL_STYLE, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 13 }).map((_, i) => (
        <td key={i} style={COL_STYLE}>
          <div style={{ height: 14, background: '#E5E7EB', borderRadius: 4, width: i === 0 ? 120 : 80, animation: 'pulse 1.5s infinite' }} />
        </td>
      ))}
    </tr>
  )
}

export default function Pipeline() {
  const language = useStore((s) => s.language)
  const role = useStore((s) => s.role)
  const candidates = useStore((s) => s.candidates)
  const updateCandidate = useStore((s) => s.updateCandidate)
  const deleteCandidate = useStore((s) => s.deleteCandidate)
  const addToast = useStore((s) => s.addToast)
  const openAddPanel = useStore((s) => s.openAddPanel)
  const setOpenAddPanel = useStore((s) => s.setOpenAddPanel)
  const editingCandidateId = useStore((s) => s.editingCandidateId)

  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [showHistorical, setShowHistorical] = useState(false)
  const [tab, setTab] = useState('all') // 'all' | 'new' | 'rehire'
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterLang, setFilterLang] = useState('all')
  const [filterOffice, setFilterOffice] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const handleStatusChange = (id, newStatus) => {
    updateCandidate(id, { status: newStatus })
    addToast(t('updatedSuccessfully', language), 'success')
  }

  const canAdd = role === 'recruitment' || role === 'operations'
  const canDelete = role === 'recruitment' || role === 'admin'

  const handleDelete = (e, c) => {
    e.stopPropagation()
    const name = `${c.firstName} ${c.lastName}`
    if (!window.confirm(language === 'FR' ? `Supprimer ${name} ?` : `Delete ${name}?`)) return
    deleteCandidate(c.id)
    addToast(language === 'FR' ? 'Candidat supprimé' : 'Candidate deleted', 'success')
  }

  const activeOnly = candidates.filter(c => !c.isHistorical)
  const historicalCount = candidates.filter(c => c.isHistorical).length
  const displayBase = showHistorical ? candidates : activeOnly

  const newCount = displayBase.filter((c) => !c.isRehire).length
  const rehireCount = displayBase.filter((c) => c.isRehire).length

  const filtered = displayBase.filter((c) => {
    if (tab === 'new' && c.isRehire) return false
    if (tab === 'rehire' && !c.isRehire) return false
    if (search) {
      const q = search.toLowerCase()
      const name = `${c.firstName} ${c.lastName}`.toLowerCase()
      const phone = (c.phone || '').replace(/\D/g, '')
      const email = (c.email || '').toLowerCase()
      if (!name.includes(q) && !phone.includes(q) && !email.includes(q)) return false
    }
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    if (filterLang !== 'all' && c.languagePreference !== filterLang) return false
    if (filterOffice && c.officeCode !== filterOffice) return false
    if (dateFrom && c.interviewDate && c.interviewDate < dateFrom) return false
    if (dateTo && c.interviewDate && c.interviewDate > dateTo) return false
    return true
  })

  const btnStyle = (active) => ({
    padding: '5px 12px',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: 6,
    border: active ? '1.5px solid #CF2B1A' : '1px solid #E5E7EB',
    background: active ? '#FFF5F5' : 'white',
    color: active ? '#CF2B1A' : '#374151',
    cursor: 'pointer',
    transition: 'all 0.1s',
  })

  return (
    <div style={{ padding: 24, position: 'relative' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{t('pipeline', language)}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {historicalCount > 0 && (
            <button
              onClick={() => setShowHistorical(v => !v)}
              title={showHistorical
                ? (language === 'FR' ? 'Masquer les données historiques' : 'Hide historical records')
                : (language === 'FR' ? 'Afficher les données historiques' : 'Show historical records')}
              style={{
                background: showHistorical ? '#EFF6FF' : 'white',
                color: showHistorical ? '#1E40AF' : '#6B7280',
                border: `1px solid ${showHistorical ? '#BFDBFE' : '#E5E7EB'}`,
                borderRadius: 8, padding: '7px 14px', fontSize: '0.78rem', fontWeight: showHistorical ? 700 : 500, cursor: 'pointer',
              }}
            >
              🕓 {showHistorical
                ? (language === 'FR' ? `Historique (${historicalCount})` : `Historical (${historicalCount})`)
                : (language === 'FR' ? `Voir historique (${historicalCount})` : `Show historical (${historicalCount})`)}
            </button>
          )}
          {canAdd && (
          <>
            <button
              onClick={() => setShowImport(true)}
              style={{ background: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              ↑ {language === 'FR' ? 'Importer' : 'Import'}
            </button>
            <button
              onClick={() => setOpenAddPanel(true)}
              style={{ background: '#CF2B1A', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              + {t('addCandidate', language)}
              <span style={{ fontSize: '0.65rem', opacity: 0.7, fontFamily: 'IBM Plex Mono, monospace', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 3, padding: '1px 4px' }}>N</span>
            </button>
          </>)}
        </div>
      </div>

      {/* New / Rehire tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #E5E7EB' }}>
        {[
          { key: 'all', label: language === 'FR' ? 'Tous' : 'All', count: displayBase.length },
          { key: 'new', label: language === 'FR' ? 'Nouvelles embauches' : 'New Hires', count: newCount },
          { key: 'rehire', label: language === 'FR' ? 'Réembauches' : 'Rehires', count: rehireCount },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '8px 18px', fontSize: '0.825rem', fontWeight: tab === key ? 700 : 400,
              background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #CF2B1A' : '2px solid transparent',
              color: tab === key ? '#CF2B1A' : '#6B7280', cursor: 'pointer', marginBottom: -2,
              transition: 'all 0.15s',
            }}
          >
            {label}
            <span style={{ marginLeft: 6, fontSize: '0.7rem', background: tab === key ? '#FFF5F5' : '#F3F4F6', color: tab === key ? '#CF2B1A' : '#9CA3AF', borderRadius: 10, padding: '1px 6px', fontWeight: 600 }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={`${t('search', language)}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', width: 200, outline: 'none' }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}>
          <option value="all">{t('all', language)} {t('status', language)}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(s, language)}</option>)}
        </select>
        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}>
          <option value="all">{t('all', language)} {t('region', language)}</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}>
          <option value="all">EN + FR</option>
          <option value="EN">EN</option>
          <option value="FR">FR</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.75rem' }} />
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>→</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.75rem' }} />
        {(search || filterStatus !== 'all' || filterRegion !== 'all' || filterLang !== 'all' || filterOffice || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterRegion('all'); setFilterLang('all'); setFilterOffice(''); setDateFrom(''); setDateTo('') }}
            style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: 'pointer' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Count */}
      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 12 }}>
        {filtered.length} {language === 'FR' ? 'candidat(e)s' : 'candidates'}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH_STYLE}>{t('firstName', language)} {t('lastName', language)}</th>
              <th style={TH_STYLE}>{t('phone', language)}</th>
              <th style={TH_STYLE}>{t('email', language)}</th>
              <th style={TH_STYLE}>{t('officeCode', language)}</th>
              <th style={TH_STYLE}>{t('manager', language)}</th>
              <th style={TH_STYLE}>Lang</th>
              <th style={TH_STYLE}>{t('status', language)}</th>
              <th style={TH_STYLE}>{t('day0', language)}</th>
              <th style={TH_STYLE}>{t('interviewDate', language)}</th>
              <th style={TH_STYLE}>{t('source', language)}</th>
              <th style={TH_STYLE}>{t('isRehire', language)}</th>
              <th style={TH_STYLE}>{t('payrollId', language)}</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>⚠</th>
              {canDelete && <th style={TH_STYLE} />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 14 : 13} style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                  {search ? t('noResults', language) : t('emptyPipeline', language)}
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? 'white' : '#FAFAFA', cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => setOpenAddPanel(true, c.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF5F5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#FAFAFA')}
                >
                  <td style={{ ...COL_STYLE, fontWeight: 500, color: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <span>{c.firstName} {c.lastName}{c.preferredName && <span style={{ color: '#9CA3AF', fontWeight: 400 }}> ({c.preferredName})</span>}</span>
                      {c.isHistorical && (
                        <span title={language === 'FR' ? 'Enregistrement historique' : 'Historical record'} style={{ fontSize: '0.58rem', background: '#EFF6FF', color: '#1E40AF', borderRadius: 4, padding: '1px 5px', fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid #BFDBFE' }}>
                          {language === 'FR' ? 'HIST' : 'HIST'}
                        </span>
                      )}
                      {c.isDNH && (
                        <span title={language === 'FR' ? 'Sur la liste Ne pas embaucher' : 'On Do Not Hire list'} style={{ fontSize: '0.58rem', background: '#DC2626', color: 'white', borderRadius: 4, padding: '1px 5px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          DNH
                        </span>
                      )}
                      {c.status === 'Hired' && !c.username && !c.isHistorical && (
                        <span title={language === 'FR' ? 'Profil utilisateur manquant' : 'User profile missing'} style={{ fontSize: '0.58rem', background: '#FEE2E2', color: '#CF2B1A', borderRadius: 4, padding: '1px 5px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ⚠ {language === 'FR' ? 'Profil' : 'Profile'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...COL_STYLE, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', color: '#374151' }}>{c.phone}</td>
                  <td style={{ ...COL_STYLE, color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</td>
                  <td style={{ ...COL_STYLE, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', fontWeight: 600, color: '#1E40AF' }}>{c.officeCode}</td>
                  <td style={{ ...COL_STYLE, color: '#374151' }}>{c.manager}</td>
                  <td style={{ ...COL_STYLE }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: c.languagePreference === 'FR' ? '#DBEAFE' : '#F3F4F6', color: c.languagePreference === 'FR' ? '#1E40AF' : '#374151' }}>
                      {c.languagePreference || 'EN'}
                    </span>
                  </td>
                  <td style={COL_STYLE} onClick={(e) => e.stopPropagation()}>
                    <StatusBadge
                      status={c.status || 'Pending'}
                      lang={language}
                      onStatusChange={(s) => handleStatusChange(c.id, s)}
                    />
                  </td>
                  <td style={{ ...COL_STYLE, color: '#374151', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem' }}>{c.day0 || '—'}</td>
                  <td style={{ ...COL_STYLE, color: '#374151', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem' }}>{c.interviewDate || '—'}</td>
                  <td style={{ ...COL_STYLE, color: '#374151' }}>{c.source}</td>
                  <td style={{ ...COL_STYLE, textAlign: 'center' }}>
                    {c.isRehire ? <span style={{ color: '#059669', fontSize: '0.7rem', fontWeight: 700 }}>✓</span> : <span style={{ color: '#D1D5DB' }}>—</span>}
                  </td>
                  <td style={{ ...COL_STYLE, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', color: '#6B7280' }}>
                    {c.payrollId || <span style={{ color: '#D1D5DB' }}>—</span>}
                  </td>
                  <td style={{ ...COL_STYLE, textAlign: 'center' }}>
                    {c.isDuplicate && <span style={{ color: '#EF4444', fontSize: '0.9rem' }}>⚠</span>}
                  </td>
                  {canDelete && (
                    <td style={{ ...COL_STYLE, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(e, c)}
                        title={language === 'FR' ? 'Supprimer' : 'Delete'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '0.85rem', padding: '2px 6px', borderRadius: 4, transition: 'color 0.1s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#D1D5DB')}
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} />
      )}

      {/* Add/Edit Panel */}
      {openAddPanel && (
        <AddCandidatePanel
          candidateId={editingCandidateId}
          onClose={() => setOpenAddPanel(false)}
        />
      )}
    </div>
  )
}
