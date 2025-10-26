// src/api.js
import axios from 'axios'

// Flask backend base URL (adjust if running on different host/port)
const API_URL = 'http://127.0.0.1:5000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically attach token to all requests if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
