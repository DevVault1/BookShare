import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://book-share-ifb6.vercel.app/',
})

api.interceptors.request.use((config: any) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth-store')
    if (stored) {
      const parsed = JSON.parse(stored)
      const token = parsed?.state?.token
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res: any) => res,
  (err: any) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth-store')
      window.location.href = '/auth/login'
    }
    return Promise.reject(err)
  }
)

export default api
