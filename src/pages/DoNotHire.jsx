import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'

export default function DoNotHire() {
  const language = useStore((s) => s.language)
  const role = useStore((s) => s.role)
  const doNotHireList = useStore((s) => s.doNotHireList)
  const addToDoNotHire = useStore((s) => s.addToDoNotHire)
  const removeFromDoNotHire = useStore((s) => s.removeFromDoNotHire)
  const addToast = useStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '', addedBy: '' })
  const [errors, setErrors] = useState({})

  const canEdit = role === 'admin' || role === 'recruitment'
  const canDelete = role === 'admin'

  const filtered = doNotHireList.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (d.name || '').toLowerCase().includes(q) || (d.phone || '').includes(q) || (d.email || '').toLowerCase().includes(q)
  })

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = language === 'FR' ? 'Requis' : 'Required'
    if (!form.reason.trim()) e.reason = language === 'FR' ? 'Requis' : 'Required'
    if (!form.addedBy.trim()) e.addedBy = language === 'FR' ? 'Requis' : 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    addToDoNotHire(form)
    addToast(t('savedSuccessfully', language), 'success')
    setForm({ name: '', phone: '', email: '', reason: '', addedBy: '' })
    setShowForm(false)
    setErrors({})
  }

  const handleDelete = (id) => {
    if (!window.confirm(t('confirmDelete', language))) return
    removeFromDoNotHire(id)
    addToast(t('deletedSuccessfully', language), 'success')
  }

  const inputStyle = (err) => ({
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: `1px solid ${err ? '#EF4444' : '#E5E7EB'}`,
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  })

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{t('doNotHire', language)}</h1>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {filtered.length} {language === 'FR' ? 'entrée(s)' : 'entries'}
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
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #FECACA', padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(220,38,38,0.08)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#991B1B', marginBottom: 16 }}>{t('addToDNH', language)}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  {language === 'FR' ? 'Nom complet' : 'Full Name'} *
                </label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle(errors.name)} />
                {errors.name && <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>{errors.name}</span>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{t('phone', language)}</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle(false)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{t('email', language)}</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle(false)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{t('addedBy', language)} *</label>
                <input value={form.addedBy} onChange={(e) => setForm({ ...form, addedBy: e.target.value })} style={inputStyle(errors.addedBy)} />
                {errors.addedBy && <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>{errors.addedBy}</span>}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{t('reason', language)} *</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} style={{ ...inputStyle(errors.reason), resize: 'vertical' }} />
                {errors.reason && <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>{errors.reason}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                {t('save', language)}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setErrors({}) }} style={{ background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                {t('cancel', language)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder={`${t('search', language)}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', width: 240, marginBottom: 16, outline: 'none' }}
      />

      {/* Table */}
      <div style={{ borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {[language === 'FR' ? 'Nom' : 'Name', t('phone', language), t('email', language), t('reason', language), t('dateAdded', language), t('addedBy', language), ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                {language === 'FR' ? 'Liste vide — aucune entrée.' : 'List is empty — no entries.'}
              </td></tr>
            ) : (
              filtered.map((d, idx) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? 'white' : '#FFF5F5' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827', fontSize: '0.85rem' }}>{d.name}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', color: '#374151' }}>{d.phone || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#374151' }}>{d.email || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#374151', maxWidth: 200 }}>{d.reason}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: '#6B7280', fontFamily: 'IBM Plex Mono, monospace' }}>
                    {d.dateAdded ? new Date(d.dateAdded).toLocaleDateString('en-CA') : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#374151' }}>{d.addedBy}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {canDelete && (
                      <button onClick={() => handleDelete(d.id)} style={{ background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px', borderRadius: 4, border: '1px solid #FECACA' }}>
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
