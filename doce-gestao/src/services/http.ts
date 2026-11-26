const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '')
const TOKEN_KEY = 'doce-gestao-token'
const GENERIC_ERROR = 'Não foi possível concluir a operação. Tente novamente.'

/** Erro devolvido pela API, com a mensagem em português pronta para exibir. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Token de sessão. É o único dado guardado no localStorage pelo cliente HTTP. */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Sem armazenamento disponível, a sessão dura só enquanto a página estiver aberta.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Nada a limpar.
    }
  },
}

let unauthorizedHandler: (() => void) | null = null

/** Registra o que fazer quando a API recusar o token (sessão expirada ou usuário desativado). */
export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

function extractMessage(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body
    if (typeof message === 'string') return message
    if (Array.isArray(message)) {
      const texts = message.filter((item): item is string => typeof item === 'string')
      if (texts.length) return texts.join(' ')
    }
  }
  return GENERIC_ERROR
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = tokenStorage.get()
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se a API está rodando.', 0)
  }

  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && token) unauthorizedHandler?.()
    throw new ApiError(extractMessage(data), response.status)
  }
  return data as T
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

/** Mensagem amigável para qualquer erro capturado em um `catch`. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : GENERIC_ERROR
}
