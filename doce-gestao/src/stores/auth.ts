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
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService, type LoginPayload } from '../services/auth.service'
import { ApiError, onUnauthorized, tokenStorage } from '../services/http'
import type { AuthProfile } from '../types'

type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthProfile | null>(null)
  const status = ref<AuthStatus>('checking')
  /** Mensagem exibida na tela de login (ex.: sessão expirada). */
  const sessionMessage = ref<string | null>(null)

  const isAuthenticated = computed(() => status.value === 'authenticated')

  function clearSession(message: string | null = null) {
    tokenStorage.clear()
    user.value = null
    status.value = 'anonymous'
    sessionMessage.value = message
  }

  onUnauthorized(() => clearSession('Sua sessão expirou. Entre novamente.'))

  /** Restaura a sessão salva, se o token ainda for válido. */
  async function init() {
    if (!tokenStorage.get()) {
      status.value = 'anonymous'
      return
    }
    try {
      user.value = await authService.me()
      status.value = 'authenticated'
    } catch (error) {
      clearSession(
        error instanceof ApiError && error.status === 0
          ? error.message
          : 'Sua sessão expirou. Entre novamente.',
      )
    }
  }

  async function login(payload: LoginPayload) {
    const response = await authService.login(payload)
    tokenStorage.set(response.accessToken)
    user.value = response.user
    sessionMessage.value = null
    status.value = 'authenticated'
  }

  function logout() {
    clearSession()
  }

  return { user, status, sessionMessage, isAuthenticated, init, login, logout }
})
