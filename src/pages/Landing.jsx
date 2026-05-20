import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { t } from '../data/translations'
import BrandLogo from '../components/BrandLogo'

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
        background: '#1E2769',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(45,205,184,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(240,25,74,0.05)', pointerEvents: 'none' }} />

      {/* Language Toggle */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden' }}>
          {['EN', 'FR'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: language === lang ? '#F0194A' : 'transparent',
                color: language === lang ? 'white' : 'rgba(255,255,255,0.45)',
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

      {/* Brand Logo */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <BrandLogo language={language} size="lg" />
      </div>

      {/* Subtitle */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace' }}>
          {language === 'FR' ? 'Système de suivi des candidat(e)s' : 'Applicant Tracking System'}
        </div>
      </div>

      {/* Role select label */}
      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
        {t('selectRole', language)}
      </div>

      {/* Role cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
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
                background: isSelected ? 'rgba(240,25,74,0.15)' : 'rgba(255,255,255,0.05)',
                border: isSelected ? '2px solid #F0194A' : '2px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '20px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: isSelected ? '#F0194A' : 'rgba(255,255,255,0.85)',
                  marginBottom: 8,
                  textTransform: 'capitalize',
                }}
              >
                {t(role, language)}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                {descriptions[role]}
              </div>
              {isSelected && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F0194A', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.68rem', color: '#F0194A', fontWeight: 700 }}>
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
          background: selectedRole ? '#F0194A' : 'rgba(255,255,255,0.08)',
          color: selectedRole ? 'white' : 'rgba(255,255,255,0.25)',
          border: 'none',
          borderRadius: 8,
          padding: '12px 48px',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: selectedRole ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={(e) => {
          if (selectedRole) e.currentTarget.style.background = '#C9123A'
        }}
        onMouseLeave={(e) => {
          if (selectedRole) e.currentTarget.style.background = '#F0194A'
        }}
      >
        {t('getStarted', language)}
      </button>

      {/* Footer */}
      <div style={{ marginTop: 48, color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', fontFamily: 'IBM Plex Mono, monospace' }}>
        ATS v1.0.0 · Canadian Face-to-Face Fundraising
      </div>
    </div>
  )
}
