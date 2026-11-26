const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '')

export interface LoginCredentials {
  companySlug: string
  username: string
  password: string
}

export interface AuthProfile {
  id: string
  name: string
  username: string
  role: string
  company: { id: string; name: string; slug: string } | null
}

interface LoginResponse {
  accessToken: string
  user: AuthProfile
}

export class AuthError extends Error {
  constructor(readonly status: number) {
    super('Falha na autenticação.')
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(apiUrl + path, options)
  if (!response.ok) throw new AuthError(response.status)
  return response.json()
}

export function login(credentials: LoginCredentials) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function getProfile(token: string) {
  return request<AuthProfile>('/auth/me', {
    headers: { Authorization: 'Bearer ' + token },
  })
}
