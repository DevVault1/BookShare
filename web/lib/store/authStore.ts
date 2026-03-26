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

export interface User {
  _id: string
  name: string
  email: string
  role: 'donor' | 'student' | 'admin'
  location?: string
  phoneNumber?: string
  profileImage?: string
  interests?: string[]
  bio?: string
  authProvider?: 'local' | 'google' | 'facebook' | 'hybrid'
  twoFactorEnabled?: boolean
  twoFactorMethod?: 'email' | 'sms'
  donorReputation?: DonorReputation
}

interface RegisterData {
  name: string
  email: string
  password: string
  role: string
  location?: string
  phoneNumber?: string
}

interface LoginResponse {
  token?: string
  user?: User
  requiresTwoFactor?: boolean
  pendingToken?: string
  method?: 'email' | 'sms'
  destinationHint?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  register: (data: RegisterData) => Promise<LoginResponse>
  verifyTwoFactorLogin: (pendingToken: string, code: string) => Promise<LoginResponse>
  resendTwoFactorLogin: (pendingToken: string) => Promise<LoginResponse>
  logout: () => void
  updateUser: (user: User) => void
  setSession: (user: User, token: string) => void
  hydrateSessionFromToken: (token: string) => Promise<User>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set: any, get: any) => ({
      user: null,
      token: null,
      isLoading: false,

      setSession: (user: User, token: string) => {
        set({ user, token, isLoading: false })
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },

      hydrateSessionFromToken: async (token: string) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const { data } = await axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
        set({ user: data, token, isLoading: false })
        return data
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post(`${API}/login`, { email, password })
          if (data.token && data.user) {
            set({ user: data.user, token: data.token, isLoading: false })
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          } else {
            set({ isLoading: false })
          }
          return data
        } catch (err: any) {
          set({ isLoading: false })
          throw new Error(err.response?.data?.message || 'Login failed')
        }
      },

      register: async (formData: RegisterData) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post(`${API}/register`, formData)
          if (data.token && data.user) {
            set({ user: data.user, token: data.token, isLoading: false })
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          } else {
            set({ isLoading: false })
          }
          return data
        } catch (err: any) {
          set({ isLoading: false })
          throw new Error(err.response?.data?.message || 'Registration failed')
        }
      },

      verifyTwoFactorLogin: async (pendingToken: string, code: string) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post(`${API}/login/verify-2fa`, { pendingToken, code })
          if (data.token && data.user) {
            set({ user: data.user, token: data.token, isLoading: false })
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          } else {
            set({ isLoading: false })
          }
          return data
        } catch (err: any) {
          set({ isLoading: false })
          throw new Error(err.response?.data?.message || 'Verification failed')
        }
      },

      resendTwoFactorLogin: async (pendingToken: string) => {
        const { data } = await axios.post(`${API}/login/resend-2fa`, { pendingToken })
        return data
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
