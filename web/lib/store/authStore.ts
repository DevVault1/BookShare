import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

interface DonorReputation {
  overallScore?: number
  responseSpeedScore?: number
  accuracyScore?: number
  receiverFeedbackScore?: number
  totalReviewedDonations?: number
  respondedRequests?: number
  avgResponseHours?: number
  lastCalculatedAt?: string
}

interface User {
  _id: string
  name: string
  email: string
  role: 'donor' | 'student' | 'admin'
  location?: string
  profileImage?: string
  interests?: string[]
  bio?: string
  donorReputation?: DonorReputation
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  fetchMe: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  role: string
  location?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set: any, get: any) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post(`${API}/login`, { email, password })
          set({ user: data.user, token: data.token, isLoading: false })
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        } catch (err: any) {
          set({ isLoading: false })
          throw new Error(err.response?.data?.message || 'Login failed')
        }
      },

      register: async (formData: RegisterData) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post(`${API}/register`, formData)
          set({ user: data.user, token: data.token, isLoading: false })
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        } catch (err: any) {
          set({ isLoading: false })
          throw new Error(err.response?.data?.message || 'Registration failed')
        }
      },

      logout: () => {
        set({ user: null, token: null })
        delete axios.defaults.headers.common['Authorization']
      },

      updateUser: (user: User) => set({ user }),

      fetchMe: async () => {
        const token = get().token
        if (!token) return
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const { data } = await axios.get(`${API}/me`)
          set({ user: data })
        } catch {
          set({ user: null, token: null })
        }
      },
    }),
    { name: 'auth-store', partialize: (state: AuthState) => ({ token: state.token, user: state.user }) }
  )
)
