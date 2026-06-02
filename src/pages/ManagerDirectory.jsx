import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import { OFFICES } from '../data/offices'

const REGIONS = ['SON', 'QC', 'BC', 'EAST', 'PHONES']
const ORIGINAL_CODES = new Set(OFFICES.map(o => o.code))

const EMPTY_OFFICE = { code: '', name: '', manager: '', region: 'SON', city: '', medium: 'D2D', isFR: false }

export default function ManagerDirectory() {
  const language = useStore((s) => s.language)
  const managers = useStore((s) => s.managers)
  const updateManager = useStore((s) => s.updateManager)
  const addManager = useStore((s) => s.addManager)
  const deleteManager = useStore((s) => s.deleteManager)
  const addToast = useStore((s) => s.addToast)
  const role = useStore((s) => s.role)

  const [search, setSearch] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newOffice, setNewOffice] = useState({ ...EMPTY_OFFICE })
  const [addErrors, setAddErrors] = useState({})

  const canEdit = role === 'admin'
  const FR = language === 'FR'

  const filtered = [...managers]
    .filter((m) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        m.code.toLowerCase().includes(q) ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.manager || '').toLowerCase().includes(q) ||
        (m.city || '').toLowerCase().includes(q) ||
        (m.region || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (a.region !== b.region) return (a.region || '').localeCompare(b.region || '')
      return (a.city || '').localeCompare(b.city || '')
    })

  const startEdit = (code, field, value) => {
    if (!canEdit) return
    setEditingCell(`${code}-${field}`)
    setEditValue(value || '')
  }

  const saveEdit = (code, field) => {
    updateManager(code, { [field]: editValue })
    addToast(t('updatedSuccessfully', language), 'success')
    setEditingCell(null)
  }

  const handleKeyDown = (e, code, field) => {
    if (e.key === 'Enter') saveEdit(code, field)
    if (e.key === 'Escape') setEditingCell(null)
  }

  const handleDelete = (code) => {
    if (!window.confirm(FR ? `Supprimer le bureau "${code}"?` : `Delete office "${code}"?`)) return
    deleteManager(code)
    addToast(t('deletedSuccessfully', language), 'success')
  }

  const validateAdd = () => {
    const e = {}
    if (!newOffice.code.trim()) e.code = FR ? 'Requis' : 'Required'
    else if (managers.find(m => m.code.toUpperCase() === newOffice.code.trim().toUpperCase())) e.code = FR ? 'Code déjà utilisé' : 'Code already exists'
    if (!newOffice.name.trim()) e.name = FR ? 'Requis' : 'Required'
    if (!newOffice.manager.trim()) e.manager = FR ? 'Requis' : 'Required'
    if (!newOffice.city.trim()) e.city = FR ? 'Requis' : 'Required'
    setAddErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!validateAdd()) return
    addManager({
      ...newOffice,
      code: newOffice.code.trim().toUpperCase(),
      name: newOffice.name.trim(),
      manager: newOffice.manager.trim(),
      city: newOffice.city.trim(),
      isCustom: true,
    })
    addToast(FR ? 'Bureau ajouté' : 'Office added', 'success')
    setNewOffice({ ...EMPTY_OFFICE })
    setAddErrors({})
    setShowAddForm(false)
  }

  const cellKey = (code, field) => `${code}-${field}`

  const EditableCell = ({ code, field, value, mono = false }) => {
    const key = cellKey(code, field)
    const isEditing = editingCell === key
    if (isEditing) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(code, field)}
          onKeyDown={(e) => handleKeyDown(e, code, field)}
          style={{
            width: '100%', padding: '4px 6px', borderRadius: 4,
            border: '1.5px solid #F0194A', fontSize: mono ? '0.78rem' : '0.85rem',
            outline: 'none', background: '#FFF0F5',
            fontFamily: mono ? 'IBM Plex Mono, monospace' : 'inherit',
          }}
        />
      )
    }
    return (
      <span
        onClick={() => startEdit(code, field, value)}
        style={{ cursor: canEdit ? 'pointer' : 'default', display: 'block', padding: '2px 4px', borderRadius: 4, transition: 'background 0.1s' }}
        onMouseEnter={(e) => { if (canEdit) e.currentTarget.style.background = '#FEF3C7' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        title={canEdit ? (FR ? 'Cliquer pour modifier' : 'Click to edit') : ''}
      >
        {value || <span style={{ color: '#D1D5DB', fontStyle: 'italic', fontSize: '0.75rem' }}>—</span>}
        {canEdit && <span style={{ color: '#D1D5DB', fontSize: '0.65rem', marginLeft: 4 }}>✎</span>}
      </span>
    )
  }

  const EditableSelect = ({ code, field, value, options }) => {
    const key = cellKey(code, field)
    const isEditing = editingCell === key
    if (isEditing) {
      return (
        <select
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(code, field)}
          style={{ padding: '4px 6px', borderRadius: 4, border: '1.5px solid #F0194A', fontSize: '0.8rem', outline: 'none', background: '#FFF0F5' }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    return (
      <span
        onClick={() => startEdit(code, field, value)}
        style={{ cursor: canEdit ? 'pointer' : 'default', display: 'block', padding: '2px 4px', borderRadius: 4, transition: 'background 0.1s' }}
        onMouseEnter={(e) => { if (canEdit) e.currentTarget.style.background = '#FEF3C7' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        {value || '—'}
        {canEdit && <span style={{ color: '#D1D5DB', fontSize: '0.65rem', marginLeft: 4 }}>✎</span>}
      </span>
    )
  }

  const REGION_COLORS = { SON: '#DBEAFE', QC: '#FCE7F3', BC: '#D1FAE5', EAST: '#FEF3C7', PHONES: '#EDE9FE' }
  const REGION_TEXT = { SON: '#1E40AF', QC: '#9D174D', BC: '#065F46', EAST: '#92400E', PHONES: '#5B21B6' }

  const inp = (hasErr) => ({
    padding: '7px 10px', borderRadius: 6, border: `1px solid ${hasErr ? '#EF4444' : '#E8EAF6'}`,
    fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box',
  })

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E2769', margin: 0, letterSpacing: '-0.02em' }}>{t('managerDirectory', language)}</h1>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {filtered.length} {FR ? 'bureaux' : 'offices'}
            {canEdit && <span style={{ color: '#F0194A', marginLeft: 8 }}>· {FR ? 'Cliquez pour modifier' : 'Click any cell to edit'}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder={`${t('search', language)}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.8rem', width: 200, outline: 'none' }}
          />
          {canEdit && (
            <button
              onClick={() => setShowAddForm(s => !s)}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: showAddForm ? '#94A3B8' : '#1E2769',
                color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {showAddForm ? (FR ? '✕ Annuler' : '✕ Cancel') : (FR ? '+ Nouveau bureau' : '+ Add Office')}
            </button>
          )}
        </div>
      </div>

      {/* Add Office form */}
      {showAddForm && canEdit && (
        <div style={{ background: 'white', border: '2px solid #E8EAF6', borderRadius: 12, padding: '18px 20px', marginBottom: 20, boxShadow: '0 2px 8px rgba(30,39,105,0.07)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E2769', marginBottom: 14 }}>
            {FR ? 'Ajouter un nouveau bureau' : 'Add New Office'}
          </div>
          <form onSubmit={handleAddSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  {FR ? 'Code *' : 'Code *'}
                </label>
                <input
                  value={newOffice.code}
                  onChange={e => setNewOffice(o => ({ ...o, code: e.target.value.toUpperCase() }))}
                  style={{ ...inp(addErrors.code), fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}
                  placeholder="e.g. MTL01"
                  maxLength={10}
                />
                {addErrors.code && <div style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 2 }}>{addErrors.code}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  {FR ? 'Nom du bureau *' : 'Office Name *'}
                </label>
                <input
                  value={newOffice.name}
                  onChange={e => setNewOffice(o => ({ ...o, name: e.target.value }))}
                  style={inp(addErrors.name)}
                  placeholder={FR ? 'Nom complet du bureau' : 'Full office name'}
                />
                {addErrors.name && <div style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 2 }}>{addErrors.name}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  {FR ? 'Gestionnaire *' : 'Manager *'}
                </label>
                <input
                  value={newOffice.manager}
                  onChange={e => setNewOffice(o => ({ ...o, manager: e.target.value }))}
                  style={inp(addErrors.manager)}
                  placeholder={FR ? 'Nom du gestionnaire' : 'Manager name'}
                />
                {addErrors.manager && <div style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 2 }}>{addErrors.manager}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  {FR ? 'Région' : 'Region'}
                </label>
                <select
                  value={newOffice.region}
                  onChange={e => setNewOffice(o => ({ ...o, region: e.target.value }))}
                  style={{ ...inp(false), background: 'white', cursor: 'pointer' }}
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  {FR ? 'Ville *' : 'City *'}
                </label>
                <input
                  value={newOffice.city}
                  onChange={e => setNewOffice(o => ({ ...o, city: e.target.value }))}
                  style={inp(addErrors.city)}
                  placeholder={FR ? 'Ville' : 'City'}
                />
                {addErrors.city && <div style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 2 }}>{addErrors.city}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  {FR ? 'Médium' : 'Medium'}
                </label>
                <select
                  value={newOffice.medium}
                  onChange={e => setNewOffice(o => ({ ...o, medium: e.target.value }))}
                  style={{ ...inp(false), background: 'white', cursor: 'pointer' }}
                >
                  {['D2D', 'PHONES', 'EVENTS', 'MIXED'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={newOffice.isFR}
                  onChange={e => setNewOffice(o => ({ ...o, isFR: e.target.checked }))}
                  style={{ width: 14, height: 14, accentColor: '#1E2769' }}
                />
                {FR ? 'Bureau francophone' : 'French office'}
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1E2769', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                {FR ? 'Ajouter le bureau' : 'Add Office'}
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setNewOffice({ ...EMPTY_OFFICE }); setAddErrors({}) }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E8EAF6', background: 'white', fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>
                {FR ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>{t('officeCode', language)}</th>
              <th style={TH}>{FR ? 'Nom du bureau' : 'Office Name'}</th>
              <th style={TH}>{t('manager', language)}</th>
              <th style={TH}>{t('region', language)}</th>
              <th style={TH}>{FR ? 'Ville' : 'City'}</th>
              <th style={TH}>{t('medium', language)}</th>
              <th style={TH}>{t('frenchOffice', language)}</th>
              {canEdit && <th style={TH}></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, idx) => (
              <tr key={m.code} style={{
                borderBottom: '1px solid #F3F4F6',
                background: m.isCustom
                  ? (idx % 2 === 0 ? '#FAFFF5' : '#F5FFF0')
                  : (idx % 2 === 0 ? 'white' : '#FAFAFA'),
              }}>
                <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: '#1E40AF' }}>
                  {m.code}
                  {m.isCustom && <span style={{ marginLeft: 5, fontSize: '0.6rem', background: '#D1FAE5', color: '#065F46', borderRadius: 4, padding: '1px 4px', fontFamily: 'IBM Plex Sans, sans-serif' }}>NEW</span>}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: '#111827', fontWeight: 500, minWidth: 160 }}>
                  <EditableCell code={m.code} field="name" value={m.name} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.85rem', minWidth: 160 }}>
                  <EditableCell code={m.code} field="manager" value={m.manager} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <EditableSelect
                    code={m.code} field="region" value={m.region}
                    options={REGIONS}
                  />
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: '#374151', minWidth: 120 }}>
                  <EditableCell code={m.code} field="city" value={m.city} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: '#374151' }}>
                  <EditableSelect
                    code={m.code} field="medium" value={m.medium}
                    options={['D2D', 'PHONES', 'EVENTS', 'MIXED']}
                  />
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  {canEdit ? (
                    <button
                      onClick={() => updateManager(m.code, { isFR: !m.isFR })}
                      style={{
                        background: m.isFR ? '#DBEAFE' : '#F3F4F6',
                        color: m.isFR ? '#1E40AF' : '#9CA3AF',
                        border: 'none', borderRadius: 6, padding: '2px 8px',
                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                      }}
                      title={FR ? 'Cliquer pour basculer' : 'Click to toggle'}
                    >
                      {m.isFR ? 'FR' : '—'}
                    </button>
                  ) : (
                    m.isFR
                      ? <span style={{ color: '#1E40AF', fontWeight: 700 }}>FR</span>
                      : <span style={{ color: '#D1D5DB' }}>—</span>
                  )}
                </td>
                {canEdit && (
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    {m.isCustom && (
                      <button
                        onClick={() => handleDelete(m.code)}
                        style={{ background: 'none', border: '1px solid #FECACA', color: '#EF4444', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        {FR ? 'Suppr.' : 'Delete'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TH = {
  padding: '10px 14px', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700,
  color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em',
  background: '#F6F7FC', borderBottom: '2px solid #E8EAF6', whiteSpace: 'nowrap',
}
