import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'

const EMPTY_FORM = { payrollId: '', name: '', phone: '', email: '', reason: '', addedBy: '' }

function ImportModal({ language, onClose, onImport }) {
  const FR = language === 'FR'
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState([])
  const [error, setError] = useState('')

  const PLACEHOLDER = FR
    ? 'Nom Complet, Téléphone, Courriel, Raison, Ajouté par\nJean Tremblay, (514) 555-1234, jean@email.com, Conduite inappropriée, Marie Dubois\nSophie Martin, (438) 555-9876, , Menace verbale, Pierre Gagnon'
    : 'Full Name, Phone, Email, Reason, Added By\nJohn Smith, (514) 555-1234, john@email.com, Inappropriate conduct, Jane Doe\nSarah Jones, (438) 555-9876, , Verbal threat, Mike Brown'

  const parseRaw = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const rows = []
    const errs = []
    lines.forEach((line, i) => {
      if (i === 0 && /^(name|nom)/i.test(line)) return // skip header
      const parts = line.split(',').map(p => p.trim())
      const [name, phone, email, reason, addedBy] = parts
      if (!name) { errs.push(FR ? `Ligne ${i + 1}: nom manquant` : `Line ${i + 1}: missing name`); return }
      if (!reason) { errs.push(FR ? `Ligne ${i + 1}: raison manquante` : `Line ${i + 1}: missing reason`); return }
      if (!addedBy) { errs.push(FR ? `Ligne ${i + 1}: "ajouté par" manquant` : `Line ${i + 1}: missing "Added By"`); return }
      rows.push({ name, phone: phone || '', email: email || '', reason, addedBy })
    })
    return { rows, errs }
  }

  const handlePreview = () => {
    const { rows, errs } = parseRaw(raw)
    if (errs.length) { setError(errs.join(' | ')); setPreview([]); return }
    if (!rows.length) { setError(FR ? 'Aucune ligne valide trouvée.' : 'No valid rows found.'); setPreview([]); return }
    setError('')
    setPreview(rows)
  }

  const handleConfirm = () => {
    if (!preview.length) return
    onImport(preview)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#991B1B' }}>
              {FR ? 'Importer — Liste Ne pas embaucher' : 'Bulk Import — Do Not Hire List'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 2 }}>
              {FR ? 'Format CSV: Nom, Téléphone, Courriel, Raison, Ajouté par' : 'CSV format: Name, Phone, Email, Reason, Added By'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', flex: 1, overflow: 'auto' }}>
          <textarea
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setPreview([]); setError('') }}
            placeholder={PLACEHOLDER}
            rows={8}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.78rem', fontFamily: 'IBM Plex Mono, monospace', resize: 'vertical', boxSizing: 'border-box', outline: 'none', lineHeight: 1.6 }}
          />
          {error && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#FEF2F2', borderRadius: 6, border: '1px solid #FECACA', fontSize: '0.72rem', color: '#DC2626' }}>{error}</div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={handlePreview} style={{ background: '#1E2769', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              {FR ? 'Aperçu' : 'Preview'}
            </button>
            {preview.length > 0 && (
              <button onClick={handleConfirm} style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                {FR ? `Importer ${preview.length} entrée(s)` : `Import ${preview.length} entr${preview.length !== 1 ? 'ies' : 'y'}`}
              </button>
            )}
          </div>

          {preview.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {FR ? `Aperçu — ${preview.length} entrée(s)` : `Preview — ${preview.length} entr${preview.length !== 1 ? 'ies' : 'y'}`}
              </div>
              <div style={{ borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {[FR ? 'Nom' : 'Name', FR ? 'Téléphone' : 'Phone', FR ? 'Courriel' : 'Email', FR ? 'Raison' : 'Reason', FR ? 'Ajouté par' : 'Added By'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: '#991B1B' }}>{row.name}</td>
                        <td style={{ padding: '7px 10px', color: '#6B7280' }}>{row.phone || '—'}</td>
                        <td style={{ padding: '7px 10px', color: '#6B7280' }}>{row.email || '—'}</td>
                        <td style={{ padding: '7px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.reason}>{row.reason}</td>
                        <td style={{ padding: '7px 10px', color: '#6B7280' }}>{row.addedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DoNotHire() {
  const language = useStore((s) => s.language)
  const role = useStore((s) => s.role)
  const doNotHireList = useStore((s) => s.doNotHireList)
  const candidates = useStore((s) => s.candidates)
  const addToDoNotHire = useStore((s) => s.addToDoNotHire)
  const removeFromDoNotHire = useStore((s) => s.removeFromDoNotHire)
  const addToast = useStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const FR = language === 'FR'

  const canEdit = role === 'admin' || role === 'recruitment'
  const canDelete = role === 'admin'
  const isRecruitment = role === 'recruitment'

  const filtered = doNotHireList.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (d.name || '').toLowerCase().includes(q) ||
      (d.phone || '').includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.payrollId || '').toLowerCase().includes(q)
    )
  })

  const handlePayrollLookup = (id) => {
    const match = candidates.find((c) => c.payrollId && c.payrollId.trim() === id.trim())
    if (match) {
      setForm((f) => ({
        ...f,
        payrollId: id,
        name: f.name || `${match.firstName} ${match.lastName}`.trim(),
        phone: f.phone || match.phone || '',
        email: f.email || match.email || '',
      }))
    } else {
      setForm((f) => ({ ...f, payrollId: id }))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = FR ? 'Requis' : 'Required'
    if (!form.reason.trim()) e.reason = FR ? 'Requis' : 'Required'
    if (!form.addedBy.trim()) e.addedBy = FR ? 'Requis' : 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    addToDoNotHire({ ...form })
    addToast(t('savedSuccessfully', language), 'success')
    setForm(EMPTY_FORM)
    setShowForm(false)
    setErrors({})
  }

  const handleDelete = (id) => {
    if (!window.confirm(FR ? 'Supprimer cette entrée?' : 'Delete this entry?')) return
    removeFromDoNotHire(id)
    addToast(t('deletedSuccessfully', language), 'success')
  }

  const handleBulkImport = (rows) => {
    rows.forEach((row) => addToDoNotHire(row))
    addToast(
      FR ? `${rows.length} entrée(s) importée(s)` : `${rows.length} entr${rows.length !== 1 ? 'ies' : 'y'} imported`,
      'success'
    )
  }

  const inp = (hasErr) => ({
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: `1px solid ${hasErr ? '#EF4444' : '#E5E7EB'}`,
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', background: 'white',
  })
  const lbl = { fontSize: '0.72rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }

  const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', background: '#F6F7FC', borderBottom: '2px solid #E8EAF6', whiteSpace: 'nowrap' }
  const TD = { padding: '11px 14px', fontSize: '0.82rem', color: '#374151', borderBottom: '1px solid #F3F4F8' }

  return (
    <div style={{ padding: 24 }}>
      {showImport && (
        <ImportModal language={language} onClose={() => setShowImport(false)} onImport={handleBulkImport} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E2769', margin: 0, letterSpacing: '-0.02em' }}>{t('doNotHire', language)}</h1>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {doNotHireList.length} {FR ? 'entrée(s)' : 'entries'} · {filtered.length} {FR ? 'affichée(s)' : 'shown'}
          </p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            {isRecruitment && (
              <button
                onClick={() => setShowImport(true)}
                style={{ background: '#1E2769', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}
              >
                ↑ {FR ? 'Importer' : 'Bulk Import'}
              </button>
            )}
            <button
              onClick={() => setShowForm((s) => !s)}
              style={{ background: '#F0194A', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(240,25,74,0.3)' }}
            >
              + {t('addToList', language)}
            </button>
          </div>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 10, border: '2px solid #FECACA', padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(220,38,38,0.08)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>
            {FR ? 'Ajouter à la liste Ne pas embaucher' : 'Add to Do Not Hire List'}
          </div>
          {!isRecruitment && (
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 16 }}>
              {FR
                ? 'Entrez l\'ID de paie pour auto-remplir les informations si le candidat existe dans le système.'
                : 'Enter Payroll ID to auto-populate info if the candidate exists in the system.'}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {/* Payroll ID — admin only */}
            {!isRecruitment && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FFF0F5', borderRadius: 8, border: '1px solid #FECACA' }}>
                <label style={lbl}>{t('payrollId', language)} <span style={{ fontWeight: 400, textTransform: 'none', color: '#9CA3AF' }}>({FR ? 'Optionnel — auto-remplit' : 'Optional — auto-fills info'})</span></label>
                <input
                  value={form.payrollId}
                  onChange={(e) => handlePayrollLookup(e.target.value)}
                  style={{ ...inp(false), fontFamily: 'IBM Plex Mono, monospace', maxWidth: 200 }}
                  placeholder={FR ? 'Ex: EMP1234' : 'e.g. EMP1234'}
                />
                {form.payrollId && candidates.find(c => c.payrollId?.trim() === form.payrollId.trim()) && (
                  <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: 4 }}>
                    ✓ {FR ? 'Trouvé dans le système — infos remplies ci-dessous' : 'Found in system — info filled below'}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>{FR ? 'Nom complet' : 'Full Name'} *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp(errors.name)} />
                {errors.name && <span style={{ fontSize: '0.68rem', color: '#EF4444' }}>{errors.name}</span>}
              </div>
              <div>
                <label style={lbl}>{t('phone', language)}</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp(false)} placeholder="(XXX) XXX-XXXX" />
              </div>
              <div>
                <label style={lbl}>{t('email', language)}</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp(false)} />
              </div>
              <div>
                <label style={lbl}>{t('addedBy', language)} *</label>
                <input value={form.addedBy} onChange={(e) => setForm({ ...form, addedBy: e.target.value })} style={inp(errors.addedBy)} />
                {errors.addedBy && <span style={{ fontSize: '0.68rem', color: '#EF4444' }}>{errors.addedBy}</span>}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>{t('reason', language)} *</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} style={{ ...inp(errors.reason), resize: 'vertical' }} />
                {errors.reason && <span style={{ fontSize: '0.68rem', color: '#EF4444' }}>{errors.reason}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                {t('save', language)}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}) }}
                style={{ background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                {t('cancel', language)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder={FR ? 'Rechercher par nom, tél, courriel, ID de paie...' : 'Search by name, phone, email, payroll ID...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', width: 340, outline: 'none' }}
        />
      </div>

      {/* Table */}
      <div style={{ borderRadius: 14, border: '1px solid #E8EAF6', background: 'white', boxShadow: '0 2px 8px rgba(30,39,105,0.06)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {!isRecruitment && <th style={TH}>{t('payrollId', language)}</th>}
              <th style={TH}>{FR ? 'Nom' : 'Name'}</th>
              <th style={TH}>{t('phone', language)}</th>
              <th style={TH}>{t('email', language)}</th>
              <th style={TH}>{t('reason', language)}</th>
              <th style={TH}>{t('dateAdded', language)}</th>
              <th style={TH}>{t('addedBy', language)}</th>
              <th style={TH}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={isRecruitment ? 7 : 8} style={{ padding: '40px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                {FR ? 'Aucune entrée trouvée.' : 'No entries found.'}
              </td></tr>
            ) : (
              filtered.map((d, idx) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? 'white' : '#FFF0F5' }}>
                  {!isRecruitment && (
                    <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.78rem', color: d.payrollId ? '#111827' : '#D1D5DB', fontWeight: d.payrollId ? 600 : 400 }}>
                      {d.payrollId || '—'}
                    </td>
                  )}
                  <td style={{ ...TD, fontWeight: 600, color: '#991B1B' }}>{d.name}</td>
                  <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.78rem' }}>{d.phone || '—'}</td>
                  <td style={{ ...TD, fontSize: '0.78rem' }}>{d.email || '—'}</td>
                  <td style={{ ...TD, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.reason}>{d.reason}</td>
                  <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', color: '#6B7280' }}>
                    {d.dateAdded ? new Date(d.dateAdded).toLocaleDateString('en-CA') : '—'}
                  </td>
                  <td style={TD}>{d.addedBy}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    {canDelete && (
                      <button onClick={() => handleDelete(d.id)}
                        style={{ background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem', padding: '3px 8px', borderRadius: 4, border: '1px solid #FECACA' }}>
                        {t('delete', language)}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
