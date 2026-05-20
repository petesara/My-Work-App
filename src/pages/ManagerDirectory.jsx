import { useState } from 'react'
import useStore from '../store/useStore'
import { t } from '../data/translations'

export default function ManagerDirectory() {
  const language = useStore((s) => s.language)
  const managers = useStore((s) => s.managers)
  const updateManager = useStore((s) => s.updateManager)
  const addToast = useStore((s) => s.addToast)
  const role = useStore((s) => s.role)

  const [search, setSearch] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')

  const canEdit = role === 'admin'

  const filtered = [...managers]
    .filter((m) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.manager.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region)
      return a.city.localeCompare(b.city)
    })

  const startEdit = (code, field, value) => {
    if (!canEdit) return
    setEditingCell(`${code}-${field}`)
    setEditValue(value)
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

  const cellKey = (code, field) => `${code}-${field}`

  const TH = ({ children }) => (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )

  const EditableCell = ({ code, field, value }) => {
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
          style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1.5px solid #F0194A', fontSize: '0.85rem', outline: 'none', background: '#FFF0F5' }}
        />
      )
    }
    return (
      <span
        onClick={() => startEdit(code, field, value)}
        style={{ cursor: canEdit ? 'pointer' : 'default', display: 'block', padding: '2px 4px', borderRadius: 4, transition: 'background 0.1s' }}
        onMouseEnter={(e) => { if (canEdit) e.currentTarget.style.background = '#FEF3C7' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        title={canEdit ? 'Click to edit' : ''}
      >
        {value}
        {canEdit && <span style={{ color: '#D1D5DB', fontSize: '0.65rem', marginLeft: 4 }}>✎</span>}
      </span>
    )
  }

  const REGION_COLORS = { SON: '#DBEAFE', QC: '#FCE7F3', BC: '#D1FAE5', EAST: '#FEF3C7', PHONES: '#EDE9FE' }
  const REGION_TEXT = { SON: '#1E40AF', QC: '#9D174D', BC: '#065F46', EAST: '#92400E', PHONES: '#5B21B6' }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{t('managerDirectory', language)}</h1>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {filtered.length} {language === 'FR' ? 'bureaux' : 'offices'}
            {canEdit && <span style={{ color: '#F0194A', marginLeft: 8 }}>· {language === 'FR' ? 'Cliquez sur un gestionnaire pour modifier' : 'Click a manager name to edit'}</span>}
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

      <div style={{ borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <TH>{t('officeCode', language)}</TH>
              <TH>{language === 'FR' ? 'Nom du bureau' : 'Office Name'}</TH>
              <TH>{t('manager', language)}</TH>
              <TH>{t('region', language)}</TH>
              <TH>{language === 'FR' ? 'Ville' : 'City'}</TH>
              <TH>{t('medium', language)}</TH>
              <TH>{t('frenchOffice', language)}</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, idx) => (
              <tr key={m.code} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: '#1E40AF' }}>{m.code}</td>
                <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: '#111827', fontWeight: 500 }}>{m.name}</td>
                <td style={{ padding: '10px 14px', fontSize: '0.85rem', minWidth: 160 }}>
                  <EditableCell code={m.code} field="manager" value={m.manager} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ background: REGION_COLORS[m.region] || '#F3F4F6', color: REGION_TEXT[m.region] || '#374151', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                    {m.region}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: '#374151' }}>{m.city}</td>
                <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: '#374151' }}>{m.medium}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  {m.isFR ? <span style={{ color: '#1E40AF', fontWeight: 700 }}>FR</span> : <span style={{ color: '#D1D5DB' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
