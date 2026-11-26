<script setup lang="ts">
import { reactive, ref } from 'vue'
import { CakeSlice, LogIn } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { errorMessage } from '../services/http'

const auth = useAuthStore()
const form = reactive({ companySlug: '', username: '', password: '' })
const submitting = ref(false)
const error = ref<string | null>(null)

async function submit() {
  if (submitting.value) return
  if (!form.companySlug.trim() || !form.username.trim() || !form.password) {
    error.value = 'Preencha o código da empresa, o usuário e a senha.'
    return
  }
  submitting.value = true
  error.value = null
  try {
    await auth.login({
      companySlug: form.companySlug.trim(),
      username: form.username.trim(),
      password: form.password,
    })
  } catch (err) {
    error.value = errorMessage(err)
    form.password = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <form class="login-card panel" novalidate @submit.prevent="submit">
      <div class="brand login-brand">
        <div class="brand-icon"><CakeSlice :size="23" /></div>
        <div><strong>doce<span>gestão</span></strong><small>PAINEL DA CONFEITARIA</small></div>
      </div>
      <h1>Entrar</h1>
      <p class="muted">Use o código da sua empresa e o seu usuário.</p>
      <p v-if="auth.sessionMessage && !error" class="notice">{{ auth.sessionMessage }}</p>
      <label class="field">Código da empresa
        <input v-model="form.companySlug" autocomplete="organization" autocapitalize="none" spellcheck="false" placeholder="Ex.: doce-da-ana" required />
      </label>
      <label class="field">Usuário
        <input v-model="form.username" autocomplete="username" autocapitalize="none" spellcheck="false" required />
      </label>
      <label class="field">Senha
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <button class="primary-btn full-btn" type="submit" :disabled="submitting">
        <LogIn :size="17" /> {{ submitting ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </main>
</template>
