import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import BrandLogo from './BrandLogo'

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
    recruitment: '#2DCDB8',
    admin: '#F0194A',
    operations: '#8B5CF6',
  }[role] || '#374151'

  return (
    <header
      style={{ background: '#1E2769', height: 56, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      className="fixed top-0 left-0 right-0 flex items-center px-4 gap-4 shadow-lg"
    >
      {/* Logo */}
      <div className="flex items-center min-w-[200px]">
        <BrandLogo language={language} size="sm" />
      </div>

      {/* Center: role pill */}
      <div className="flex-1 flex justify-center">
        {role && (
          <span
            style={{ background: rolePillColor, color: 'white', fontSize: '0.7rem', letterSpacing: '0.06em', fontWeight: 700 }}
            className="px-3 py-1 rounded-full uppercase"
          >
            {t(role, language)}
          </span>
        )}
      </div>

      {/* Right: language + role switcher */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
          {['EN', 'FR'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                background: language === lang ? '#F0194A' : 'transparent',
                color: language === lang ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 12px',
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
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.75rem',
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
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
              style={{ background: '#1E2769', border: '1px solid rgba(255,255,255,0.15)', top: '100%', right: 0, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
              className="absolute z-50 rounded-lg min-w-[160px] py-1"
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
                    color: r === role ? '#2DCDB8' : 'rgba(255,255,255,0.75)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: r === role ? 700 : 400,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {t(r, language)}
                </button>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
              <button
                onClick={() => { setRole(null); setRoleDropdown(false); navigate('/') }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.4)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
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
