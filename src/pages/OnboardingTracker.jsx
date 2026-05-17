import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { REGIONS, OFFICES } from '../data/offices'

const STEP_LABELS = ['step1', 'step2', 'step3', 'step4']

function getOnboardingStatus(c) {
  const ob = c.onboarding || {}
  if (!ob.userCreated) return 'awaitingUserCreation'
  if (!ob.adpSentDate) return 'awaitingADPSend'
  if (!ob.adpCompleteDate) return 'adpSentPending'
  const hasMissingDocs = ob.missingDocs && Object.values(ob.missingDocs).some(Boolean)
  if (hasMissingDocs && !ob.missingDocsEmailSent) return 'missingDocuments'
  if (!ob.podActivatedDate) return 'podPending'
  return 'fullyComplete'
}

function StepBar({ steps, lang }) {
  const colors = ['#9CA3AF', '#F59E0B', '#3B82F6', '#10B981']
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {steps.map((done, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div
            title={t(STEP_LABELS[i], lang)}
            style={{
              width: 28,
              height: 7,
              borderRadius: 4,
              background: done ? colors[i] : '#E5E7EB',
              transition: 'background 0.3s',
            }}
          />
          {i < steps.length - 1 && <div style={{ width: 6, height: 1, background: '#E5E7EB' }} />}
        </div>
      ))}
    </div>
  )
}

function OnboardingRow({ candidate, language }) {
  const updateCandidate = useStore((s) => s.updateCandidate)
  const addToast = useStore((s) => s.addToast)
  const [expanded, setExpanded] = useState(false)

  const ob = candidate.onboarding || {
    userCreated: false,
    adpSentDate: '',
    adpCompleteDate: '',
    podActivatedDate: '',
    missingDocs: { directDeposit: false, sin: false, govId: false, contract: false, workPermit: false },
    missingDocsEmailSent: false,
    hsfAccountNeeded: false,
    hsfItRequestSent: false,
  }

  const hasMissingDocs = ob.missingDocs && Object.values(ob.missingDocs).some(Boolean)
  const isHSF = candidate.charity === 'HSF'

  const steps = [
    ob.userCreated,
    !!ob.adpSentDate,
    !!ob.adpCompleteDate,
    !!ob.podActivatedDate,
  ]

  const update = (path, value) => {
    let newOb = { ...ob }
    if (path.startsWith('missingDocs.')) {
      const key = path.split('.')[1]
      newOb = { ...newOb, missingDocs: { ...newOb.missingDocs, [key]: value } }
    } else {
      newOb = { ...newOb, [path]: value }
    }
    updateCandidate(candidate.id, { onboarding: newOb })
    addToast(t('updatedSuccessfully', language), 'success')
  }

  const checkboxStyle = { width: 14, height: 14, accentColor: '#CF2B1A', cursor: 'pointer' }
  const dateInpStyle = {
    padding: '4px 8px',
    fontSize: '0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: 4,
    fontFamily: 'IBM Plex Mono, monospace',
    width: 130,
  }

  const status = getOnboardingStatus(candidate)
  const isComplete = status === 'fullyComplete'

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 10,
        border: `1px solid ${isComplete ? '#D1FAE5' : '#E5E7EB'}`,
        marginBottom: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Summary row */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: 'pointer',
          gap: 16,
          background: isComplete ? '#F0FDF4' : 'white',
        }}
      >
        <div style={{ flex: '0 0 auto', minWidth: 180 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
            {candidate.firstName} {candidate.lastName}
            {candidate.preferredName && <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: '0.8rem' }}> ({candidate.preferredName})</span>}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#1E40AF' }}>{candidate.officeCode}</span>
            {' · '}{candidate.manager}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <StepBar steps={steps} lang={language} />
          <div style={{ fontSize: '0.65rem', color: '#6B7280', marginTop: 4 }}>
            {t(STEP_LABELS[0], language)} → {t(STEP_LABELS[1], language)} → {t(STEP_LABELS[2], language)} → {t(STEP_LABELS[3], language)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          {hasMissingDocs && (
            <span title={t('missingDocs', language)} style={{ fontSize: '1rem' }}>🟡</span>
          )}
          {isHSF && !ob.hsfItRequestSent && (
            <span title="HSF" style={{ fontSize: '0.7rem', background: '#DBEAFE', color: '#1E40AF', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>HSF</span>
          )}
          <div style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: 12, background: isComplete ? '#D1FAE5' : '#FEF3C7', color: isComplete ? '#065F46' : '#92400E' }}>
            {t(status, language)}
          </div>
          <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {/* Expanded checklist */}
      {expanded && (
        <div style={{ padding: '16px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {/* Step 1: User Created */}
            <div style={{ background: 'white', borderRadius: 8, padding: '14px', border: `1px solid ${ob.userCreated ? '#D1FAE5' : '#E5E7EB'}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                1. {t('step1', language)}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox" checked={ob.userCreated || false} onChange={(e) => update('userCreated', e.target.checked)} style={checkboxStyle} />
                <span style={{ fontSize: '0.8rem', fontWeight: ob.userCreated ? 600 : 400, color: ob.userCreated ? '#065F46' : '#374151' }}>
                  {t('userCreated', language)}
                </span>
              </label>
              {ob.userCreated && candidate.username && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: '#F9FAFB', borderRadius: 6, fontSize: '0.75rem' }}>
                  <div style={{ color: '#6B7280', marginBottom: 4 }}>{t('username', language)}:</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#111827' }}>{candidate.username}</div>
                  <div style={{ color: '#6B7280', marginTop: 4 }}>{t('password', language)}:</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: '#CF2B1A', letterSpacing: '0.2em', fontSize: '0.9rem' }}>{candidate.password}</div>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: 4 }}>{t('payrollId', language)}:</div>
                <input
                  type="text"
                  value={candidate.payrollId || ''}
                  onChange={(e) => updateCandidate(candidate.id, { payrollId: e.target.value })}
                  onBlur={() => addToast(t('updatedSuccessfully', language), 'success')}
                  placeholder={language === 'FR' ? 'Entrer ID...' : 'Enter ID...'}
                  style={{ ...dateInpStyle, width: '100%' }}
                />
              </div>
            </div>

            {/* Step 2: ADP Onboarding Sent */}
            <div style={{ background: 'white', borderRadius: 8, padding: '14px', border: `1px solid ${ob.adpSentDate ? '#DBEAFE' : '#E5E7EB'}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                2. {t('step2', language)}
              </div>
              {!candidate.payrollId && (
                <div style={{ fontSize: '0.72rem', color: '#92400E', background: '#FEF3C7', padding: '6px 8px', borderRadius: 4, marginBottom: 8, border: '1px solid #F59E0B' }}>
                  ⚠ {t('payrollRequired', language)}
                </div>
              )}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>{t('adpSentDate', language)}:</label>
                <input
                  type="date"
                  value={ob.adpSentDate || ''}
                  disabled={!candidate.payrollId}
                  onChange={(e) => update('adpSentDate', e.target.value)}
                  style={{ ...dateInpStyle, opacity: candidate.payrollId ? 1 : 0.5, cursor: candidate.payrollId ? 'pointer' : 'not-allowed' }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('missingDocs', language)}:</div>
                {['directDeposit', 'sin', 'govId', 'contract', 'workPermit'].map((doc) => (
                  <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={ob.missingDocs?.[doc] || false}
                      onChange={(e) => update(`missingDocs.${doc}`, e.target.checked)}
                      style={{ ...checkboxStyle, accentColor: '#F59E0B' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: ob.missingDocs?.[doc] ? '#92400E' : '#6B7280' }}>
                      {t(doc, language)}
                    </span>
                  </label>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={ob.missingDocsEmailSent || false}
                  onChange={(e) => update('missingDocsEmailSent', e.target.checked)}
                  style={checkboxStyle}
                />
                <span style={{ fontSize: '0.78rem', color: '#374151' }}>{t('missingDocsEmailSent', language)}</span>
              </label>
            </div>

            {/* Step 3: ADP Complete */}
            <div style={{ background: 'white', borderRadius: 8, padding: '14px', border: `1px solid ${ob.adpCompleteDate ? '#D1FAE5' : '#E5E7EB'}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                3. {t('step3', language)}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>{t('adpCompleteDate', language)}:</label>
                <input
                  type="date"
                  value={ob.adpCompleteDate || ''}
                  onChange={(e) => update('adpCompleteDate', e.target.value)}
                  style={dateInpStyle}
                />
              </div>
              {isHSF && (
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={ob.hsfAccountNeeded || false}
                      onChange={(e) => update('hsfAccountNeeded', e.target.checked)}
                      style={checkboxStyle}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>{t('hsfAccountNeeded', language)}</span>
                  </label>
                  {ob.hsfAccountNeeded && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 20 }}>
                      <input
                        type="checkbox"
                        checked={ob.hsfItRequestSent || false}
                        onChange={(e) => update('hsfItRequestSent', e.target.checked)}
                        style={checkboxStyle}
                      />
                      <span style={{ fontSize: '0.78rem', color: '#374151' }}>{t('hsfItRequestSent', language)}</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: POD Activated */}
            <div style={{ background: 'white', borderRadius: 8, padding: '14px', border: `1px solid ${ob.podActivatedDate ? '#D1FAE5' : '#E5E7EB'}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                4. {t('step4', language)}
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>{t('podActivatedDate', language)}:</label>
                <input
                  type="date"
                  value={ob.podActivatedDate || ''}
                  onChange={(e) => update('podActivatedDate', e.target.value)}
                  style={dateInpStyle}
                />
              </div>
              {ob.podActivatedDate && ob.adpCompleteDate && ob.adpSentDate && ob.userCreated && (
                <div style={{ marginTop: 12, padding: '6px 10px', background: '#D1FAE5', borderRadius: 6, fontSize: '0.75rem', color: '#065F46', fontWeight: 600 }}>
                  ✓ {t('fullyComplete', language)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const FILTER_OPTIONS = ['all', 'awaitingUserCreation', 'awaitingADPSend', 'adpSentPending', 'missingDocuments', 'podPending', 'fullyComplete']

export default function OnboardingTracker() {
  const language = useStore((s) => s.language)
  const candidates = useStore((s) => s.candidates)
  const [filter, setFilter] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterOffice, setFilterOffice] = useState('')
  const [search, setSearch] = useState('')

  const hired = candidates.filter((c) => c.status === 'Hired')

  const filtered = hired.filter((c) => {
    const status = getOnboardingStatus(c)
    if (filter !== 'all' && status !== filter) return false
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    if (filterOffice && c.officeCode !== filterOffice) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${c.firstName} ${c.lastName}`.toLowerCase().includes(q) && !(c.officeCode || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const counts = FILTER_OPTIONS.reduce((acc, f) => {
    acc[f] = f === 'all' ? hired.length : hired.filter((c) => getOnboardingStatus(c) === f).length
    return acc
  }, {})

  const filterBtnStyle = (active) => ({
    padding: '5px 12px',
    fontSize: '0.75rem',
    fontWeight: active ? 600 : 400,
    borderRadius: 6,
    border: active ? '1.5px solid #CF2B1A' : '1px solid #E5E7EB',
    background: active ? '#FFF5F5' : 'white',
    color: active ? '#CF2B1A' : '#374151',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{t('onboarding', language)}</h1>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {filtered.length} / {hired.length} {language === 'FR' ? 'candidat(e)s embauché(e)s' : 'hired candidates'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTER_OPTIONS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={filterBtnStyle(filter === f)}>
            {t(f, language)}
            <span style={{ marginLeft: 4, fontSize: '0.65rem', background: filter === f ? '#CF2B1A' : '#F3F4F6', color: filter === f ? 'white' : '#6B7280', borderRadius: 10, padding: '1px 5px' }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={`${t('search', language)}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', width: 200, outline: 'none' }}
        />
        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}>
          <option value="all">{t('all', language)} {t('region', language)}</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}>
          <option value="">{t('all', language)} {t('officeCode', language)}</option>
          {OFFICES.map((o) => <option key={o.code} value={o.code}>{o.code} — {o.name}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#9CA3AF', label: t('step1', language) },
          { color: '#F59E0B', label: t('step2', language) },
          { color: '#3B82F6', label: t('step3', language) },
          { color: '#10B981', label: t('step4', language) },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#6B7280' }}>
            <div style={{ width: 12, height: 6, borderRadius: 3, background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF', fontSize: '0.875rem', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          {hired.length === 0 ? t('emptyOnboarding', language) : t('noResults', language)}
        </div>
      ) : (
        filtered.map((c) => (
          <OnboardingRow key={c.id} candidate={c} language={language} />
        ))
      )}
    </div>
  )
}
