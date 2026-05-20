import { create } from 'zustand'
import { OFFICES } from '../data/offices'

let toastId = 0

// User-specific preferences stay in localStorage (not shared between users)
const savedRole = localStorage.getItem('ats-role')
const savedLang = localStorage.getItem('ats-lang') || 'EN'
const savedOffices = JSON.parse(localStorage.getItem('ats-offices') || '[]')
const savedManagers = JSON.parse(localStorage.getItem('ats-managers') || 'null')

function fire(path, method, body) {
  fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(err => console.warn('API sync error:', err))
}

const useStore = create((set, get) => ({
  role: savedRole,
  language: savedLang,
  candidates: [],
  doNotHireList: [],
  managers: savedManagers || OFFICES.map(o => ({ ...o })),
  assignedOffices: savedOffices,
  toasts: [],
  openAddPanel: false,
  editingCandidateId: null,
  initialized: false,
  initError: false,

  // Called once on app load — fetches all shared data from D1
  initializeFromServer: async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/dnh'),
      ])

      if (!cRes.ok || !dRes.ok) throw new Error('API returned error')

      const serverCandidates = await cRes.json()
      const serverDnh = await dRes.json()

      // One-time migration: if server is empty and old localStorage data exists
      if (serverCandidates.length === 0) {
        const raw = localStorage.getItem('ats-store')
        if (raw) {
          try {
            const { state } = JSON.parse(raw)
            const lc = state?.candidates || []
            const ld = state?.doNotHireList || []
            if (lc.length > 0) {
              await Promise.all([
                fetch('/api/candidates/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lc) }),
                ld.length > 0 && fetch('/api/dnh/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ld) }),
              ])
              set({ candidates: lc, doNotHireList: ld, initialized: true })
              localStorage.removeItem('ats-store')
              return
            }
          } catch (_) {}
        }
      }

      set({
        candidates: Array.isArray(serverCandidates) ? serverCandidates : [],
        doNotHireList: Array.isArray(serverDnh) ? serverDnh : [],
        initialized: true,
      })
    } catch (err) {
      console.error('Failed to load from server:', err)
      set({ initialized: true, initError: true })
    }
  },

  setRole: (role) => { localStorage.setItem('ats-role', role); set({ role }) },
  setLanguage: (lang) => { localStorage.setItem('ats-lang', lang); set({ language: lang }) },
  setAssignedOffices: (codes) => { localStorage.setItem('ats-offices', JSON.stringify(codes)); set({ assignedOffices: codes }) },
  setOpenAddPanel: (open, candidateId = null) => set({ openAddPanel: open, editingCandidateId: candidateId }),

  addCandidate: (candidate) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    const c = { ...candidate, id, createdAt: new Date().toISOString() }
    set(s => ({ candidates: [c, ...s.candidates] }))
    fire('/api/candidates', 'POST', c)
    return id
  },

  updateCandidate: (id, updates) => {
    set(s => ({
      candidates: s.candidates.map(c => {
        if (c.id !== id) return c
        const merged = { ...c, ...updates }
        if (updates.status === 'Hired' && !c.hiredAt) merged.hiredAt = new Date().toISOString()
        return merged
      }),
    }))
    const updated = get().candidates.find(c => c.id === id)
    if (updated) fire(`/api/candidates/${id}`, 'PUT', updated)
  },

  deleteCandidate: (id) => {
    set(s => ({ candidates: s.candidates.filter(c => c.id !== id) }))
    fire(`/api/candidates/${id}`, 'DELETE')
  },

  addToDoNotHire: (entry) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    const e = { ...entry, id, dateAdded: new Date().toISOString() }
    set(s => ({ doNotHireList: [e, ...s.doNotHireList] }))
    fire('/api/dnh', 'POST', e)
  },

  removeFromDoNotHire: (id) => {
    set(s => ({ doNotHireList: s.doNotHireList.filter(d => d.id !== id) }))
    fire(`/api/dnh/${id}`, 'DELETE')
  },

  importHistoricalCandidates: async (records) => {
    const state = get()
    const existingPayrolls = new Set(state.candidates.map(c => c.payrollId).filter(Boolean))
    const existingPhones = new Set(state.candidates.map(c => (c.phone || '').replace(/\D/g, '')).filter(Boolean))
    const toAdd = records.filter(r => {
      if (r.payrollId && existingPayrolls.has(r.payrollId)) return false
      const ph = (r.phone || '').replace(/\D/g, '')
      if (ph && existingPhones.has(ph)) return false
      return true
    })
    set(s => ({ candidates: [...s.candidates, ...toAdd] }))
    await fetch('/api/candidates/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toAdd),
    })
    return toAdd.length
  },

  updateManager: (code, updates) => {
    set(s => ({
      managers: s.managers.map(m => m.code === code ? { ...m, ...updates } : m),
    }))
    const updated = get().managers
    localStorage.setItem('ats-managers', JSON.stringify(updated))
  },

  addToast: (message, type = 'success') => {
    const id = ++toastId
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3000)
  },

  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export default useStore
