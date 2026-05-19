import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OFFICES } from '../data/offices'

let toastId = 0

const useStore = create(
  persist(
    (set, get) => ({
      role: null,
      language: 'EN',
      candidates: [],
      doNotHireList: [],
      managers: OFFICES.map(o => ({ ...o })),
      assignedOffices: [],
      toasts: [],
      openAddPanel: false,
      editingCandidateId: null,

      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      setAssignedOffices: (codes) => set({ assignedOffices: codes }),
      setOpenAddPanel: (open, candidateId = null) =>
        set({ openAddPanel: open, editingCandidateId: candidateId }),

      addCandidate: (candidate) => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2)
        set((state) => ({
          candidates: [{ ...candidate, id, createdAt: new Date().toISOString() }, ...state.candidates],
        }))
        return id
      },

      updateCandidate: (id, updates) =>
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id !== id) return c
            const merged = { ...c, ...updates }
            if (updates.status === 'Hired' && !c.hiredAt) {
              merged.hiredAt = new Date().toISOString()
            }
            return merged
          }),
        })),

      deleteCandidate: (id) =>
        set((state) => ({
          candidates: state.candidates.filter((c) => c.id !== id),
        })),

      addToDoNotHire: (entry) => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2)
        set((state) => ({
          doNotHireList: [{ ...entry, id, dateAdded: new Date().toISOString() }, ...state.doNotHireList],
        }))
      },

      removeFromDoNotHire: (id) =>
        set((state) => ({
          doNotHireList: state.doNotHireList.filter((d) => d.id !== id),
        })),

      updateManager: (code, updates) =>
        set((state) => ({
          managers: state.managers.map((m) =>
            m.code === code ? { ...m, ...updates } : m
          ),
        })),

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
        }, 3000)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'ats-store',
      partialize: (state) => ({
        role: state.role,
        language: state.language,
        candidates: state.candidates,
        doNotHireList: state.doNotHireList,
        managers: state.managers,
        assignedOffices: state.assignedOffices,
      }),
    }
  )
)

export default useStore
