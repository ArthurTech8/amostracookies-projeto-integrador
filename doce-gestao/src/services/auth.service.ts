import type { AuthProfile } from '../types'
import { http } from './http'

export interface LoginPayload {
  companySlug: string
  username: string
  password: string
}

interface LoginResponse {
  accessToken: string
  user: AuthProfile
}

export const authService = {
  login: (payload: LoginPayload) => http.post<LoginResponse>('/auth/login', payload),
  me: () => http.get<AuthProfile>('/auth/me'),
}
