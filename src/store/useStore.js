import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  MOCK_JOBS,
  MOCK_APPLICATIONS,
  MOCK_CANDIDATES,
  MOCK_RECRUITERS,
  MOCK_SECTORS,
  MOCK_SENIORITIES,
  MOCK_CONTRACTS,
  MOCK_LOCATIONS
} from '../data/mock.js'

export const useStore = create(
  persist(
    (set) => ({
      session: null,
      authMode: null, // 'mock' | 'supabase'
      isDemoMode: true, // Default to true for MVP demonstration
      
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      setSession: (session) => set({ session }),
      setAuthMode: (authMode) => set({ authMode }),
      setIsDemoMode: (isDemoMode) => set({ isDemoMode }),
      
      jobs: [...MOCK_JOBS],
      setJobs: (jobs) => set({ jobs }),
      
      applications: [...MOCK_APPLICATIONS],
      setApplications: (applications) => set({ applications }),
      
      candidates: [...MOCK_CANDIDATES],
      setCandidates: (candidates) => set({ candidates }),
      
      recruiters: [...MOCK_RECRUITERS],
      setRecruiters: (recruiters) => set({ recruiters }),
      
      sectors: [...MOCK_SECTORS],
      setSectors: (sectors) => set({ sectors }),
      
      seniorities: [...MOCK_SENIORITIES],
      setSeniorities: (seniorities) => set({ seniorities }),
      
      contracts: [...MOCK_CONTRACTS],
      setContracts: (contracts) => set({ contracts }),
      
      locations: [...MOCK_LOCATIONS],
      setLocations: (locations) => set({ locations }),

      savedJobs: [], // array of jobId strings (per candidate)
      setSavedJobs: (savedJobs) => set({ savedJobs }),
      toggleSavedJob: (jobId) => set((state) => ({
        savedJobs: state.savedJobs.includes(jobId)
          ? state.savedJobs.filter(id => id !== jobId)
          : [...state.savedJobs, jobId]
      }))
    }),
    {
      name: 'pvagas-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({
        isDemoMode: state.isDemoMode,
        authMode: state.authMode,
        // Persist session so it survives page refresh (in demo mode there's no Supabase to restore from)
        session: state.session,
        savedJobs: state.savedJobs,
      }),
    }
  )
)
