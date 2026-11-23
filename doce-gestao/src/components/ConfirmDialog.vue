<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

/** Caixa de confirmação do projeto (substitui o `confirm()` do navegador). */
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
}>(), { confirmLabel: 'Confirmar', danger: false, busy: false })

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const cancelButton = ref<HTMLButtonElement | null>(null)

watch(() => props.open, async open => {
  if (open) {
    await nextTick()
    cancelButton.value?.focus()
  }
})

function cancel() {
  if (!props.busy) emit('cancel')
}
</script>

<template>
  <div v-if="open" class="dialog-backdrop" @click.self="cancel" @keydown.esc="cancel">
    <div class="dialog panel" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <h2 id="confirm-title">{{ title }}</h2>
      <p id="confirm-message" class="muted">{{ message }}</p>
      <div class="form-actions">
        <button ref="cancelButton" type="button" class="secondary-btn" :disabled="busy" @click="cancel">Cancelar</button>
        <button type="button" class="primary-btn" :class="{ 'danger-btn': danger }" :disabled="busy" @click="emit('confirm')">
          {{ busy ? 'Aguarde...' : confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
