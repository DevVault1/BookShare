import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface User {
  _id: string
  name: string
  email: string
  role: 'donor' | 'student' | 'admin'
  location?: string
  profileImage?: string
  interests?: string[]
  bio?: string
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
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
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

      register: async (formData) => {
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

      updateUser: (user) => set({ user }),

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
    { name: 'auth-store', partialize: (state) => ({ token: state.token, user: state.user }) }
  )
)
