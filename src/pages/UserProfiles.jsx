import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'

function generateUsername(firstName, lastName) {
  // fullFirstName + firstInitialOfLastName (e.g., "johns" for John Smith)
  return ((firstName || '') + (lastName ? lastName[0] : ''))
    .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
}

function generatePassword(phone) {
  return (phone || '').replace(/\D/g, '').slice(-4)
}

function ProfileCard({ candidate, language }) {
  const updateCandidate = useStore((s) => s.updateCandidate)
  const allCandidates = useStore((s) => s.candidates)
  const addToast = useStore((s) => s.addToast)
  const [expanded, setExpanded] = useState(false)
  const [username, setUsername] = useState(generateUsername(candidate.firstName, candidate.lastName))
  const [payrollId, setPayrollId] = useState(candidate.payrollId || '')
  const [saving, setSaving] = useState(false)
  const FR = language === 'FR'
  const password = generatePassword(candidate.phone)
  const [usernameErr, setUsernameErr] = useState('')
  const [payrollErr, setPayrollErr] = useState('')

  const usernameIsDuplicate = !!username && allCandidates.some(
    c => c.id !== candidate.id && c.username && c.username.toLowerCase() === username.toLowerCase()
  )

  const handleSave = () => {
    let ok = true
    if (!username.trim()) { setUsernameErr(FR ? 'Requis' : 'Required'); ok = false }
    if (!payrollId.trim()) { setPayrollErr(FR ? 'Requis' : 'Required'); ok = false }
    if (!ok) return
    if (usernameIsDuplicate) {
      setUsernameErr(FR ? 'Ce nom d\'utilisateur est déjà pris' : 'Username already taken — change it manually')
      return
    }
    updateCandidate(candidate.id, {
      username: username.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12),
      password,
      payrollId: payrollId.trim(),
      onboarding: {
        ...(candidate.onboarding || {}),
        userCreated: true,
        userCreatedAt: new Date().toISOString(),
      },
    })
    addToast(FR ? 'Profil créé avec succès' : 'User profile created successfully', 'success')
    setSaving(true)
  }

  const inp = (hasErr) => ({
    padding: '7px 10px', border: `1px solid ${hasErr ? '#EF4444' : '#D1D5DB'}`,
    borderRadius: 6, fontSize: '0.825rem', width: '100%', outline: 'none', boxSizing: 'border-box',
  })

  if (saving) return null

  return (
    <div style={{
      background: 'white', borderRadius: 10, border: '2px solid #FFD6E0',
      marginBottom: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFBEB')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
      >
        <div style={{ flex: '0 0 auto', width: 32, height: 32, borderRadius: '50%', background: '#FFD6E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#F0194A' }}>
          {(candidate.firstName[0] || '') + (candidate.lastName[0] || '')}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
            {candidate.firstName} {candidate.lastName}
            {candidate.preferredName && <span style={{ color: '#9CA3AF', fontWeight: 400 }}> ({candidate.preferredName})</span>}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#1E40AF', fontWeight: 600 }}>{candidate.officeCode || '—'}</span>
            {candidate.manager && <span>· {candidate.manager}</span>}
            {candidate.charity && <span>· {candidate.charity}</span>}
            <span>· {candidate.phone}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {!candidate.payrollId && (
            <span style={{ fontSize: '0.65rem', background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
              {FR ? 'No ID paie' : 'No Payroll ID'}
            </span>
          )}
          <span style={{ fontSize: '0.65rem', background: '#FFD6E0', color: '#F0194A', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
            {FR ? 'Profil manquant' : 'No Profile'}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '16px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {FR ? 'Créer le profil système' : 'Create System Profile'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('username', language)} *
              </label>
              <input
                style={inp(usernameErr || usernameIsDuplicate)}
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)); setUsernameErr('') }}
              />
              {usernameErr && <div style={{ fontSize: '0.68rem', color: '#EF4444', marginTop: 2 }}>{usernameErr}</div>}
              {usernameIsDuplicate && (
                <div style={{ fontSize: '0.68rem', color: '#EF4444', marginTop: 2, fontWeight: 700 }}>
                  ⚠ {FR ? 'Nom d\'utilisateur déjà utilisé — modifier manuellement' : 'Username taken — change manually'}
                </div>
              )}
              <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>{FR ? 'Max 12 caractères' : 'Max 12 chars, auto-generated'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('password', language)}
              </label>
              <input
                readOnly
                style={{ ...inp(false), fontFamily: 'IBM Plex Mono, monospace', background: '#F3F4F6', fontWeight: 700, letterSpacing: '0.25em', fontSize: '1rem', color: '#F0194A', cursor: 'default' }}
                value={password}
              />
              <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>
                {FR ? 'Auto: 4 derniers chiffres du tel.' : 'Auto: last 4 digits of phone'}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('payrollId', language)} *
            </label>
            <input
              style={{ ...inp(payrollErr), maxWidth: 200 }}
              value={payrollId}
              onChange={(e) => { setPayrollId(e.target.value); setPayrollErr('') }}
              placeholder={FR ? 'Entrer l\'ID de paie...' : 'Enter payroll ID...'}
            />
            {payrollErr && <div style={{ fontSize: '0.68rem', color: '#EF4444', marginTop: 2 }}>{payrollErr}</div>}
            <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>
              {FR ? 'Requis avant que l\'intégration ADP puisse être envoyée.' : 'Required before ADP onboarding can be sent.'}
            </div>
          </div>
          <button
            onClick={handleSave}
            style={{ padding: '8px 20px', background: '#F0194A', color: 'white', border: 'none', borderRadius: 7, fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#C9123A')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F0194A')}
          >
            {FR ? 'Créer le profil' : 'Create Profile'} →
          </button>
        </div>
      )}
    </div>
  )
}

function CreatedCard({ candidate, language }) {
  const updateCandidate = useStore((s) => s.updateCandidate)
  const addToast = useStore((s) => s.addToast)
  const allCandidates = useStore((s) => s.candidates)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(candidate.username || '')
  const [payrollId, setPayrollId] = useState(candidate.payrollId || '')
  const [password, setPassword] = useState(candidate.password || generatePassword(candidate.phone))
  const FR = language === 'FR'

  const usernameIsDuplicate = !!username && allCandidates.some(
    c => c.id !== candidate.id && c.username && c.username.toLowerCase() === username.toLowerCase()
  )

  // Keep local state in sync if candidate updates externally
  const handleEdit = () => {
    setUsername(candidate.username || '')
    setPayrollId(candidate.payrollId || '')
    setPassword(candidate.password || generatePassword(candidate.phone))
    setEditing(true)
  }

  const handleSave = () => {
    if (usernameIsDuplicate) {
      addToast(FR ? 'Nom d\'utilisateur déjà utilisé' : 'Username already taken', 'error')
      return
    }
    updateCandidate(candidate.id, {
      username: username.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12),
      payrollId: payrollId.trim(),
      password: password.trim() || generatePassword(candidate.phone),
    })
    addToast(FR ? 'Profil mis à jour' : 'Profile updated', 'success')
    setEditing(false)
  }

  const inp = {
    padding: '5px 8px', border: '1px solid #D1D5DB', borderRadius: 5,
    fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
  }

  const ob = candidate.onboarding || {}

  return (
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #D1FAE5', marginBottom: 8, overflow: 'hidden' }}>
      <div
        onClick={() => !editing && setExpanded((e) => !e)}
        style={{ padding: '10px 14px', cursor: editing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: '#F0FDF4' }}
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#059669', flexShrink: 0 }}>
          ✓
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#111827' }}>
            {candidate.firstName} {candidate.lastName}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', marginTop: 1 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#059669', fontWeight: 700 }}>{candidate.username}</span>
            {' · '}
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0194A', letterSpacing: '0.1em' }}>{candidate.password}</span>
            {' · '}
            {FR ? 'ID paie' : 'Payroll'}: <strong style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{candidate.payrollId || '—'}</strong>
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.7rem', color: '#1E40AF', background: '#DBEAFE', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>
            {candidate.officeCode || '—'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(); setExpanded(true) }}
            style={{ fontSize: '0.7rem', padding: '3px 9px', border: '1px solid #D1D5DB', borderRadius: 6, background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
          >
            {FR ? 'Modifier' : 'Edit'}
          </button>
          <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid #D1FAE5' }}>
          {editing ? (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                {FR ? 'Modifier le profil' : 'Edit Profile'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {t('username', language)}
                  </label>
                  <input
                    style={{ ...inp, fontFamily: 'IBM Plex Mono, monospace', width: '100%' }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12))}
                  />
                  <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: 2 }}>Max 12 chars</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {t('password', language)}
                  </label>
                  <input
                    style={{ ...inp, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.15em', width: '100%' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={generatePassword(candidate.phone)}
                  />
                  <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: 2 }}>
                    {FR ? 'Auto: ' : 'Auto: '}{generatePassword(candidate.phone)}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {t('payrollId', language)}
                  </label>
                  <input
                    style={{ ...inp, fontFamily: 'IBM Plex Mono, monospace', width: '100%' }}
                    value={payrollId}
                    onChange={(e) => setPayrollId(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSave}
                  style={{ padding: '6px 16px', background: '#F0194A', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {FR ? 'Enregistrer' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{ padding: '6px 14px', background: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  {FR ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.78rem' }}>
              <div><span style={{ color: '#9CA3AF' }}>{t('username', language)}: </span><strong style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{candidate.username}</strong></div>
              <div><span style={{ color: '#9CA3AF' }}>{t('password', language)}: </span><strong style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0194A', letterSpacing: '0.15em' }}>{candidate.password}</strong></div>
              <div><span style={{ color: '#9CA3AF' }}>{t('payrollId', language)}: </span><strong style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{candidate.payrollId || '—'}</strong></div>
              <div><span style={{ color: '#9CA3AF' }}>{t('officeCode', language)}: </span><strong>{candidate.officeCode || '—'}</strong></div>
              <div><span style={{ color: '#9CA3AF' }}>{t('manager', language)}: </span><strong>{candidate.manager || '—'}</strong></div>
              {ob.userCreatedAt && (
                <div>
                  <span style={{ color: '#9CA3AF' }}>{FR ? 'Créé' : 'Created'}: </span>
                  <strong>{new Date(ob.userCreatedAt).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function UserProfiles() {
  const language = useStore((s) => s.language)
  const candidates = useStore((s) => s.candidates)
  const [search, setSearch] = useState('')
  const FR = language === 'FR'

  const hired = candidates.filter((c) => c.status === 'Hired' && !c.isHistorical)
  const needsProfile = hired.filter((c) => !c.username)
  const hasProfile = hired.filter((c) => !!c.username)

  const filteredNeeds = needsProfile.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      (c.officeCode || '').toLowerCase().includes(q) ||
      (c.phone || '').replace(/\D/g, '').includes(q)
  })
  const filteredHas = hasProfile.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      (c.officeCode || '').toLowerCase().includes(q) ||
      (c.username || '').includes(q)
  })

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            {FR ? 'Profils utilisateurs' : 'User Profiles'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {needsProfile.length} {FR ? 'en attente de profil' : 'awaiting profile'} · {hasProfile.length} {FR ? 'profils créés' : 'profiles created'}
          </p>
        </div>
        <input
          type="text"
          placeholder={`${t('search', language)}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', width: 220, outline: 'none' }}
        />
      </div>

      {/* Needs Profile */}
      {filteredNeeds.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F0194A', margin: 0 }}>
              ⚠ {FR ? 'Profil requis' : 'Profile Required'}
            </h2>
            <span style={{ background: '#FFD6E0', color: '#F0194A', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{filteredNeeds.length}</span>
          </div>
          {filteredNeeds.map((c) => <ProfileCard key={c.id} candidate={c} language={language} />)}
        </div>
      )}

      {needsProfile.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: 10, border: '1px solid #D1FAE5', marginBottom: 24 }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✓</div>
          <div style={{ color: '#059669', fontWeight: 600 }}>
            {FR ? 'Tous les profils sont créés!' : 'All hired candidates have user profiles!'}
          </div>
        </div>
      )}

      {/* Has Profile */}
      {filteredHas.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669', margin: 0 }}>
              ✓ {FR ? 'Profils créés' : 'Profiles Created'}
            </h2>
            <span style={{ background: '#D1FAE5', color: '#059669', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{filteredHas.length}</span>
          </div>
          {filteredHas.map((c) => <CreatedCard key={c.id} candidate={c} language={language} />)}
        </div>
      )}

      {hired.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          {FR ? 'Aucun(e) candidat(e) embauché(e) pour l\'instant.' : 'No hired candidates yet.'}
        </div>
      )}
    </div>
  )
}
