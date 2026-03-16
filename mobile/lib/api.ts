import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'http://localhost:5000/api' // Change to your server IP for device testing

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

export const setToken = async (token: string) => {
  await SecureStore.setItemAsync('token', token)
}

export const clearToken = async () => {
  await SecureStore.deleteItemAsync('token')
}

export default api
