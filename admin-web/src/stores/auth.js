import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminAuthAPI } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const adminInfo = ref(JSON.parse(localStorage.getItem('admin_info') || 'null'))

  const isLoggedIn = () => !!token.value

  async function login(username, password) {
    const res = await adminAuthAPI.login({ username, password })
    token.value = res.data.token
    adminInfo.value = res.data.admin
    localStorage.setItem('admin_token', res.data.token)
    localStorage.setItem('admin_info', JSON.stringify(res.data.admin))
    return res
  }

  function logout() {
    token.value = ''
    adminInfo.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_info')
  }

  async function fetchProfile() {
    const res = await adminAuthAPI.getProfile()
    adminInfo.value = res.data
    localStorage.setItem('admin_info', JSON.stringify(res.data))
    return res.data
  }

  return { token, adminInfo, isLoggedIn, login, logout, fetchProfile }
})
