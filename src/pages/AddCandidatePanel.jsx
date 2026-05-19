import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { OFFICES, CHARITIES, SOURCES, STATUSES, AVAILABILITY, REGIONS } from '../data/offices'

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function generateUsername(firstName, lastName) {
  return ((firstName[0] || '') + (lastName || ''))
    .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
}

function generatePassword(phone) {
  return phone.replace(/\D/g, '').slice(-4)
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const EMPTY_FORM = {
  firstName: '', lastName: '', preferredName: '',
  phone: '', email: '', languagePreference: 'EN',
  isRehire: '', payrollId: '',
  region: '', officeCode: '', manager: '', medium: '',
  charity: '', availability: '', day0: '',
  source: '', interviewDate: new Date().toISOString().slice(0, 10),
  interviewer: '', status: 'Pending', notes: '',
  username: '', password: '',
}

function PhaseHeader({ number, title, owner, complete, pending }) {
  const colors = { 1: '#CF2B1A', 2: '#3B82F6', 3: '#8B5CF6' }
  const color = colors[number]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${color}20` }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: complete ? '#D1FAE5' : pending ? '#FEF3C7' : `${color}15`,
        border: `2px solid ${complete ? '#10B981' : pending ? '#F59E0B' : color}`,
        fontSize: '0.75rem', fontWeight: 700, color: complete ? '#059669' : pending ? '#D97706' : color, flexShrink: 0,
      }}>
        {complete ? '✓' : number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: complete ? '#059669' : '#111827', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</div>
        <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 1 }}>{owner}</div>
      </div>
      {complete && <span style={{ fontSize: '0.65rem', background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Complete</span>}
      {pending && <span style={{ fontSize: '0.65rem', background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Pending</span>}
    </div>
  )
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
          firstName: c.firstName || '', lastName: c.lastName || '', preferredName: c.preferredName || '',
          phone: c.phone || '', email: c.email || '', languagePreference: c.languagePreference || 'EN',
          isRehire: c.isRehire !== undefined ? (c.isRehire ? 'yes' : 'no') : '',
          payrollId: c.payrollId || '', region: c.region || '',
          officeCode: c.officeCode || '', manager: c.manager || '', medium: c.medium || '',
          charity: c.charity || '', availability: c.availability || '', day0: c.day0 || '',
          source: c.source || '', interviewDate: c.interviewDate || new Date().toISOString().slice(0, 10),
          interviewer: c.interviewer || '', status: c.status || 'Pending', notes: c.notes || '',
          username: c.username || '', password: c.password || '',
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
      const u = { ...f, [key]: value }
      if ((key === 'firstName' || key === 'lastName') && u.firstName && u.lastName) {
        u.username = generateUsername(u.firstName, u.lastName)
      }
      if (key === 'phone') u.password = generatePassword(value)
      return u
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

  const handleOfficeSelect = (office) => {
    setForm((f) => ({
      ...f,
      officeCode: office.code, manager: office.manager,
      region: office.region, medium: office.medium,
      languagePreference: office.isFR ? 'FR' : f.languagePreference,
    }))
    setOfficeSearch(office.code)
    setOfficeDropdownOpen(false)
    if (errors.officeCode) setErrors((e) => ({ ...e, officeCode: '' }))
  }

  const filteredOffices = OFFICES.filter((o) => {
    const q = officeSearch.toLowerCase()
    return o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) || o.manager.toLowerCase().includes(q)
  }).slice(0, 20)

  const FR = language === 'FR'
  const req = FR ? 'Requis' : 'Required'

  // Phase 1 complete = all recruitment fields filled
  const phase1Complete = !!(
    form.firstName.trim() && form.lastName.trim() &&
    form.phone.replace(/\D/g, '').length === 10 &&
    validateEmail(form.email) &&
    form.isRehire !== '' &&
    (form.isRehire !== 'yes' || form.payrollId.trim()) &&
    form.source && form.interviewDate && form.interviewer.trim()
  )
  // Phase 2 complete = ops employment fields filled
  const phase2Complete = !!(form.officeCode && form.charity && form.availability)

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = req
    if (!form.lastName.trim()) errs.lastName = req
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 10) errs.phone = FR ? 'Numéro invalide (10 chiffres)' : 'Invalid phone (10 digits)'
    if (!form.email.trim() || !validateEmail(form.email)) errs.email = FR ? 'Courriel invalide' : 'Invalid email'
    if (form.isRehire === '') errs.isRehire = req
    if (form.isRehire === 'yes' && !form.payrollId.trim()) errs.payrollId = FR ? 'ID de paie requis pour les réembauches' : 'Payroll ID required for rehires'
    if (!form.source) errs.source = req
    if (!form.interviewDate) errs.interviewDate = req
    if (!form.interviewer.trim()) errs.interviewer = req
    // Phase 2 required for Ops
    if (role === 'operations') {
      if (!form.officeCode) errs.officeCode = req
      if (!form.charity) errs.charity = req
      if (!form.availability) errs.availability = req
    }
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const phoneDigits = form.phone.replace(/\D/g, '')
    const emailLower = form.email.toLowerCase()
    const nameLower = (form.firstName + ' ' + form.lastName).toLowerCase()
    if (!dnhAcknowledged) {
      const dnhFound = doNotHireList.filter((d) => {
        const dPhone = (d.phone || '').replace(/\D/g, '')
        const dEmail = (d.email || '').toLowerCase()
        const dName = (d.name || '').toLowerCase()
        const dPayroll = (d.payrollId || '').trim()
        const fPayroll = form.payrollId.trim()
        return dPhone === phoneDigits || dEmail === emailLower || dName === nameLower ||
          (dPayroll && fPayroll && dPayroll === fPayroll)
      })
      if (dnhFound.length > 0) { setDnhMatches(dnhFound); return }
    }
    const candidateData = {
      firstName: form.firstName.trim(), lastName: form.lastName.trim(),
      preferredName: form.preferredName.trim(),
      phone: form.phone, email: form.email.trim().toLowerCase(),
      languagePreference: form.languagePreference,
      isRehire: form.isRehire === 'yes', payrollId: form.payrollId.trim(),
      region: form.region, officeCode: form.officeCode,
      manager: form.manager, medium: form.medium,
      charity: form.charity, availability: form.availability, day0: form.day0,
      source: form.source, interviewDate: form.interviewDate,
      interviewer: form.interviewer.trim(), status: form.status,
      notes: form.notes.trim(),
      isDuplicate: duplicates.length > 0 && duplicateAction !== 'acknowledgedNew',
      isDNH: dnhMatches.length > 0 && dnhAcknowledged,
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

  // Styles
  const inp = (field) => ({
    width: '100%', padding: '8px 12px',
    border: `1px solid ${errors[field] ? '#EF4444' : '#D1D5DB'}`,
    borderRadius: 6, fontSize: '0.875rem',
    fontFamily: 'IBM Plex Sans, sans-serif',
    color: '#111827', background: 'white', outline: 'none', boxSizing: 'border-box',
  })
  const lbl = { display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const err = { fontSize: '0.68rem', color: '#EF4444', marginTop: 3 }
  const fw = { marginBottom: 12 }
  const selectedOffice = OFFICES.find((o) => o.code === form.officeCode)

  // Is Phase 2 editable? Ops always, Recruitment can edit if they want to add employment details too
  const phase2Editable = role === 'operations' || role === 'recruitment'
  const phase2Pending = !phase2Complete && role === 'recruitment' && !isEdit

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(520px, 100vw)',
        background: 'white', zIndex: 300, overflowY: 'auto',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: '#0D1117', padding: '14px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
        }}>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
              {isEdit ? `${t('edit', language)} — ${candidates.find(c => c.id === candidateId)?.firstName || ''}` : t('addCandidate', language)}
            </div>
            {isEdit && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 8, background: phase1Complete ? '#D1FAE5' : '#FEF3C7', color: phase1Complete ? '#059669' : '#D97706', fontWeight: 600 }}>
                  {FR ? 'P1' : 'P1'} {phase1Complete ? '✓' : '○'}
                </span>
                <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 8, background: phase2Complete ? '#D1FAE5' : '#FEF3C7', color: phase2Complete ? '#059669' : '#D97706', fontWeight: 600 }}>
                  P2 {phase2Complete ? '✓' : '○'}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>

          {/* Duplicate Warning */}
          {duplicates.length > 0 && duplicateAction === null && (
            <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.875rem', marginBottom: 8 }}>⚠ {t('duplicateWarning', language)}</div>
              {duplicates.map((d) => (
                <div key={d.id} style={{ fontSize: '0.75rem', color: '#78350F', marginBottom: 4, padding: '6px 8px', background: '#FEF3C7', borderRadius: 4 }}>
                  <strong>{d.firstName} {d.lastName}</strong> · {d.officeCode || d.region || '—'} · {d.status} · {d.payrollId || '—'} · {d.interviewDate || (d.createdAt || '').slice(0, 10)}
                </div>
              ))}
              {role === 'operations' && <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: 8, fontStyle: 'italic' }}>{t('rehireCheckOps', language)}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button onClick={() => { setField('isRehire', 'yes'); setDuplicateAction('acknowledgedRehire') }} style={{ padding: '6px 12px', background: '#D97706', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>{t('markAsRehire', language)}</button>
                <button onClick={() => setDuplicateAction('acknowledgedNew')} style={{ padding: '6px 12px', background: '#374151', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>{t('proceedAsNew', language)}</button>
                <button onClick={() => setDuplicates([])} style={{ padding: '6px 12px', background: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}>{t('goBackReview', language)}</button>
              </div>
            </div>
          )}

          {/* DNH Warning */}
          {dnhMatches.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '2px solid #EF4444', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.875rem', marginBottom: 8 }}>🚫 {t('dnhWarning', language)}</div>
              {dnhMatches.map((d) => (
                <div key={d.id} style={{ fontSize: '0.75rem', color: '#7F1D1D', marginBottom: 4, padding: '6px 8px', background: '#FEE2E2', borderRadius: 4 }}>
                  <strong>{d.name}</strong> · {t('reason', language)}: {d.reason} · {t('addedBy', language)}: {d.addedBy}
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={dnhAcknowledged} onChange={(e) => setDnhAcknowledged(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#CF2B1A' }} />
                <span style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600 }}>{t('iAcknowledge', language)}</span>
              </label>
              {dnhAcknowledged && (
                <button onClick={handleSubmit} style={{ marginTop: 10, padding: '7px 18px', background: '#CF2B1A', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  {t('save', language)} →
                </button>
              )}
            </div>
          )}

          {/* ══ PHASE 1 — RECRUITMENT INTAKE ══ */}
          <div style={{ marginBottom: 24, padding: '16px', background: '#FAFAFA', borderRadius: 10, border: '1px solid #E5E7EB', borderLeft: '3px solid #CF2B1A' }}>
            <PhaseHeader
              number={1}
              title={FR ? 'Informations du candidat' : 'Candidate Intake'}
              owner={FR ? 'Recrutement remplit cette section' : 'Recruitment fills this section'}
              complete={phase1Complete}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={fw}>
                <label style={lbl}>{t('firstName', language)} *</label>
                <input style={inp('firstName')} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} onBlur={() => checkDuplicates(form)} />
                {errors.firstName && <div style={err}>{errors.firstName}</div>}
              </div>
              <div style={fw}>
                <label style={lbl}>{t('lastName', language)} *</label>
                <input style={inp('lastName')} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} onBlur={() => checkDuplicates(form)} />
                {errors.lastName && <div style={err}>{errors.lastName}</div>}
              </div>
            </div>
            <div style={fw}>
              <label style={lbl}>{t('preferredName', language)} <span style={{ fontWeight: 400, textTransform: 'none', color: '#9CA3AF', fontSize: '0.65rem' }}>({FR ? 'Optionnel' : 'Optional'})</span></label>
              <input style={inp('preferredName')} value={form.preferredName} onChange={(e) => setField('preferredName', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={fw}>
                <label style={lbl}>{t('phone', language)} *</label>
                <input style={inp('phone')} value={form.phone} onChange={handlePhoneChange} onBlur={() => checkDuplicates(form)} placeholder="(XXX) XXX-XXXX" maxLength={14} />
                {errors.phone && <div style={err}>{errors.phone}</div>}
              </div>
              <div style={fw}>
                <label style={lbl}>{t('email', language)} *</label>
                <input style={inp('email')} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} onBlur={() => checkDuplicates(form)} />
                {errors.email && <div style={err}>{errors.email}</div>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={fw}>
                <label style={lbl}>{t('languagePreference', language)} *</label>
                <div style={{ display: 'flex', gap: 16, paddingTop: 6 }}>
                  {['EN', 'FR'].map((lang) => (
                    <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                      <input type="radio" name="langPref" value={lang} checked={form.languagePreference === lang} onChange={() => setField('languagePreference', lang)} style={{ accentColor: '#CF2B1A' }} />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>
              <div style={fw}>
                <label style={lbl}>{t('region', language)}</label>
                <select style={{ ...inp('region'), cursor: 'pointer' }} value={form.region} onChange={(e) => setField('region', e.target.value)}>
                  <option value="">—</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Is Rehire */}
            <div style={{ ...fw, padding: '10px 12px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <label style={{ ...lbl, marginBottom: 8 }}>{t('isRehire', language)} *</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {[{ val: 'yes', label: t('yes', language), color: '#D97706' }, { val: 'no', label: t('no', language), color: '#374151' }].map(({ val, label, color }) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="isRehire" value={val} checked={form.isRehire === val} onChange={() => setField('isRehire', val)} style={{ accentColor: '#CF2B1A', width: 15, height: 15 }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color }}>{label}</span>
                  </label>
                ))}
              </div>
              {errors.isRehire && <div style={err}>{errors.isRehire}</div>}
            </div>

            {form.isRehire !== '' && (
              <div style={fw}>
                <label style={lbl}>{t('payrollId', language)} {form.isRehire === 'yes' ? '*' : ''}</label>
                <input style={inp('payrollId')} value={form.payrollId} onChange={(e) => setField('payrollId', e.target.value)} placeholder={form.isRehire === 'no' ? (FR ? 'Ajouté après embauche' : 'Added after hiring') : ''} />
                {errors.payrollId && <div style={err}>{errors.payrollId}</div>}
              </div>
            )}

            {/* Interview section */}
            <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px dashed #E5E7EB' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                {FR ? 'Entrevue' : 'Interview'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                <label style={lbl}>{t('notes', language)} <span style={{ fontWeight: 400, textTransform: 'none', color: '#9CA3AF', fontSize: '0.65rem' }}>({FR ? 'Optionnel' : 'Optional'})</span></label>
                <textarea style={{ ...inp('notes'), minHeight: 64, resize: 'vertical', fontFamily: 'IBM Plex Sans, sans-serif' }} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ══ PHASE 2 — EMPLOYMENT DETAILS (Ops) ══ */}
          <div style={{
            marginBottom: 24, padding: '16px',
            background: phase2Complete ? '#F0FDF4' : phase2Pending ? '#FAFAFA' : '#F0F7FF',
            borderRadius: 10,
            border: `1px solid ${phase2Complete ? '#BBF7D0' : '#DBEAFE'}`,
            borderLeft: `3px solid #3B82F6`,
          }}>
            <PhaseHeader
              number={2}
              title={FR ? 'Détails de placement' : 'Employment Details'}
              owner={FR ? 'Opérations remplit cette section' : 'Operations fills this section'}
              complete={phase2Complete}
              pending={phase2Pending}
            />

            {phase2Pending && !isEdit && (
              <div style={{ fontSize: '0.75rem', color: '#1E40AF', background: '#DBEAFE', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>
                ⏳ {FR ? 'Ops complétera cette section après le placement.' : 'Ops will complete this section after placement. You can still fill it in now if available.'}
              </div>
            )}

            {/* Office Code */}
            <div style={fw} ref={officeRef}>
              <label style={lbl}>{t('officeCode', language)} {role === 'operations' ? '*' : ''}</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={inp('officeCode')}
                  value={officeSearch}
                  onChange={(e) => { setOfficeSearch(e.target.value); setOfficeDropdownOpen(true); if (!e.target.value) setForm((f) => ({ ...f, officeCode: '', manager: '', medium: '' })) }}
                  onFocus={() => setOfficeDropdownOpen(true)}
                  placeholder={FR ? 'Rechercher un bureau...' : 'Search office code...'}
                  autoComplete="off"
                />
                {officeDropdownOpen && filteredOffices.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #D1D5DB', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 600, maxHeight: 200, overflowY: 'auto' }}>
                    {filteredOffices.map((o) => (
                      <button key={o.code} onMouseDown={() => handleOfficeSelect(o)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', fontSize: '0.8rem' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontWeight: 700, color: '#111827', fontFamily: 'IBM Plex Mono, monospace', marginRight: 8 }}>{o.code}</span>
                        <span style={{ color: '#6B7280' }}>{o.name}</span>
                        {o.isFR && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: '#DBEAFE', color: '#1E40AF', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>FR</span>}
                        <div style={{ color: '#9CA3AF', fontSize: '0.7rem', marginTop: 1 }}>{o.manager} · {o.city} · {o.region}</div>
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
                  {selectedOffice.isFR && <span style={{ color: '#1E40AF', fontWeight: 700 }}>🇫🇷 FR</span>}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={fw}>
                <label style={lbl}>{t('charity', language)} {role === 'operations' ? '*' : ''}</label>
                <select style={{ ...inp('charity'), cursor: 'pointer' }} value={form.charity} onChange={(e) => setField('charity', e.target.value)}>
                  <option value="">—</option>
                  {CHARITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.charity && <div style={err}>{errors.charity}</div>}
              </div>
              <div style={fw}>
                <label style={lbl}>{t('availability', language)} {role === 'operations' ? '*' : ''}</label>
                <select style={{ ...inp('availability'), cursor: 'pointer' }} value={form.availability} onChange={(e) => setField('availability', e.target.value)}>
                  <option value="">—</option>
                  {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                {errors.availability && <div style={err}>{errors.availability}</div>}
              </div>
            </div>
            <div style={fw}>
              <label style={lbl}>{t('day0', language)}</label>
              <input type="date" style={inp('day0')} value={form.day0} onChange={(e) => setField('day0', e.target.value)} />
            </div>
          </div>

          {/* ══ PHASE 3 — USER PROFILE (info only) ══ */}
          {(form.status === 'Hired' || (isEdit && candidates.find(c => c.id === candidateId)?.status === 'Hired')) && (
            <div style={{ marginBottom: 24, padding: '14px 16px', background: form.username ? '#F0FDF4' : '#FFF5F5', borderRadius: 10, border: `1px solid ${form.username ? '#BBF7D0' : '#FECACA'}`, borderLeft: '3px solid #8B5CF6' }}>
              <PhaseHeader
                number={3}
                title={FR ? 'Profil utilisateur' : 'User Profile'}
                owner={FR ? 'Recrutement crée le profil après l\'embauche' : 'Recruitment creates profile after hiring'}
                complete={!!form.username}
                pending={!form.username}
              />
              {form.username ? (
                <div style={{ display: 'flex', gap: 20, padding: '8px 10px', background: 'white', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{t('username', language)}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: '#111827' }}>{form.username}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{t('password', language)}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: '#CF2B1A', letterSpacing: '0.2em' }}>{form.password}</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#991B1B' }}>
                  {FR
                    ? '→ Allez à « Profils utilisateurs » dans le menu pour créer le profil système de cette personne.'
                    : '→ Go to "User Profiles" in the sidebar to create this person\'s system profile.'}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #F3F4F6', position: 'sticky', bottom: 0, background: 'white', marginTop: 8 }}>
            <button onClick={handleSubmit}
              style={{ flex: 1, padding: '10px', background: '#CF2B1A', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#B02516')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#CF2B1A')}
            >
              {t('save', language)}
            </button>
            <button onClick={onClose} style={{ padding: '10px 20px', background: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
              {t('cancel', language)}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
