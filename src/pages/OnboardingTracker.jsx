import React, { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { REGIONS, OFFICES } from '../data/offices'

const STEP_LABELS = ['step1', 'step2', 'step3', 'step4']

function getOnboardingStatus(c) {
  const ob = c.onboarding || {}
  if (!ob.adpSentDate) return 'awaitingADPSend'
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
  const colors = ['#94A3B8', '#F59E0B', '#3B82F6', '#2DCDB8']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((done, i) => (
        <React.Fragment key={i}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: done ? colors[i] : '#F4F5FB',
            border: `2px solid ${done ? colors[i] : '#E8EAF6'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 700, color: done ? 'white' : '#B0B8CC',
            flexShrink: 0, transition: 'all 0.3s',
          }}>
            {done ? '✓' : i + 1}
          </div>
          {i < 3 && (
            <div style={{ width: 16, height: 2, background: done && steps[i+1] !== undefined ? (steps[i] ? colors[i] : '#E8EAF6') : '#E8EAF6' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function OnboardingRow({ candidate, language, role, selected, onToggleSelect }) {
  const updateCandidate = useStore((s) => s.updateCandidate)
  const addToast = useStore((s) => s.addToast)
  const [expanded, setExpanded] = useState(false)

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
    true,
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
    if (path === 'userCreated' && value === true && !ob.userCreatedAt) {
      newOb.userCreatedAt = new Date().toISOString()
    }
    updateCandidate(candidate.id, { onboarding: newOb })
    addToast(t('updatedSuccessfully', language), 'success')
  }

  const handlePodToggle = (checked) => {
    update('podActivatedDate', checked ? new Date().toISOString().slice(0, 10) : '')
  }

  const checkboxStyle = (disabled) => ({
    width: 14, height: 14,
    accentColor: '#F0194A',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  })
  const dateInpStyle = (disabled) => ({
    padding: '4px 8px',
    fontSize: '0.75rem',
    border: '1px solid #E8EAF6',
    borderRadius: 4,
    fontFamily: 'IBM Plex Mono, monospace',
    width: 130,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#F9FAFB' : 'white',
  })

  const status = getOnboardingStatus(candidate)
  const isComplete = status === 'fullyComplete'
  const isProcessed = isComplete && candidate.exportedAt

  const statusPillStyle = (s) => {
    const map = {
      fullyComplete:    { background: '#E6FAF8', color: '#1AA090' },
      awaitingADPSend:  { background: '#F4F5FB', color: '#94A3B8' },
      adpSentPending:   { background: '#FEF3C7', color: '#92400E' },
      podPending:       { background: '#DBEAFE', color: '#1E40AF' },
    }
    return {
      fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: 12,
      ...(map[s] || { background: '#F4F5FB', color: '#94A3B8' }),
    }
  }

  // Processed = POD complete + exported → green card
  const cardBg = isProcessed ? '#F0FDF4' : (selected ? '#F0F4FF' : 'white')
  const cardBorder = isProcessed ? '#6EE7B7' : (selected ? '#A5B4FC' : (isComplete ? '#C6F7EF' : '#E8EAF6'))

  return (
    <div style={{
      background: cardBg,
      borderRadius: '14px',
      border: `1.5px solid ${cardBorder}`,
      marginBottom: 10,
      overflow: 'hidden',
      boxShadow: isProcessed
        ? '0 1px 6px rgba(34,197,94,0.12)'
        : '0 1px 3px rgba(30,39,105,0.05)',
      transition: 'border-color 0.2s, background 0.2s',
    }}>
      {/* Summary row */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Checkbox column */}
        <div style={{ padding: '12px 8px 12px 14px', flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={e => { e.stopPropagation(); onToggleSelect(candidate.id) }}
            onClick={e => e.stopPropagation()}
            style={{ width: 15, height: 15, accentColor: '#1E2769', cursor: 'pointer', display: 'block' }}
          />
        </div>

        {/* Rest of summary row — clickable to expand */}
        <div
          onClick={() => setExpanded((e) => !e)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', padding: '12px 16px 12px 4px',
            cursor: 'pointer', gap: 16,
            borderRadius: expanded ? '0 14px 0 0' : '0 14px 14px 0',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { if (!isProcessed && !selected) e.currentTarget.style.background = '#F8F9FF' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ flex: '0 0 auto', minWidth: 200 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              {candidate.firstName} {candidate.lastName}
              {isProcessed && <span style={{ fontSize: '0.65rem', background: '#D1FAE5', color: '#065F46', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>✓ Processed</span>}
              {candidate.preferredName && (
                <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: '0.8rem' }}> ({candidate.preferredName})</span>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#1E40AF' }}>{candidate.officeCode}</span>
              {' · '}{candidate.manager}
            </div>
            {candidate.day0 && (
              <div style={{ fontSize: '0.65rem', color: '#7C3AED', marginTop: 2, fontFamily: 'IBM Plex Mono, monospace' }}>
                Day 0: {fmtDate(candidate.day0)}
              </div>
            )}
            {candidate.hiredAt && (
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: 2 }}>
                {language === 'FR' ? 'Embauché(e)' : 'Hired'}: {fmtDateTime(candidate.hiredAt)}
              </div>
            )}
            {candidate.exportedAt && (
              <div style={{ fontSize: '0.65rem', color: '#059669', marginTop: 1 }}>
                {language === 'FR' ? 'Exporté' : 'Exported'}: {fmtDateTime(candidate.exportedAt)}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <StepBar steps={steps} />
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: 4 }}>
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
            <div style={statusPillStyle(status)}>
              {t(status, language)}
            </div>
            {isOps && (
              <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontStyle: 'italic' }}>
                {language === 'FR' ? 'Lecture seule' : 'Read-only'}
              </span>
            )}
            <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{expanded ? '▴' : '▾'}</span>
          </div>
        </div>
      </div>

      {/* Expanded checklist */}
      {expanded && (
        <div style={{ padding: '16px', borderTop: '1px solid #E8EAF6', background: '#FAFAFA' }}>
          {isOps && (
            <div style={{
              marginBottom: 12, padding: '8px 12px', background: '#F4F5FB',
              borderRadius: 6, fontSize: '0.75rem', color: '#64748B', border: '1px solid #E8EAF6',
            }}>
              {language === 'FR'
                ? 'Vous êtes en mode lecture seule. Contactez Admin pour mettre à jour l\'intégration.'
                : 'You are in read-only mode. Contact Admin to update onboarding steps.'}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {/* Step 1: User Profile */}
            <div style={{ background: '#E6FAF8', borderRadius: 10, padding: '14px', border: '1px solid #C6F7EF' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1AA090', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                1. {t('step1', language)} ✓
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: 10, fontStyle: 'italic' }}>
                {language === 'FR' ? 'Créé via « Profils utilisateurs » par le recrutement' : 'Created via "User Profiles" by Recruitment'}
              </div>
              <div style={{ padding: '8px 10px', background: 'white', borderRadius: 6, fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.65rem', marginBottom: 2 }}>{t('username', language)}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: '#111827' }}>{candidate.username || <span style={{ color: '#94A3B8', fontStyle: 'italic', fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 400 }}>{language === 'FR' ? 'Compte actif (historique)' : 'Active account (historical)'}</span>}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.65rem', marginBottom: 2 }}>{t('password', language)}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: '#F0194A', letterSpacing: '0.15em' }}>{candidate.password}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.65rem', marginBottom: 2 }}>{t('payrollId', language)}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#111827' }}>{candidate.payrollId || '—'}</div>
                  </div>
                </div>
                {ob.userCreatedAt && (
                  <div style={{ fontSize: '0.65rem', color: '#1AA090', marginTop: 8 }}>
                    ✓ {fmtDateTime(ob.userCreatedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: ADP Onboarding Sent */}
            <div style={{
              background: 'white', borderRadius: 10, padding: '14px',
              border: '1px solid #E8EAF6',
              opacity: isRecruitment ? 0.7 : 1,
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                2. {t('step2', language)}
              </div>
              {isRecruitment && (
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: 8, fontStyle: 'italic' }}>
                  {language === 'FR' ? 'Géré par Admin' : 'Managed by Admin'}
                </div>
              )}
              {!candidate.payrollId && (
                <div style={{ fontSize: '0.72rem', color: '#92400E', background: '#FEF3C7', padding: '6px 8px', borderRadius: 4, marginBottom: 8, border: '1px solid #F59E0B' }}>
                  ⚠ {t('payrollRequired', language)}
                </div>
              )}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginBottom: 4 }}>{t('adpSentDate', language)}:</label>
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
                    <span style={{ fontSize: '0.78rem', color: ob.missingDocs?.[doc] ? '#92400E' : '#64748B' }}>
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

            {/* Step 3: ADP Complete */}
            <div style={{
              background: 'white', borderRadius: 10, padding: '14px',
              border: '1px solid #E8EAF6',
              opacity: isRecruitment ? 0.7 : 1,
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                3. {t('step3', language)}
              </div>
              {isRecruitment && (
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: 8, fontStyle: 'italic' }}>
                  {language === 'FR' ? 'Géré par Admin' : 'Managed by Admin'}
                </div>
              )}
              {hasMissingDocs && ob.adpCompleteDate && (
                <div style={{ fontSize: '0.7rem', color: '#92400E', background: '#FEF3C7', padding: '5px 8px', borderRadius: 4, marginBottom: 8 }}>
                  🟡 {language === 'FR' ? 'Documents manquants — conservés pour les rapports' : 'Missing docs noted — retained for reporting'}
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginBottom: 4 }}>{t('adpCompleteDate', language)}:</label>
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

            {/* Step 4: POD Activated — checkbox */}
            <div style={{
              background: ob.podActivatedDate ? '#F0FDF9' : 'white',
              borderRadius: 10, padding: '14px',
              border: `1px solid ${ob.podActivatedDate ? '#C6F7EF' : '#E8EAF6'}`,
              opacity: isRecruitment ? 0.7 : 1,
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: ob.podActivatedDate ? '#1AA090' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                4. {t('step4', language)}
              </div>
              {isRecruitment && (
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: 8, fontStyle: 'italic' }}>
                  {language === 'FR' ? 'Géré par Admin' : 'Managed by Admin'}
                </div>
              )}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: (isOps || isRecruitment) ? 'not-allowed' : 'pointer',
                padding: '10px 14px',
                background: ob.podActivatedDate ? '#E6FAF8' : '#F8F9FF',
                borderRadius: 8,
                border: `1.5px solid ${ob.podActivatedDate ? '#2DCDB8' : '#E8EAF6'}`,
                transition: 'all 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={!!ob.podActivatedDate}
                  disabled={isOps || isRecruitment}
                  onChange={(e) => handlePodToggle(e.target.checked)}
                  style={{
                    width: 20, height: 20,
                    accentColor: '#2DCDB8',
                    cursor: (isOps || isRecruitment) ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: ob.podActivatedDate ? '#1AA090' : '#374151' }}>
                    {ob.podActivatedDate
                      ? (language === 'FR' ? 'POD activé ✓' : 'POD Activated ✓')
                      : (language === 'FR' ? 'Marquer comme activé' : 'Mark as activated')}
                  </div>
                  {ob.podActivatedDate && (
                    <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 2, fontFamily: 'IBM Plex Mono, monospace' }}>
                      {fmtDate(ob.podActivatedDate)}
                    </div>
                  )}
                </div>
              </label>
              {ob.podActivatedDate && ob.adpCompleteDate && ob.adpSentDate && (
                <div style={{ marginTop: 10, padding: '6px 10px', background: '#E6FAF8', borderRadius: 6, fontSize: '0.75rem', color: '#1AA090', fontWeight: 600 }}>
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

// Actions dropdown component
function ActionsDropdown({ selected, onExport, onDelete, language }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const FR = language === 'FR'

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '7px 14px', borderRadius: 8, border: '1.5px solid #E8EAF6',
          background: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
          color: '#1E2769', display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 1px 4px rgba(30,39,105,0.08)',
        }}
      >
        {FR ? 'Actions' : 'Actions'} <span style={{ fontSize: '0.6rem' }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 200,
          background: 'white', borderRadius: 10, border: '1px solid #E8EAF6',
          boxShadow: '0 8px 24px rgba(30,39,105,0.12)', minWidth: 180, overflow: 'hidden',
        }}>
          <button
            onClick={() => { setOpen(false); onExport() }}
            style={{
              display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.83rem',
              color: '#1E2769', fontWeight: 600, borderBottom: '1px solid #F3F4F6',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F4F5FB'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            ↓ {FR ? 'Exporter la sélection' : 'Export selected'}
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 400, marginTop: 1 }}>
              {FR ? 'Copier + marquer comme traité' : 'Copy to clipboard + mark processed'}
            </div>
          </button>
          <button
            onClick={() => { setOpen(false); onDelete() }}
            style={{
              display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.83rem',
              color: '#EF4444', fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFF0F5'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            🗑 {FR ? 'Supprimer la sélection' : 'Delete selected'}
          </button>
        </div>
      )}
    </div>
  )
}

// Export modal — admin only
function ExportModal({ candidates, language, onClose }) {
  const [copied, setCopied] = useState(false)
  const FR = language === 'FR'

  const buildText = () =>
    candidates.map(c =>
      `${c.firstName} ${c.lastName} | ${c.officeCode} | ${c.email || '—'} | ${c.phone || '—'}`
    ).join('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(buildText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(30,39,105,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 560,
        boxShadow: '0 20px 60px rgba(30,39,105,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #E8EAF6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E2769' }}>
              {FR ? 'Rapport d\'exportation' : 'Export Report'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>
              {candidates.length} {FR ? 'personne(s) — Prénom Nom | Bureau | Courriel | Téléphone' : 'person/people — First Last | Office | Email | Phone'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          <pre style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.78rem', color: '#1E2769',
            background: '#F4F5FB', borderRadius: 8, padding: '14px', margin: 0,
            whiteSpace: 'pre-wrap', lineHeight: 1.7, border: '1px solid #E8EAF6',
          }}>
            {buildText()}
          </pre>
        </div>
        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #E8EAF6', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E8EAF6', background: 'white', fontSize: '0.85rem', cursor: 'pointer', color: '#374151' }}>
            {FR ? 'Fermer' : 'Close'}
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: copied ? '#2DCDB8' : '#1E2769',
              color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {copied ? (FR ? '✓ Copié!' : '✓ Copied!') : (FR ? 'Copier dans le presse-papiers' : 'Copy to Clipboard')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Direct import modal — admin only
const EMPTY_ROW = { firstName: '', lastName: '', phone: '', email: '', payrollId: '', officeCode: '', day0: '' }

function ImportModal({ language, onClose, onImport }) {
  const [rows, setRows] = useState([{ ...EMPTY_ROW }])
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const FR = language === 'FR'

  const setRow = (i, field, value) => {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  const addRow = () => setRows(r => [...r, { ...EMPTY_ROW }])
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i))

  const validate = () => {
    const errs = rows.map(r => {
      const e = {}
      if (!r.firstName.trim()) e.firstName = FR ? 'Requis' : 'Required'
      if (!r.lastName.trim()) e.lastName = FR ? 'Requis' : 'Required'
      return e
    })
    setErrors(errs)
    return errs.every(e => Object.keys(e).length === 0)
  }

  const handleImport = async () => {
    if (!validate()) return
    setImporting(true)
    const count = await onImport(rows)
    setImporting(false)
    onClose(count)
  }

  const inp = (hasErr) => ({
    padding: '5px 8px', borderRadius: 5, fontSize: '0.78rem',
    border: `1px solid ${hasErr ? '#EF4444' : '#E8EAF6'}`,
    width: '100%', boxSizing: 'border-box', outline: 'none',
  })

  const cols = [
    { key: 'firstName', label: FR ? 'Prénom *' : 'First Name *', width: 110 },
    { key: 'lastName',  label: FR ? 'Nom *' : 'Last Name *',  width: 110 },
    { key: 'phone',     label: FR ? 'Mobile' : 'Mobile',       width: 120 },
    { key: 'email',     label: FR ? 'Courriel' : 'Email',      width: 150 },
    { key: 'payrollId', label: 'ID',                            width: 80  },
    { key: 'officeCode',label: FR ? 'Bureau' : 'Office',        width: 80  },
    { key: 'day0',      label: 'Day 0',                         width: 120, type: 'date' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(30,39,105,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24,
    }} onClick={() => onClose(0)}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 900,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(30,39,105,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #E8EAF6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E2769' }}>
              {FR ? 'Importer directement en intégration' : 'Import Directly to Onboarding'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>
              {FR ? 'Pour les réembauches et les personnes sans code de bureau — contourne le pipeline' : 'For rehires & people without office codes — bypasses the pipeline'}
            </div>
          </div>
          <button onClick={() => onClose(0)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
        </div>

        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {cols.map(c => (
                  <th key={c.key} style={{ padding: '4px 6px 8px', fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap', width: c.width }}>
                    {c.label}
                  </th>
                ))}
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {cols.map(c => (
                    <td key={c.key} style={{ padding: '3px 4px', verticalAlign: 'top' }}>
                      <input
                        type={c.type || 'text'}
                        value={row[c.key]}
                        onChange={e => setRow(i, c.key, e.target.value)}
                        style={inp(errors[i]?.[c.key])}
                        placeholder={c.type === 'date' ? 'YYYY-MM-DD' : ''}
                      />
                      {errors[i]?.[c.key] && (
                        <div style={{ fontSize: '0.6rem', color: '#EF4444', marginTop: 1 }}>{errors[i][c.key]}</div>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '3px 4px', verticalAlign: 'middle' }}>
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem', padding: '4px' }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} style={{
            marginTop: 10, padding: '6px 14px', borderRadius: 6, border: '1.5px dashed #E8EAF6',
            background: 'white', fontSize: '0.8rem', color: '#64748B', cursor: 'pointer',
          }}>
            + {FR ? 'Ajouter une ligne' : 'Add row'}
          </button>
        </div>

        <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #E8EAF6', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginRight: 'auto' }}>
            {rows.length} {FR ? 'personne(s)' : 'person/people'}
          </span>
          <button onClick={() => onClose(0)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E8EAF6', background: 'white', fontSize: '0.85rem', cursor: 'pointer', color: '#374151' }}>
            {FR ? 'Annuler' : 'Cancel'}
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: '#F0194A', color: 'white', fontSize: '0.85rem', fontWeight: 700,
              cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.7 : 1,
            }}
          >
            {importing ? (FR ? 'Importation...' : 'Importing...') : (FR ? 'Importer' : 'Import')}
          </button>
        </div>
      </div>
    </div>
  )
}

const FILTER_OPTIONS = ['all', 'awaitingADPSend', 'adpSentPending', 'missingDocuments', 'podPending', 'fullyComplete']

export default function OnboardingTracker() {
  const language = useStore((s) => s.language)
  const role = useStore((s) => s.role)
  const candidates = useStore((s) => s.candidates)
  const updateCandidate = useStore((s) => s.updateCandidate)
  const deleteCandidate = useStore((s) => s.deleteCandidate)
  const importDirectToOnboarding = useStore((s) => s.importDirectToOnboarding)
  const addToast = useStore((s) => s.addToast)

  const [filter, setFilter] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterOffice, setFilterOffice] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selected, setSelected] = useState(new Set())
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const isAdmin = role === 'admin'
  const FR = language === 'FR'

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

  const getRefDate = (c) =>
    c.onboarding?.adpSentAt || c.onboarding?.adpSentDate ||
    c.hiredAt || c.createdAt || ''

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return getRefDate(b).localeCompare(getRefDate(a))
    if (sortBy === 'oldest') return getRefDate(a).localeCompare(getRefDate(b))
    if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    if (sortBy === 'office') return (a.officeCode || '').localeCompare(b.officeCode || '')
    return 0
  })

  const counts = {
    all: hired.length,
    awaitingADPSend: hired.filter((c) => getOnboardingStatus(c) === 'awaitingADPSend').length,
    adpSentPending: hired.filter((c) => getOnboardingStatus(c) === 'adpSentPending').length,
    missingDocuments: hired.filter((c) => { const md = c.onboarding?.missingDocs || {}; return Object.values(md).some(Boolean) }).length,
    podPending: hired.filter((c) => getOnboardingStatus(c) === 'podPending').length,
    fullyComplete: hired.filter((c) => getOnboardingStatus(c) === 'fullyComplete').length,
  }

  const toggleSelect = (id) => {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === sorted.length && sorted.length > 0) setSelected(new Set())
    else setSelected(new Set(sorted.map(c => c.id)))
  }

  const selectedCandidates = sorted.filter(c => selected.has(c.id))

  const handleBulkExport = () => {
    if (selectedCandidates.length === 0) return
    // Mark all selected as exported
    const now = new Date().toISOString()
    selectedCandidates.forEach(c => updateCandidate(c.id, { exportedAt: now }))
    setShowExportModal(true)
  }

  const handleBulkDelete = () => {
    if (selectedCandidates.length === 0) return
    const msg = FR
      ? `Supprimer ${selectedCandidates.length} candidat(s)?`
      : `Delete ${selectedCandidates.length} candidate(s)?`
    if (!window.confirm(msg)) return
    selectedCandidates.forEach(c => deleteCandidate(c.id))
    setSelected(new Set())
    addToast(FR ? 'Candidats supprimés' : 'Candidates deleted', 'success')
  }

  const handleImportDone = (count) => {
    setShowImport(false)
    if (count > 0) addToast(`${count} ${FR ? 'personne(s) importée(s)' : 'person/people imported'}`, 'success')
  }

  const filterBtnStyle = (active) => ({
    padding: '5px 14px', fontSize: '0.75rem',
    fontWeight: active ? 700 : 500, borderRadius: 20,
    border: active ? '1.5px solid #1E2769' : '1.5px solid #E8EAF6',
    background: active ? '#1E2769' : 'white',
    color: active ? 'white' : '#64748B',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  })

  const kpiCards = [
    { key: 'all',           label: FR ? 'Total' : 'Total',                color: '#1E2769' },
    { key: 'awaitingADPSend', label: FR ? 'En attente' : 'Awaiting',      color: '#94A3B8' },
    { key: 'adpSentPending',  label: FR ? 'ADP envoyé' : 'ADP Sent',      color: '#F59E0B' },
    { key: 'podPending',      label: FR ? 'POD en attente' : 'POD Pending', color: '#3B82F6' },
    { key: 'fullyComplete',   label: FR ? 'Complété' : 'Complete',         color: '#2DCDB8' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E2769', margin: 0, letterSpacing: '-0.02em' }}>{t('onboarding', language)}</h1>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0' }}>
            {filtered.length} / {hired.length} {FR ? 'candidat(e)s embauché(e)s' : 'hired candidates'}
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowImport(true)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                border: '1.5px solid #E8EAF6', background: 'white', color: '#374151', cursor: 'pointer',
              }}
            >
              ↑ {FR ? 'Importer' : 'Import'}
            </button>
          </div>
        )}
      </div>

      {/* KPI summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
        {kpiCards.map(({ key, label, color }) => (
          <div key={key} style={{ background: 'white', border: '1px solid #E8EAF6', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{counts[key]}</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTER_OPTIONS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={filterBtnStyle(filter === f)}>
            {t(f, language)}
            <span style={{ marginLeft: 4, fontSize: '0.65rem', background: filter === f ? 'rgba(255,255,255,0.2)' : '#F3F4F6', color: filter === f ? 'white' : '#6B7280', borderRadius: 10, padding: '1px 5px' }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: 'white', border: '1px solid #E8EAF6', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder={`${t('search', language)}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E8EAF6', fontSize: '0.8rem', width: 200, outline: 'none' }}
          />
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E8EAF6', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}>
            <option value="all">{t('all', language)} {t('region', language)}</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E8EAF6', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}>
            <option value="">{t('all', language)} {t('officeCode', language)}</option>
            {OFFICES.map((o) => <option key={o.code} value={o.code}>{o.code} — {o.name}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E8EAF6', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}>
            <option value="newest">{FR ? '↓ Plus récents en premier' : '↓ Newest first'}</option>
            <option value="oldest">{FR ? '↑ Plus anciens en premier' : '↑ Oldest first'}</option>
            <option value="name">{FR ? 'A–Z Nom' : 'A–Z Name'}</option>
            <option value="office">{FR ? 'A–Z Bureau' : 'A–Z Office'}</option>
          </select>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
            {FR ? 'Complété:' : 'Completed:'}
          </span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E8EAF6', fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace' }} />
          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E8EAF6', fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace' }} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }}
              style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: 5, border: '1px solid #E8EAF6', background: 'white', cursor: 'pointer', color: '#64748B' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar — appears when rows are selected */}
      {sorted.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
          background: selected.size > 0 ? '#1E2769' : 'white',
          border: `1px solid ${selected.size > 0 ? '#1E2769' : '#E8EAF6'}`,
          borderRadius: 10, marginBottom: 12, transition: 'all 0.2s',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selected.size === sorted.length && sorted.length > 0}
              onChange={toggleSelectAll}
              style={{ width: 15, height: 15, accentColor: selected.size > 0 ? 'white' : '#1E2769', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: selected.size > 0 ? 'white' : '#374151' }}>
              {selected.size > 0
                ? `${selected.size} ${FR ? 'sélectionné(s)' : 'selected'}`
                : (FR ? 'Tout sélectionner' : 'Select all')}
            </span>
          </label>
          {selected.size > 0 && (
            <>
              <div style={{ flex: 1 }} />
              <ActionsDropdown
                selected={selectedCandidates}
                onExport={handleBulkExport}
                onDelete={handleBulkDelete}
                language={language}
              />
            </>
          )}
        </div>
      )}

      {/* Step legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { color: '#94A3B8', label: t('step1', language) + ' (Recruitment)' },
          { color: '#F59E0B', label: t('step2', language) + ' (Admin)' },
          { color: '#3B82F6', label: t('step3', language) + ' (Admin)' },
          { color: '#2DCDB8', label: t('step4', language) + ' (Admin)' },
          { color: '#6EE7B7', label: FR ? 'Traité ✓' : 'Processed ✓' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', color: '#64748B' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
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
            {FR
              ? `embauché(e)${awaitingProfile.length > 1 ? 's' : ''} en attente de profil utilisateur — visible ici après création dans « Profils utilisateurs »`
              : `hired candidate${awaitingProfile.length > 1 ? 's' : ''} awaiting user profile — will appear here after profile created in "User Profiles"`}
          </div>
        </div>
      )}

      {/* Rows */}
      {sorted.length === 0 ? (
        <div style={{ background: 'white', border: '2px dashed #E8EAF6', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#1E2769', marginBottom: 12 }}>✦</div>
          <div style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            {hired.length === 0 ? t('emptyOnboarding', language) : (FR ? 'Aucun résultat' : 'No results match your filters')}
          </div>
        </div>
      ) : (
        sorted.map((c) => (
          <OnboardingRow
            key={c.id}
            candidate={c}
            language={language}
            role={role}
            selected={selected.has(c.id)}
            onToggleSelect={toggleSelect}
          />
        ))
      )}

      {/* Export modal */}
      {showExportModal && (
        <ExportModal
          candidates={selectedCandidates}
          language={language}
          onClose={() => { setShowExportModal(false); setSelected(new Set()) }}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          language={language}
          onClose={handleImportDone}
          onImport={importDirectToOnboarding}
        />
      )}
    </div>
  )
}
