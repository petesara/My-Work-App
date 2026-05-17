import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { OFFICES, CHARITIES, SOURCES, STATUSES, AVAILABILITY } from '../data/offices'

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function generateUsername(firstName, lastName) {
  return ((firstName[0] || '') + (lastName || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12)
}

function generatePassword(phone) {
  const digits = phone.replace(/\D/g, '')
  return digits.slice(-4)
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  preferredName: '',
  phone: '',
  email: '',
  languagePreference: 'EN',
  isRehire: '',
  payrollId: '',
  officeCode: '',
  manager: '',
  region: '',
  medium: '',
  charity: '',
  availability: '',
  day0: '',
  source: '',
  interviewDate: new Date().toISOString().slice(0, 10),
  interviewer: '',
  status: 'Pending',
  notes: '',
  username: '',
  password: '',
}

export default function AddCandidatePanel({ candidateId, onClose }) {
  const language = useStore((s) => s.language)
  const role = useStore((s) => s.role)
  const candidates = useStore((s) => s.candidates)
  const doNotHireList = useStore((s) => s.doNotHireList)
  const addCandidate = useStore((s) => s.addCandidate)
  const updateCandidate = useStore((s) => s.updateCandidate)
  const addToast = useStore((s) => s.addToast)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [duplicates, setDuplicates] = useState([])
  const [duplicateAction, setDuplicateAction] = useState(null)
  const [dnhMatches, setDnhMatches] = useState([])
  const [dnhAcknowledged, setDnhAcknowledged] = useState(false)
  const [officeSearch, setOfficeSearch] = useState('')
  const [officeDropdownOpen, setOfficeDropdownOpen] = useState(false)
  const officeRef = useRef(null)

  const isEdit = !!candidateId

  useEffect(() => {
    if (isEdit) {
      const c = candidates.find((x) => x.id === candidateId)
      if (c) {
        setForm({
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          preferredName: c.preferredName || '',
          phone: c.phone || '',
          email: c.email || '',
          languagePreference: c.languagePreference || 'EN',
          isRehire: c.isRehire !== undefined ? (c.isRehire ? 'yes' : 'no') : '',
          payrollId: c.payrollId || '',
          officeCode: c.officeCode || '',
          manager: c.manager || '',
          region: c.region || '',
          medium: c.medium || '',
          charity: c.charity || '',
          availability: c.availability || '',
          day0: c.day0 || '',
          source: c.source || '',
          interviewDate: c.interviewDate || new Date().toISOString().slice(0, 10),
          interviewer: c.interviewer || '',
          status: c.status || 'Pending',
          notes: c.notes || '',
          username: c.username || '',
          password: c.password || '',
        })
        setOfficeSearch(c.officeCode || '')
      }
    } else {
      setForm({ ...EMPTY_FORM, interviewDate: new Date().toISOString().slice(0, 10) })
      setOfficeSearch('')
      setErrors({})
      setDuplicates([])
      setDuplicateAction(null)
      setDnhMatches([])
      setDnhAcknowledged(false)
    }
  }, [isEdit, candidateId])

  useEffect(() => {
    if (!officeDropdownOpen) return
    const handler = (e) => {
      if (officeRef.current && !officeRef.current.contains(e.target)) setOfficeDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [officeDropdownOpen])

  const setField = (key, value) => {
    setForm((f) => {
      const updated = { ...f, [key]: value }
      if ((key === 'firstName' || key === 'lastName') && updated.firstName && updated.lastName) {
        updated.username = generateUsername(updated.firstName, updated.lastName)
      }
      if (key === 'phone') {
        updated.password = generatePassword(value)
      }
      return updated
    })
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }))
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setForm((f) => ({ ...f, phone: formatted, password: generatePassword(formatted) }))
    if (errors.phone) setErrors((er) => ({ ...er, phone: '' }))
  }

  const checkDuplicates = (f) => {
    const phoneDigits = f.phone.replace(/\D/g, '')
    const emailLower = f.email.toLowerCase()
    const nameLower = (f.firstName + ' ' + f.lastName).toLowerCase().trim()
    if (!nameLower && !phoneDigits && !emailLower) return
    const found = candidates.filter((c) => {
      if (isEdit && c.id === candidateId) return false
      const cPhone = (c.phone || '').replace(/\D/g, '')
      const cEmail = (c.email || '').toLowerCase()
      const cName = ((c.firstName || '') + ' ' + (c.lastName || '')).toLowerCase().trim()
      if (phoneDigits.length === 10 && cPhone === phoneDigits) return true
      if (emailLower && emailLower.includes('@') && cEmail === emailLower) return true
      if (nameLower.length > 3 && cName === nameLower && (phoneDigits || emailLower)) return true
      return false
    })
    setDuplicates(found)
  }

  const handleBlurDupCheck = () => checkDuplicates(form)

  const handleOfficeSelect = (office) => {
    setForm((f) => ({
      ...f,
      officeCode: office.code,
      manager: office.manager,
      region: office.region,
      medium: office.medium,
      languagePreference: office.isFR ? 'FR' : f.languagePreference,
    }))
    setOfficeSearch(office.code)
    setOfficeDropdownOpen(false)
    if (errors.officeCode) setErrors((e) => ({ ...e, officeCode: '' }))
  }

  const filteredOffices = OFFICES.filter((o) => {
    const q = officeSearch.toLowerCase()
    return (
      o.code.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      o.manager.toLowerCase().includes(q)
    )
  }).slice(0, 20)

  const validate = () => {
    const errs = {}
    const req = language === 'FR' ? 'Requis' : 'Required'
    if (!form.firstName.trim()) errs.firstName = req
    if (!form.lastName.trim()) errs.lastName = req
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 10) errs.phone = language === 'FR' ? 'Numéro invalide (10 chiffres)' : 'Invalid phone (10 digits)'
    if (!form.email.trim() || !validateEmail(form.email)) errs.email = language === 'FR' ? 'Courriel invalide' : 'Invalid email'
    if (form.isRehire === '') errs.isRehire = req
    if (form.isRehire === 'yes' && !form.payrollId.trim()) errs.payrollId = language === 'FR' ? 'ID de paie requis pour les réembauches' : 'Payroll ID required for rehires'
    if (!form.officeCode) errs.officeCode = req
    if (!form.charity) errs.charity = req
    if (!form.availability) errs.availability = req
    if (!form.day0) errs.day0 = req
    if (!form.source) errs.source = req
    if (!form.interviewDate) errs.interviewDate = req
    if (!form.interviewer.trim()) errs.interviewer = req
    if (!form.status) errs.status = req
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const phoneDigits = form.phone.replace(/\D/g, '')
    const emailLower = form.email.toLowerCase()
    const nameLower = (form.firstName + ' ' + form.lastName).toLowerCase()

    if (!dnhAcknowledged) {
      const dnhFound = doNotHireList.filter((d) => {
        const dPhone = (d.phone || '').replace(/\D/g, '')
        const dEmail = (d.email || '').toLowerCase()
        const dName = (d.name || '').toLowerCase()
        return dPhone === phoneDigits || dEmail === emailLower || dName === nameLower
      })
      if (dnhFound.length > 0) {
        setDnhMatches(dnhFound)
        return
      }
    }

    const candidateData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      preferredName: form.preferredName.trim(),
      phone: form.phone,
      email: form.email.trim().toLowerCase(),
      languagePreference: form.languagePreference,
      isRehire: form.isRehire === 'yes',
      payrollId: form.payrollId.trim(),
      officeCode: form.officeCode,
      manager: form.manager,
      region: form.region,
      medium: form.medium,
      charity: form.charity,
      availability: form.availability,
      day0: form.day0,
      source: form.source,
      interviewDate: form.interviewDate,
      interviewer: form.interviewer.trim(),
      status: form.status,
      notes: form.notes.trim(),
      username: form.username.trim(),
      password: form.password,
      isDuplicate: duplicates.length > 0 && duplicateAction !== 'acknowledgedNew',
    }

    if (isEdit) {
      updateCandidate(candidateId, candidateData)
      addToast(t('updatedSuccessfully', language), 'success')
    } else {
      addCandidate(candidateData)
      addToast(t('savedSuccessfully', language), 'success')
    }
    onClose()
  }

  const inp = (field) => ({
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${errors[field] ? '#EF4444' : '#D1D5DB'}`,
    borderRadius: 6,
    fontSize: '0.875rem',
    fontFamily: 'IBM Plex Sans, sans-serif',
    color: '#111827',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  })

  const lbl = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const err = { fontSize: '0.7rem', color: '#EF4444', marginTop: 3 }
  const fw = { marginBottom: 14 }

  const secHdr = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#CF2B1A',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '1px solid #F3F4F6',
  }

  const selectedOffice = OFFICES.find((o) => o.code === form.officeCode)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
      />

      {/* Slide panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 100vw)',
          background: 'white',
          zIndex: 300,
          overflowY: 'auto',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            background: '#0D1117',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
            {isEdit ? `${t('edit', language)} — ${candidates.find(c => c.id === candidateId)?.firstName || ''}` : t('addCandidate', language)}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>

          {/* ── Duplicate Warning ── */}
          {duplicates.length > 0 && duplicateAction === null && (
            <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.875rem', marginBottom: 8 }}>
                ⚠ {t('duplicateWarning', language)}
              </div>
              {duplicates.map((d) => (
                <div key={d.id} style={{ fontSize: '0.75rem', color: '#78350F', marginBottom: 4, padding: '6px 8px', background: '#FEF3C7', borderRadius: 4 }}>
                  <strong>{d.firstName} {d.lastName}</strong> · {d.officeCode} · {d.status} · {d.payrollId || '—'} · {d.interviewDate || (d.createdAt || '').slice(0, 10)}
                </div>
              ))}
              {role === 'operations' && (
                <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: 8, fontStyle: 'italic' }}>
                  {t('rehireCheckOps', language)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setField('isRehire', 'yes'); setDuplicateAction('acknowledgedRehire') }}
                  style={{ padding: '6px 12px', background: '#D97706', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  {t('markAsRehire', language)}
                </button>
                <button
                  onClick={() => setDuplicateAction('acknowledgedNew')}
                  style={{ padding: '6px 12px', background: '#374151', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  {t('proceedAsNew', language)}
                </button>
                <button
                  onClick={() => setDuplicates([])}
                  style={{ padding: '6px 12px', background: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  {t('goBackReview', language)}
                </button>
              </div>
            </div>
          )}

          {/* ── DNH Warning ── */}
          {dnhMatches.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '2px solid #EF4444', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.875rem', marginBottom: 8 }}>
                🚫 {t('dnhWarning', language)}
              </div>
              {dnhMatches.map((d) => (
                <div key={d.id} style={{ fontSize: '0.75rem', color: '#7F1D1D', marginBottom: 4, padding: '6px 8px', background: '#FEE2E2', borderRadius: 4 }}>
                  <strong>{d.name}</strong> · {t('reason', language)}: {d.reason} · {t('addedBy', language)}: {d.addedBy}
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={dnhAcknowledged}
                  onChange={(e) => setDnhAcknowledged(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#CF2B1A' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600 }}>
                  {t('iAcknowledge', language)}
                </span>
              </label>
              {dnhAcknowledged && (
                <button
                  onClick={handleSubmit}
                  style={{ marginTop: 10, padding: '7px 18px', background: '#CF2B1A', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  {t('save', language)} →
                </button>
              )}
            </div>
          )}

          {/* ── SECTION 1: Contact Info ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={secHdr}>1. {t('contactInfo', language)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fw}>
                <label style={lbl}>{t('firstName', language)} *</label>
                <input style={inp('firstName')} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} onBlur={handleBlurDupCheck} />
                {errors.firstName && <div style={err}>{errors.firstName}</div>}
              </div>
              <div style={fw}>
                <label style={lbl}>{t('lastName', language)} *</label>
                <input style={inp('lastName')} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} onBlur={handleBlurDupCheck} />
                {errors.lastName && <div style={err}>{errors.lastName}</div>}
              </div>
            </div>
            <div style={fw}>
              <label style={lbl}>{t('preferredName', language)} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9CA3AF' }}>({language === 'FR' ? 'Optionnel' : 'Optional'})</span></label>
              <input style={inp('preferredName')} value={form.preferredName} onChange={(e) => setField('preferredName', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fw}>
                <label style={lbl}>{t('phone', language)} *</label>
                <input
                  style={inp('phone')}
                  value={form.phone}
                  onChange={handlePhoneChange}
                  onBlur={handleBlurDupCheck}
                  placeholder="(XXX) XXX-XXXX"
                  maxLength={14}
                />
                {errors.phone && <div style={err}>{errors.phone}</div>}
              </div>
              <div style={fw}>
                <label style={lbl}>{t('email', language)} *</label>
                <input
                  style={inp('email')}
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  onBlur={handleBlurDupCheck}
                  type="email"
                />
                {errors.email && <div style={err}>{errors.email}</div>}
              </div>
            </div>
            <div style={fw}>
              <label style={lbl}>{t('languagePreference', language)} *</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {['EN', 'FR'].map((lang) => (
                  <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                    <input type="radio" name="langPref" value={lang} checked={form.languagePreference === lang} onChange={() => setField('languagePreference', lang)} style={{ accentColor: '#CF2B1A' }} />
                    {lang}
                  </label>
                ))}
              </div>
              {errors.languagePreference && <div style={err}>{errors.languagePreference}</div>}
            </div>
          </div>

          {/* ── SECTION 2: Employment ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={secHdr}>2. {t('employment', language)}</div>

            {/* isRehire – prominent */}
            <div style={{ ...fw, padding: '12px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <label style={{ ...lbl, fontSize: '0.8rem', marginBottom: 8 }}>{t('isRehire', language)} *</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { val: 'yes', label: t('yes', language), color: '#D97706' },
                  { val: 'no', label: t('no', language), color: '#374151' },
                ].map(({ val, label, color }) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="isRehire"
                      value={val}
                      checked={form.isRehire === val}
                      onChange={() => setField('isRehire', val)}
                      style={{ accentColor: '#CF2B1A', width: 15, height: 15 }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color }}>{label}</span>
                  </label>
                ))}
              </div>
              {errors.isRehire && <div style={err}>{errors.isRehire}</div>}
            </div>

            <div style={fw}>
              <label style={lbl}>
                {t('payrollId', language)} {form.isRehire === 'yes' ? '*' : ''}
              </label>
              <input
                style={inp('payrollId')}
                value={form.payrollId}
                onChange={(e) => setField('payrollId', e.target.value)}
                placeholder={form.isRehire === 'no' ? (language === 'FR' ? "Peut être ajouté après embauche" : 'Can be added after hiring') : ''}
              />
              {errors.payrollId && <div style={err}>{errors.payrollId}</div>}
            </div>

            {/* Office Code searchable */}
            <div style={fw} ref={officeRef}>
              <label style={lbl}>{t('officeCode', language)} *</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={inp('officeCode')}
                  value={officeSearch}
                  onChange={(e) => {
                    setOfficeSearch(e.target.value)
                    setOfficeDropdownOpen(true)
                    if (!e.target.value) setForm((f) => ({ ...f, officeCode: '', manager: '', region: '', medium: '' }))
                  }}
                  onFocus={() => setOfficeDropdownOpen(true)}
                  placeholder={language === 'FR' ? 'Rechercher un bureau...' : 'Search office...'}
                  autoComplete="off"
                />
                {officeDropdownOpen && filteredOffices.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #D1D5DB',
                      borderRadius: 6,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      zIndex: 600,
                      maxHeight: 240,
                      overflowY: 'auto',
                    }}
                  >
                    {filteredOffices.map((o) => (
                      <button
                        key={o.code}
                        onMouseDown={() => handleOfficeSelect(o)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontWeight: 700, color: '#111827', fontFamily: 'IBM Plex Mono, monospace', marginRight: 8 }}>{o.code}</span>
                        <span style={{ color: '#6B7280' }}>{o.name}</span>
                        {o.isFR && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: '#DBEAFE', color: '#1E40AF', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>FR</span>}
                        <div style={{ color: '#9CA3AF', fontSize: '0.7rem', marginTop: 2 }}>{o.manager} · {o.city} · {o.region}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.officeCode && <div style={err}>{errors.officeCode}</div>}
              {selectedOffice && (
                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>👤 {form.manager}</span>
                  <span>🌎 {form.region}</span>
                  <span>📋 {form.medium}</span>
                  {selectedOffice.isFR && <span style={{ color: '#1E40AF', fontWeight: 700 }}>🇫🇷 {t('frenchOffice', language)}</span>}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fw}>
                <label style={lbl}>{t('charity', language)} *</label>
                <select style={{ ...inp('charity'), cursor: 'pointer' }} value={form.charity} onChange={(e) => setField('charity', e.target.value)}>
                  <option value="">—</option>
                  {CHARITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.charity && <div style={err}>{errors.charity}</div>}
              </div>
              <div style={fw}>
                <label style={lbl}>{t('availability', language)} *</label>
                <select style={{ ...inp('availability'), cursor: 'pointer' }} value={form.availability} onChange={(e) => setField('availability', e.target.value)}>
                  <option value="">—</option>
                  {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                {errors.availability && <div style={err}>{errors.availability}</div>}
              </div>
            </div>

            <div style={fw}>
              <label style={lbl}>{t('day0', language)} *</label>
              <input type="date" style={inp('day0')} value={form.day0} onChange={(e) => setField('day0', e.target.value)} />
              {errors.day0 && <div style={err}>{errors.day0}</div>}
            </div>
          </div>

          {/* ── SECTION 3: Interview ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={secHdr}>3. {t('interview', language)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fw}>
                <label style={lbl}>{t('source', language)} *</label>
                <select style={{ ...inp('source'), cursor: 'pointer' }} value={form.source} onChange={(e) => setField('source', e.target.value)}>
                  <option value="">—</option>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.source && <div style={err}>{errors.source}</div>}
              </div>
              <div style={fw}>
                <label style={lbl}>{t('interviewDate', language)} *</label>
                <input type="date" style={inp('interviewDate')} value={form.interviewDate} onChange={(e) => setField('interviewDate', e.target.value)} />
                {errors.interviewDate && <div style={err}>{errors.interviewDate}</div>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fw}>
                <label style={lbl}>{t('interviewer', language)} *</label>
                <input style={inp('interviewer')} value={form.interviewer} onChange={(e) => setField('interviewer', e.target.value)} />
                {errors.interviewer && <div style={err}>{errors.interviewer}</div>}
              </div>
              <div style={fw}>
                <label style={lbl}>{t('status', language)} *</label>
                <select style={{ ...inp('status'), cursor: 'pointer' }} value={form.status} onChange={(e) => setField('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t(s, language)}</option>)}
                </select>
                {errors.status && <div style={err}>{errors.status}</div>}
              </div>
            </div>
            <div style={fw}>
              <label style={lbl}>{t('notes', language)}</label>
              <textarea
                style={{ ...inp('notes'), minHeight: 72, resize: 'vertical', fontFamily: 'IBM Plex Sans, sans-serif' }}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>
          </div>

          {/* ── SECTION 4: System Access (Hired only) ── */}
          {form.status === 'Hired' && (
            <div style={{ marginBottom: 24 }}>
              <div style={secHdr}>4. {t('systemAccess', language)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fw}>
                  <label style={lbl}>
                    {t('username', language)}
                    <span style={{ marginLeft: 4, fontSize: '0.65rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9CA3AF' }}>
                      (auto)
                    </span>
                  </label>
                  <input
                    style={inp('username')}
                    value={form.username}
                    onChange={(e) => setField('username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12))}
                  />
                  <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>{t('generatedUsername', language)}</div>
                </div>
                <div style={fw}>
                  <label style={lbl}>{t('password', language)}</label>
                  <input
                    readOnly
                    style={{
                      ...inp('password'),
                      fontFamily: 'IBM Plex Mono, monospace',
                      background: '#F9FAFB',
                      letterSpacing: '0.25em',
                      fontWeight: 600,
                      fontSize: '1rem',
                    }}
                    value={form.password}
                  />
                  <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 2 }}>{t('generatedPassword', language)}</div>
                </div>
              </div>
              {!form.payrollId && form.isRehire === 'no' && (
                <div style={{ fontSize: '0.75rem', color: '#92400E', background: '#FEF3C7', padding: '8px 12px', borderRadius: 6, border: '1px solid #F59E0B' }}>
                  ℹ {t('newHireNote', language)}
                </div>
              )}
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #F3F4F6', position: 'sticky', bottom: 0, background: 'white', marginTop: 8 }}>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '10px',
                background: '#CF2B1A',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#B02516')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#CF2B1A')}
            >
              {t('save', language)}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {t('cancel', language)}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
