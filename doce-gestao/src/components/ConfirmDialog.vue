<script setup lang="ts">
import { ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  cancelLabel?: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
}>(), { cancelLabel: 'Cancelar', confirmLabel: 'Confirmar', danger: false, busy: false })

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const dialog = ref<HTMLDialogElement>()
const id = useId()

// O diálogo nativo impede interação com o restante da página enquanto estiver aberto.
watch([() => props.open, dialog], ([open, element]) => {
  if (open && !element?.open) element?.showModal()
  if (!open && element?.open) element.close()
}, { flush: 'post' })

function cancel() {
  if (!props.busy) emit('cancel')
}
</script>

<template>
  <dialog ref="dialog" class="dialog panel" :aria-labelledby="id + '-title'"
    :aria-describedby="id + '-message'" @cancel.prevent="cancel">
    <h2 :id="id + '-title'">{{ title }}</h2>
    <p :id="id + '-message'" class="muted">{{ message }}</p>
    <div class="form-actions">
      <button type="button" class="secondary-btn" :disabled="busy" autofocus @click="cancel">{{ cancelLabel }}</button>
      <button type="button" class="primary-btn" :class="{ 'danger-btn': danger }" :disabled="busy" @click="emit('confirm')">
        {{ busy ? 'Aguarde...' : confirmLabel }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
dialog { margin: auto; color: inherit; max-width: calc(100vw - 2rem); }
dialog::backdrop { background: rgb(0 0 0 / 45%); }
</style>
