import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { t } from '../data/translations'

const ROLE_DESCRIPTIONS = {
  EN: {
    recruitment: 'Add candidates, manage pipeline, interview tracking',
    admin: 'Onboarding, manager directory, system setup',
    operations: 'View pipeline, monitor onboarding progress',
  },
  FR: {
    recruitment: 'Ajouter des candidats, gérer le pipeline, suivi des entrevues',
    admin: "Intégration, répertoire des gestionnaires, configuration du système",
    operations: "Voir le pipeline, surveiller le progrès d'intégration",
  },
}

const DEFAULT_ROUTES = {
  recruitment: '/pipeline',
  admin: '/onboarding',
  operations: '/pipeline',
}

export default function Landing() {
  const setRole = useStore((s) => s.setRole)
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)

  const handleGetStarted = () => {
    if (!selectedRole) return
    setRole(selectedRole)
    navigate(DEFAULT_ROUTES[selectedRole])
  }

  const descriptions = ROLE_DESCRIPTIONS[language] || ROLE_DESCRIPTIONS.EN

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D1117',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Language Toggle */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <div style={{ display: 'flex', border: '1px solid #30363D', borderRadius: 6, overflow: 'hidden' }}>
          {['EN', 'FR'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: language === lang ? '#CF2B1A' : 'transparent',
                color: language === lang ? 'white' : '#8B949E',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Logo + Title */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div
          style={{
            color: '#CF2B1A',
            fontSize: '4rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          ATS
        </div>
        <div style={{ color: '#F0F6FF', fontSize: '1.125rem', fontWeight: 300, marginBottom: 6 }}>
          Applicant Tracking System
        </div>
        <div style={{ color: '#6E7681', fontSize: '0.875rem' }}>
          Système de suivi des candidat(e)s
        </div>
      </div>

      {/* Language select label */}
      <div style={{ color: '#8B949E', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
        {t('selectRole', language)}
      </div>

      {/* Role cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          width: '100%',
          maxWidth: 680,
          marginBottom: 32,
        }}
      >
        {['recruitment', 'admin', 'operations'].map((role) => {
          const isSelected = selectedRole === role
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              style={{
                background: isSelected ? 'rgba(207,43,26,0.12)' : '#161B22',
                border: isSelected ? '2px solid #CF2B1A' : '2px solid #21262D',
                borderRadius: 12,
                padding: '20px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = '#CF2B1A'
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = '#21262D'
              }}
            >
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: isSelected ? '#CF2B1A' : '#C9D1D9',
                  marginBottom: 8,
                  textTransform: 'capitalize',
                }}
              >
                {t(role, language)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6E7681', lineHeight: 1.5 }}>
                {descriptions[role]}
              </div>
              {isSelected && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CF2B1A', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.7rem', color: '#CF2B1A', fontWeight: 600 }}>
                    {language === 'FR' ? 'Sélectionné' : 'Selected'}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Get Started */}
      <button
        onClick={handleGetStarted}
        disabled={!selectedRole}
        style={{
          background: selectedRole ? '#CF2B1A' : '#21262D',
          color: selectedRole ? 'white' : '#484F58',
          border: 'none',
          borderRadius: 8,
          padding: '12px 40px',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: selectedRole ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={(e) => {
          if (selectedRole) e.currentTarget.style.background = '#B02516'
        }}
        onMouseLeave={(e) => {
          if (selectedRole) e.currentTarget.style.background = '#CF2B1A'
        }}
      >
        {t('getStarted', language)}
      </button>

      {/* Footer */}
      <div style={{ marginTop: 48, color: '#30363D', fontSize: '0.7rem', fontFamily: 'IBM Plex Mono, monospace' }}>
        ATS v1.0.0 · Canadian Face-to-Face Fundraising
      </div>
    </div>
  )
}
