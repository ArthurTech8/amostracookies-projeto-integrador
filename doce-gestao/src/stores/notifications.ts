import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NoticeKind = 'success' | 'error'

export interface Notice {
  id: number
  kind: NoticeKind
  message: string
}

const DURATION_MS = 4000

/** Avisos rápidos exibidos no canto da tela (substituem o `alert()`). */
export const useNotificationsStore = defineStore('notifications', () => {
  const notices = ref<Notice[]>([])
  let nextId = 1

  function dismiss(id: number) {
    notices.value = notices.value.filter((notice) => notice.id !== id)
  }

  function push(kind: NoticeKind, message: string) {
    const id = nextId++
    notices.value.push({ id, kind, message })
    setTimeout(() => dismiss(id), DURATION_MS)
  }

  return {
    notices,
    dismiss,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
  }
})
