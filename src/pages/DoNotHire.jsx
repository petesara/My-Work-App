import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'

const EMPTY_FORM = { payrollId: '', name: '', phone: '', email: '', reason: '', addedBy: '' }

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
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const FR = language === 'FR'

  const canEdit = role === 'admin' || role === 'recruitment'
  const canDelete = role === 'admin'

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

  // When payroll ID is entered, auto-populate from existing candidates
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

  const inp = (hasErr) => ({
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: `1px solid ${hasErr ? '#EF4444' : '#E5E7EB'}`,
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', background: 'white',
  })
  const lbl = { fontSize: '0.72rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }

  const TH = { padding: '10px 14px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }
  const TD = { padding: '10px 14px', fontSize: '0.82rem', color: '#374151', borderBottom: '1px solid #F3F4F6' }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{t('doNotHire', language)}</h1>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {doNotHireList.length} {FR ? 'entrée(s)' : 'entries'} · {filtered.length} {FR ? 'affichée(s)' : 'shown'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm((s) => !s)}
            style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            + {t('addToList', language)}
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 10, border: '2px solid #FECACA', padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(220,38,38,0.08)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>
            {FR ? 'Ajouter à la liste Ne pas embaucher' : 'Add to Do Not Hire List'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 16 }}>
            {FR
              ? 'Entrez l\'ID de paie pour auto-remplir les informations si le candidat existe dans le système.'
              : 'Enter Payroll ID to auto-populate info if the candidate exists in the system.'}
          </div>
          <form onSubmit={handleSubmit}>
            {/* Payroll ID first — triggers auto-lookup */}
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
      <div style={{ borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>{t('payrollId', language)}</th>
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
              <tr><td colSpan={8} style={{ padding: '40px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                {FR ? 'Aucune entrée trouvée.' : 'No entries found.'}
              </td></tr>
            ) : (
              filtered.map((d, idx) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? 'white' : '#FFF0F5' }}>
                  <td style={{ ...TD, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.78rem', color: d.payrollId ? '#111827' : '#D1D5DB', fontWeight: d.payrollId ? 600 : 400 }}>
                    {d.payrollId || '—'}
                  </td>
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
