import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { t } from '../data/translations'

const ROLE_LABELS = { recruitment: null, admin: null, operations: null }

export default function Header() {
  const role = useStore((s) => s.role)
  const language = useStore((s) => s.language)
  const setRole = useStore((s) => s.setRole)
  const setLanguage = useStore((s) => s.setLanguage)
  const navigate = useNavigate()
  const [roleDropdown, setRoleDropdown] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    if (!roleDropdown) return
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setRoleDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [roleDropdown])

  const handleRoleSwitch = (newRole) => {
    setRole(newRole)
    setRoleDropdown(false)
    if (newRole === 'recruitment' || newRole === 'operations') navigate('/pipeline')
    else if (newRole === 'admin') navigate('/onboarding')
  }

  const rolePillColor = {
    recruitment: '#1E40AF',
    admin: '#065F46',
    operations: '#92400E',
  }[role] || '#374151'

  return (
    <header
      style={{ background: '#0D1117', height: 56, zIndex: 100 }}
      className="fixed top-0 left-0 right-0 flex items-center px-4 gap-4 shadow-md"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <span style={{ color: '#CF2B1A', fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-0.02em' }}>
          ATS
        </span>
        <span style={{ color: '#6B7280', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Talent Pipeline
        </span>
      </div>

      {/* Center: role pill */}
      <div className="flex-1 flex justify-center">
        {role && (
          <span
            style={{ background: rolePillColor, color: 'white', fontSize: '0.75rem', letterSpacing: '0.05em' }}
            className="px-3 py-1 rounded-full font-medium uppercase"
          >
            {t(role, language)}
          </span>
        )}
      </div>

      {/* Right: language + role switcher */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <div className="flex rounded overflow-hidden border border-gray-600">
          {['EN', 'FR'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                background: language === lang ? '#CF2B1A' : 'transparent',
                color: language === lang ? 'white' : '#9CA3AF',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 10px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Role switcher */}
        <div ref={dropRef} className="relative">
          <button
            onClick={() => setRoleDropdown((o) => !o)}
            style={{
              background: '#1F2937',
              color: '#D1D5DB',
              fontSize: '0.75rem',
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid #374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>⇄</span>
            <span>{language === 'FR' ? 'Rôle' : 'Role'}</span>
          </button>
          {roleDropdown && (
            <div
              style={{ background: '#1F2937', border: '1px solid #374151', top: '100%', right: 0, marginTop: 4 }}
              className="absolute z-50 rounded-lg shadow-xl min-w-[160px] py-1"
            >
              {['recruitment', 'admin', 'operations'].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    color: r === role ? '#CF2B1A' : '#D1D5DB',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: r === role ? 600 : 400,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#374151')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {t(r, language)}
                </button>
              ))}
              <div style={{ borderTop: '1px solid #374151', margin: '4px 0' }} />
              <button
                onClick={() => { setRole(null); setRoleDropdown(false); navigate('/') }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  color: '#9CA3AF',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#374151')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {language === 'FR' ? '← Déconnexion' : '← Sign Out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
