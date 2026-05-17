import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Toast from './Toast'
import useStore from '../store/useStore'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useStore((s) => s.role)
  const setOpenAddPanel = useStore((s) => s.setOpenAddPanel)
  const openAddPanel = useStore((s) => s.openAddPanel)

  useEffect(() => {
    const handler = (e) => {
      // Skip if typing in an input/textarea/select
      const tag = e.target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        // Only recruitment and operations can add candidates
        if (role === 'recruitment' || role === 'operations') {
          if (location.pathname !== '/pipeline') {
            navigate('/pipeline')
          }
          setOpenAddPanel(true)
        }
      }
      if (e.key === 'Escape') {
        if (openAddPanel) setOpenAddPanel(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [role, location.pathname, openAddPanel, navigate, setOpenAddPanel])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0' }}>
      <Header />
      <Sidebar />
      <main
        style={{
          marginLeft: 220,
          marginTop: 56,
          minHeight: 'calc(100vh - 56px)',
          padding: '24px',
        }}
      >
        {children}
      </main>
      <Toast />
    </div>
  )
}
