import { create } from 'zustand'
import api, { setToken, clearToken } from '../lib/api'

interface User {
  _id: string
  name: string
  email: string
  role: string
  location?: string
  profileImage?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/login', { email, password })
      await setToken(data.token)
      set({ user: data.user, isLoading: false })
    } catch (err: any) {
      set({ isLoading: false })
      throw new Error(err.response?.data?.message || 'Login failed')
    }
  },

  register: async (formData) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/register', formData)
      await setToken(data.token)
      set({ user: data.user, isLoading: false })
    } catch (err: any) {
      set({ isLoading: false })
      throw new Error(err.response?.data?.message || 'Registration failed')
    }
  },

  logout: async () => {
    await clearToken()
    set({ user: null })
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/me')
      set({ user: data })
    } catch {
      await clearToken()
      set({ user: null })
    }
  },
}))
