import { Routes, Route, Navigate } from 'react-router-dom'
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
