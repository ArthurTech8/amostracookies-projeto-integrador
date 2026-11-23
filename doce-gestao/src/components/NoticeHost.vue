<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useNotificationsStore } from '../stores/notifications'

/** Mostra os avisos rápidos (substitui o `alert()` do navegador). */
const notifications = useNotificationsStore()
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <div v-for="notice in notifications.notices" :key="notice.id" class="toast" :class="notice.kind" :role="notice.kind === 'error' ? 'alert' : 'status'">
      <span>{{ notice.message }}</span>
      <button class="toast-close" aria-label="Fechar aviso" @click="notifications.dismiss(notice.id)"><X :size="14" /></button>
    </div>
  </div>
</template>
