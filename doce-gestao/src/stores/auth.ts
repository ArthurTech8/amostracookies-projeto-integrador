import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService, type LoginPayload } from '../services/auth.service'
import { ApiError, onUnauthorized, tokenStorage } from '../services/http'
import type { AccessLevel, AccessModule, AuthProfile } from '../types'

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

  // O menu reflete a política atual; o servidor também verifica cada operação.
  function can(module: AccessModule, required: AccessLevel = 'view') {
    if (user.value?.role === 'admin') return true
    const level = user.value?.permissions?.[module]
    return level === 'operate' || (level === 'view' && required === 'view')
  }

  async function refresh() {
    const current = user.value
    const updated = await authService.me()
    if (user.value === current) user.value = updated
  }

  function logout() {
    clearSession()
  }

  return { user, status, sessionMessage, isAuthenticated, can, refresh, init, login, logout }
})
