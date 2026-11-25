<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNotificationsStore } from '../stores/notifications'

const notifications = useNotificationsStore()
const notice = computed(() => notifications.notices[0])
const dialog = ref<HTMLDialogElement>()

// O diálogo nativo mantém o foco no modal e o devolve ao fechar.
watch(notice, (current) => {
  if (current && !dialog.value?.open) dialog.value?.showModal()
  if (!current) dialog.value?.close()
}, { flush: 'post' })

function dismiss() {
  if (notice.value) notifications.dismiss(notice.value.id)
}
</script>

<template>
  <dialog ref="dialog" class="panel notice-dialog" aria-labelledby="notice-title"
    aria-describedby="notice-message" @cancel.prevent="dismiss">
    <template v-if="notice">
      <h2 id="notice-title">{{ notice.kind === 'error' ? 'Atenção' : 'Concluído' }}</h2>
      <p id="notice-message">{{ notice.message }}</p>
      <button type="button" class="primary-btn" autofocus @click="dismiss">Fechar</button>
    </template>
  </dialog>
</template>

<style scoped>
.notice-dialog { width: min(90vw, 28rem); color: inherit; margin: auto; }
.notice-dialog::backdrop { background: rgb(0 0 0 / 45%); }
.notice-dialog p { margin: 1rem 0; }
</style>
