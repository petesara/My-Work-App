import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useStore from './store/useStore'
import Landing from './pages/Landing'
import Pipeline from './pages/Pipeline'
import OnboardingTracker from './pages/OnboardingTracker'
import ManagerDirectory from './pages/ManagerDirectory'
import Reports from './pages/Reports'
import DoNotHire from './pages/DoNotHire'
import UserProfiles from './pages/UserProfiles'
import Calendar from './pages/Calendar'
import HistoricalRecords from './pages/HistoricalRecords'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const role = useStore((s) => s.role)
  if (!role) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  const initialized = useStore(s => s.initialized)
  const initError = useStore(s => s.initError)
  const initializeFromServer = useStore(s => s.initializeFromServer)
  const language = useStore(s => s.language)

  useEffect(() => { initializeFromServer() }, [])

  if (!initialized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0D1117', gap: 16 }}>
        <div style={{ color: '#CF2B1A', fontSize: '1.5rem', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em' }}>ATS</div>
        {initError ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#EF4444', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '0.875rem', marginBottom: 12 }}>
              {language === 'FR' ? 'Impossible de se connecter au serveur.' : 'Could not connect to server.'}
            </div>
            <button
              onClick={() => initializeFromServer()}
              style={{ background: '#CF2B1A', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {language === 'FR' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        ) : (
          <div style={{ color: '#8B949E', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '0.8rem' }}>
            {language === 'FR' ? 'Chargement...' : 'Loading data...'}
          </div>
        )}
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/pipeline"
        element={
          <ProtectedRoute>
            <Pipeline />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingTracker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/managers"
        element={
          <ProtectedRoute>
            <ManagerDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/do-not-hire"
        element={
          <ProtectedRoute>
            <DoNotHire />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-profiles"
        element={
          <ProtectedRoute>
            <UserProfiles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historical"
        element={
          <ProtectedRoute>
            <HistoricalRecords />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
