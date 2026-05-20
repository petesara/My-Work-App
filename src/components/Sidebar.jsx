import { NavLink } from 'react-router-dom'
import useStore from '../store/useStore'
import { t } from '../data/translations'

const NAV_ITEMS = {
  recruitment: [
    { to: '/pipeline', key: 'pipeline', icon: '◈', shortcut: 'N' },
    { to: '/calendar', key: 'calendar', icon: '◷' },
    { to: '/user-profiles', key: 'userProfiles', icon: '◎' },
    { to: '/do-not-hire', key: 'doNotHire', icon: '⊘' },
    { to: '/reports', key: 'reports', icon: '▣' },
    { to: '/historical', key: 'historicalRecords', icon: '🕓' },
  ],
  admin: [
    { to: '/onboarding', key: 'onboarding', icon: '✦' },
    { to: '/managers', key: 'managerDirectory', icon: '◉' },
    { to: '/reports', key: 'reports', icon: '▣' },
    { to: '/historical', key: 'historicalRecords', icon: '🕓' },
  ],
  operations: [
    { to: '/pipeline', key: 'pipeline', icon: '◈', shortcut: 'N' },
    { to: '/calendar', key: 'calendar', icon: '◷' },
    { to: '/onboarding', key: 'onboarding', icon: '✦' },
    { to: '/reports', key: 'reports', icon: '▣' },
  ],
}

export default function Sidebar() {
  const role = useStore((s) => s.role)
  const language = useStore((s) => s.language)
  const items = NAV_ITEMS[role] || []

  return (
    <aside
      style={{
        width: 220,
        background: '#161B22',
        position: 'fixed',
        top: 56,
        left: 0,
        bottom: 0,
        zIndex: 90,
        borderRight: '1px solid #21262D',
        overflowY: 'auto',
      }}
    >
      <nav className="pt-4 pb-8">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#CF2B1A' : '#8B949E',
              background: isActive ? 'rgba(207,43,26,0.08)' : 'transparent',
              borderLeft: isActive ? '3px solid #CF2B1A' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
              userSelect: 'none',
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.style.borderLeftColor.includes('207')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#C9D1D9'
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.style.borderLeftColor.includes('207')) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#8B949E'
              }
            }}
          >
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{item.icon}</span>
            <span className="flex-1">{t(item.key, language)}</span>
            {item.shortcut && (
              <span
                style={{
                  fontSize: '0.65rem',
                  background: '#21262D',
                  color: '#6E7681',
                  border: '1px solid #30363D',
                  borderRadius: 4,
                  padding: '1px 5px',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
              >
                {item.shortcut}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Version footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          padding: '0 16px',
          fontSize: '0.65rem',
          color: '#30363D',
          fontFamily: 'IBM Plex Mono, monospace',
        }}
      >
        ATS v1.0.0
      </div>
    </aside>
  )
}
