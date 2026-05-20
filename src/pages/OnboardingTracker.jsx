import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { REGIONS, OFFICES } from '../data/offices'

const STEP_LABELS = ['step1', 'step2', 'step3', 'step4']

function getOnboardingStatus(c) {
  const ob = c.onboarding || {}
  // Step 1 (user profile) is the gate condition — all candidates here already have it
  if (!ob.adpSentDate) return 'awaitingADPSend'
  // Once ADP complete date is set, missing docs no longer block progression
  if (!ob.adpCompleteDate) return 'adpSentPending'
  if (!ob.podActivatedDate) return 'podPending'
  return 'fullyComplete'
}

function fmtDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StepBar({ steps }) {
  const colors = ['#9CA3AF', '#F59E0B', '#3B82F6', '#10B981']
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {steps.map((done, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div
            title={STEP_LABELS[i]}
            style={{
              width: 28, height: 7, borderRadius: 4,
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

function OnboardingRow({ candidate, language, role }) {
  const updateCandidate = useStore((s) => s.updateCandidate)
  const addToast = useStore((s) => s.addToast)
  const [expanded, setExpanded] = useState(false)

  // Operations: read-only. Step 1 editable only by Recruitment. Steps 2-4 editable only by Admin.
  const isOps = role === 'operations'
  const isRecruitment = role === 'recruitment'
  const isAdmin = role === 'admin'

  const ob = candidate.onboarding || {
    userCreated: false,
    userCreatedAt: null,
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
    true,                  // Step 1: always complete (username is the gate condition)
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
    // Track timestamp when user creation is checked on
    if (path === 'userCreated' && value === true && !ob.userCreatedAt) {
      newOb.userCreatedAt = new Date().toISOString()
    }
    updateCandidate(candidate.id, { onboarding: newOb })
    addToast(t('updatedSuccessfully', language), 'success')
  }

  const checkboxStyle = (disabled) => ({
    width: 14, height: 14,
    accentColor: '#CF2B1A',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  })
  const dateInpStyle = (disabled) => ({
    padding: '4px 8px',
    fontSize: '0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: 4,
    fontFamily: 'IBM Plex Mono, monospace',
    width: 130,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#F9FAFB' : 'white',
  })

  const status = getOnboardingStatus(candidate)
  const isComplete = status === 'fullyComplete'

  return (
    <div style={{
      background: 'white',
      borderRadius: 10,
      border: `1px solid ${isComplete ? '#D1FAE5' : '#E5E7EB'}`,
      marginBottom: 10,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex', alignItems: 'center', padding: '12px 16px',
          cursor: 'pointer', gap: 16, background: isComplete ? '#F0FDF4' : 'white',
        }}
      >
        <div style={{ flex: '0 0 auto', minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
            {candidate.firstName} {candidate.lastName}
            {candidate.preferredName && (
              <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: '0.8rem' }}> ({candidate.preferredName})</span>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#1E40AF' }}>{candidate.officeCode}</span>
            {' · '}{candidate.manager}
          </div>
          {/* Hired timestamp */}
          {candidate.hiredAt && (
            <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>
              {language === 'FR' ? 'Embauché(e)' : 'Hired'}: {fmtDateTime(candidate.hiredAt)}
            </div>
          )}
          {/* User created timestamp */}
          {ob.userCreatedAt && (
            <div style={{ fontSize: '0.65rem', color: '#059669', marginTop: 1 }}>
              {language === 'FR' ? 'Utilisateur créé' : 'User created'}: {fmtDateTime(ob.userCreatedAt)}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <StepBar steps={steps} />
          <div style={{ fontSize: '0.65rem', color: '#6B7280', marginTop: 4 }}>
            {t(STEP_LABELS[0], language)} → {t(STEP_LABELS[1], language)} → {t(STEP_LABELS[2], language)} → {t(STEP_LABELS[3], language)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          {hasMissingDocs && (
            <span title={t('missingDocs', language)} style={{ fontSize: '1rem' }}>🟡</span>
          )}
          {isHSF && !ob.hsfItRequestSent && (
            <span style={{ fontSize: '0.7rem', background: '#DBEAFE', color: '#1E40AF', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>HSF</span>
          )}
          {candidate.isRehire && (
            <span style={{ fontSize: '0.7rem', background: '#EDE9FE', color: '#5B21B6', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
              {language === 'FR' ? 'Réembauche' : 'Rehire'}
            </span>
          )}
          <div style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: 12,
            background: isComplete ? '#D1FAE5' : '#FEF3C7',
            color: isComplete ? '#065F46' : '#92400E',
          }}>
            {t(status, language)}
          </div>
          {isOps && (
            <span style={{ fontSize: '0.65rem', color: '#9CA3AF', fontStyle: 'italic' }}>
              {language === 'FR' ? 'Lecture seule' : 'Read-only'}
            </span>
          )}
          <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {/* Expanded checklist */}
      {expanded && (
        <div style={{ padding: '16px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
          {isOps && (
            <div style={{
              marginBottom: 12, padding: '8px 12px', background: '#F3F4F6',
              borderRadius: 6, fontSize: '0.75rem', color: '#6B7280', border: '1px solid #E5E7EB',
            }}>
              {language === 'FR'
                ? 'Vous êtes en mode lecture seule. Contactez Admin pour mettre à jour l\'intégration.'
                : 'You are in read-only mode. Contact Admin to update onboarding steps.'}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {/* Step 1: User Profile — auto-complete, created via User Profiles page */}
            <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '14px', border: '1px solid #D1FAE5' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                1. {t('step1', language)} ✓
              </div>
              <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: 10, fontStyle: 'italic' }}>
                {language === 'FR' ? 'Créé via « Profils utilisateurs » par le recrutement' : 'Created via "User Profiles" by Recruitment'}
              </div>
              <div style={{ padding: '8px 10px', background: 'white', borderRadius: 6, fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.65rem', marginBottom: 2 }}>{t('username', language)}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: '#111827' }}>{candidate.username || <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 400 }}>{language === 'FR' ? 'Compte actif (historique)' : 'Active account (historical)'}</span>}</div>
                  </div>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.65rem', marginBottom: 2 }}>{t('password', language)}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: '#CF2B1A', letterSpacing: '0.15em' }}>{candidate.password}</div>
                  </div>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.65rem', marginBottom: 2 }}>{t('payrollId', language)}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#111827' }}>{candidate.payrollId || '—'}</div>
                  </div>
                </div>
                {ob.userCreatedAt && (
                  <div style={{ fontSize: '0.65rem', color: '#059669', marginTop: 8 }}>
                    ✓ {fmtDateTime(ob.userCreatedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: ADP Onboarding Sent — Admin only */}
            <div style={{
              background: 'white', borderRadius: 8, padding: '14px',
              border: `1px solid ${ob.adpSentDate ? '#DBEAFE' : '#E5E7EB'}`,
              opacity: isRecruitment ? 0.7 : 1,
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                2. {t('step2', language)}
              </div>
              {isRecruitment && (
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: 8, fontStyle: 'italic' }}>
                  {language === 'FR' ? 'Géré par Admin' : 'Managed by Admin'}
                </div>
              )}
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
                  disabled={!candidate.payrollId || isOps || isRecruitment}
                  onChange={(e) => update('adpSentDate', e.target.value)}
                  style={dateInpStyle(!candidate.payrollId || isOps || isRecruitment)}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('missingDocs', language)}:</div>
                {['directDeposit', 'sin', 'govId', 'contract', 'workPermit'].map((doc) => (
                  <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: (isOps || isRecruitment) ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={ob.missingDocs?.[doc] || false}
                      disabled={isOps || isRecruitment}
                      onChange={(e) => update(`missingDocs.${doc}`, e.target.checked)}
                      style={{ ...checkboxStyle(isOps || isRecruitment), accentColor: '#F59E0B' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: ob.missingDocs?.[doc] ? '#92400E' : '#6B7280' }}>
                      {t(doc, language)}
                    </span>
                  </label>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: (isOps || isRecruitment) ? 'not-allowed' : 'pointer', marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={ob.missingDocsEmailSent || false}
                  disabled={isOps || isRecruitment}
                  onChange={(e) => update('missingDocsEmailSent', e.target.checked)}
                  style={checkboxStyle(isOps || isRecruitment)}
                />
                <span style={{ fontSize: '0.78rem', color: '#374151' }}>{t('missingDocsEmailSent', language)}</span>
              </label>
            </div>

            {/* Step 3: ADP Complete — Admin only */}
            <div style={{
              background: 'white', borderRadius: 8, padding: '14px',
              border: `1px solid ${ob.adpCompleteDate ? '#D1FAE5' : '#E5E7EB'}`,
              opacity: isRecruitment ? 0.7 : 1,
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                3. {t('step3', language)}
              </div>
              {isRecruitment && (
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: 8, fontStyle: 'italic' }}>
                  {language === 'FR' ? 'Géré par Admin' : 'Managed by Admin'}
                </div>
              )}
              {hasMissingDocs && ob.adpCompleteDate && (
                <div style={{ fontSize: '0.7rem', color: '#92400E', background: '#FEF3C7', padding: '5px 8px', borderRadius: 4, marginBottom: 8 }}>
                  🟡 {language === 'FR' ? 'Documents manquants — conservés pour les rapports' : 'Missing docs noted — retained for reporting'}
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>{t('adpCompleteDate', language)}:</label>
                <input
                  type="date"
                  value={ob.adpCompleteDate || ''}
                  disabled={isOps || isRecruitment}
                  onChange={(e) => update('adpCompleteDate', e.target.value)}
                  style={dateInpStyle(isOps || isRecruitment)}
                />
              </div>
              {isHSF && (
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: (isOps || isRecruitment) ? 'not-allowed' : 'pointer', marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={ob.hsfAccountNeeded || false}
                      disabled={isOps || isRecruitment}
                      onChange={(e) => update('hsfAccountNeeded', e.target.checked)}
                      style={checkboxStyle(isOps || isRecruitment)}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>{t('hsfAccountNeeded', language)}</span>
                  </label>
                  {ob.hsfAccountNeeded && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: (isOps || isRecruitment) ? 'not-allowed' : 'pointer', marginLeft: 20 }}>
                      <input
                        type="checkbox"
                        checked={ob.hsfItRequestSent || false}
                        disabled={isOps || isRecruitment}
                        onChange={(e) => update('hsfItRequestSent', e.target.checked)}
                        style={checkboxStyle(isOps || isRecruitment)}
                      />
                      <span style={{ fontSize: '0.78rem', color: '#374151' }}>{t('hsfItRequestSent', language)}</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: POD Activated — Admin only */}
            <div style={{
              background: 'white', borderRadius: 8, padding: '14px',
              border: `1px solid ${ob.podActivatedDate ? '#D1FAE5' : '#E5E7EB'}`,
              opacity: isRecruitment ? 0.7 : 1,
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                4. {t('step4', language)}
              </div>
              {isRecruitment && (
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: 8, fontStyle: 'italic' }}>
                  {language === 'FR' ? 'Géré par Admin' : 'Managed by Admin'}
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>{t('podActivatedDate', language)}:</label>
                <input
                  type="date"
                  value={ob.podActivatedDate || ''}
                  disabled={isOps || isRecruitment}
                  onChange={(e) => update('podActivatedDate', e.target.value)}
                  style={dateInpStyle(isOps || isRecruitment)}
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

const FILTER_OPTIONS = ['all', 'awaitingADPSend', 'adpSentPending', 'missingDocuments', 'podPending', 'fullyComplete']

export default function OnboardingTracker() {
  const language = useStore((s) => s.language)
  const role = useStore((s) => s.role)
  const candidates = useStore((s) => s.candidates)
  const [filter, setFilter] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterOffice, setFilterOffice] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Active hires: non-historical with username
  // + 2026 historical in-progress (POD not yet activated) — already active in the real system
  const hist2026InProgress = candidates.filter((c) =>
    c.isHistorical &&
    !c.onboarding?.podActivated &&
    c.status === 'Hired' &&
    new Date(c.createdAt).getFullYear() >= 2026
  )
  const allHired = candidates.filter((c) => c.status === 'Hired' && !c.isHistorical)
  const awaitingProfile = allHired.filter((c) => !c.username)
  const hired = [...allHired.filter((c) => !!c.username), ...hist2026InProgress]

  const filtered = hired.filter((c) => {
    const obStatus = getOnboardingStatus(c)
    if (filter === 'missingDocuments') {
      const md = c.onboarding?.missingDocs || {}
      if (!Object.values(md).some(Boolean)) return false
    } else if (filter !== 'all' && obStatus !== filter) {
      return false
    }
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    if (filterOffice && c.officeCode !== filterOffice) return false
    if (dateFrom && (c.onboarding?.podActivatedDate || '') < dateFrom) return false
    if (dateTo && (c.onboarding?.podActivatedDate || '') > dateTo) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${c.firstName} ${c.lastName}`.toLowerCase().includes(q) && !(c.officeCode || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const counts = {
    all: hired.length,
    awaitingADPSend: hired.filter((c) => getOnboardingStatus(c) === 'awaitingADPSend').length,
    adpSentPending: hired.filter((c) => getOnboardingStatus(c) === 'adpSentPending').length,
    missingDocuments: hired.filter((c) => { const md = c.onboarding?.missingDocs || {}; return Object.values(md).some(Boolean) }).length,
    podPending: hired.filter((c) => getOnboardingStatus(c) === 'podPending').length,
    fullyComplete: hired.filter((c) => getOnboardingStatus(c) === 'fullyComplete').length,
  }

  const filterBtnStyle = (active) => ({
    padding: '5px 12px', fontSize: '0.75rem',
    fontWeight: active ? 600 : 400, borderRadius: 6,
    border: active ? '1.5px solid #CF2B1A' : '1px solid #E5E7EB',
    background: active ? '#FFF5F5' : 'white',
    color: active ? '#CF2B1A' : '#374151',
    cursor: 'pointer', whiteSpace: 'nowrap',
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

      {/* Status filters */}
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
        <span style={{ fontSize: '0.72rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
          {language === 'FR' ? 'Complété:' : 'Completed:'}
        </span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace' }} />
        <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>→</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace' }} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }}
            style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: 5, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', color: '#6B7280' }}>
            ✕
          </button>
        )}
      </div>

      {/* Step legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#9CA3AF', label: t('step1', language) + ' (Recruitment)' },
          { color: '#F59E0B', label: t('step2', language) + ' (Admin)' },
          { color: '#3B82F6', label: t('step3', language) + ' (Admin)' },
          { color: '#10B981', label: t('step4', language) + ' (Admin)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#6B7280' }}>
            <div style={{ width: 12, height: 6, borderRadius: 3, background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Awaiting user profile banner */}
      {awaitingProfile.length > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1rem' }}>⏳</span>
          <div style={{ fontSize: '0.8rem', color: '#92400E' }}>
            <strong>{awaitingProfile.length}</strong>{' '}
            {language === 'FR'
              ? `embauché(e)${awaitingProfile.length > 1 ? 's' : ''} en attente de profil utilisateur — visible ici après création dans « Profils utilisateurs »`
              : `hired candidate${awaitingProfile.length > 1 ? 's' : ''} awaiting user profile — will appear here after profile created in "User Profiles"`}
          </div>
        </div>
      )}

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF', fontSize: '0.875rem', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          {hired.length === 0 ? t('emptyOnboarding', language) : (language === 'FR' ? 'Aucun résultat' : 'No results match your filters')}
        </div>
      ) : (
        filtered.map((c) => (
          <OnboardingRow key={c.id} candidate={c} language={language} role={role} />
        ))
      )}
    </div>
  )
}
