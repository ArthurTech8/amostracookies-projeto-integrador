import { ref } from 'vue'
import { defineStore } from 'pinia'
import { AuthError, getProfile, login as authenticate } from '../services/auth'
import type { AuthProfile, LoginCredentials } from '../services/auth'

const sessionKey = 'doce-gestao.access-token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthProfile | null>(null)
  const sessionError = ref('')

  function logout() {
    sessionStorage.removeItem(sessionKey)
    user.value = null
    sessionError.value = ''
  }

  async function login(credentials: LoginCredentials) {
    const session = await authenticate(credentials)
    sessionStorage.setItem(sessionKey, session.accessToken)
    user.value = session.user
    sessionError.value = ''
  }

  async function restoreSession() {
    if (user.value) return
    const token = sessionStorage.getItem(sessionKey)
    if (!token) return

    try {
      user.value = await getProfile(token)
      sessionError.value = ''
    } catch (error) {
      if (error instanceof AuthError && (error.status === 401 || error.status === 403)) {
        logout()
        sessionError.value = 'Sua sessão expirou. Entre novamente.'
      } else {
        sessionError.value = 'Não foi possível verificar a sessão. Confira sua conexão e tente novamente.'
      }
    }
  }

  return { user, sessionError, login, logout, restoreSession }
})
