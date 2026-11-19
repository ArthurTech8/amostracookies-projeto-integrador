<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CakeSlice, Eye, EyeOff } from 'lucide-vue-next'
import { AuthError } from '../services/auth'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const companySlug = ref('')
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const pending = ref(false)
const errorMessage = ref('')

async function submit() {
  if (pending.value) return
  errorMessage.value = ''
  auth.sessionError = ''

  if (!companySlug.value || !username.value || !password.value) {
    errorMessage.value = 'Preencha o código da empresa, o usuário e a senha.'
    return
  }

  pending.value = true
  try {
    await auth.login({
      companySlug: companySlug.value,
      username: username.value,
      password: password.value,
    })
    password.value = ''
    await router.replace({ name: 'dashboard' })
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) {
      errorMessage.value = 'Empresa, usuário ou senha inválidos.'
    } else if (error instanceof AuthError && error.status === 400) {
      errorMessage.value = 'Confira os campos e tente novamente.'
    } else {
      errorMessage.value = 'Não foi possível entrar. Confira sua conexão e tente novamente.'
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card" aria-labelledby="login-title">
      <div class="login-brand">
        <span class="brand-icon"><CakeSlice :size="23" aria-hidden="true" /></span>
        <strong>Doce Gestão</strong>
      </div>
      <h1 id="login-title">Entre na sua conta</h1>
      <form :aria-busy="pending" @submit.prevent="submit">
        <label class="field">
          Código da empresa
          <input v-model.trim="companySlug" name="company" maxlength="60" autocomplete="organization"
            autocapitalize="none" spellcheck="false" required />
        </label>
        <label class="field">
          Usuário
          <input v-model.trim="username" name="username" autocomplete="username"
            autocapitalize="none" spellcheck="false" required />
        </label>
        <div class="field">
          <label for="login-password">Senha</label>
          <div class="password-field">
            <input id="login-password" v-model="password" name="password"
              :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required />
            <button type="button" class="password-toggle"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              @click="showPassword = !showPassword">
              <EyeOff v-if="showPassword" :size="19" aria-hidden="true" />
              <Eye v-else :size="19" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p v-if="errorMessage || auth.sessionError" class="error-message" role="alert">
          {{ errorMessage || auth.sessionError }}
        </p>
        <button class="primary-btn login-submit" type="submit" :disabled="pending">
          {{ pending ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px 16px;
  background: radial-gradient(ellipse at top, var(--pink-soft), transparent 70%);
}

.login-card {
  width: min(100%, 420px);
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #fff;
  box-shadow: var(--shadow);
  padding: clamp(24px, 6vw, 40px);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(26px, 6vw, 34px);
  margin: 24px 0;
}

form {
  display: grid;
  gap: 16px;
}

.field, .error-message {
  font-size: 14px;
}

.field input {
  min-height: 46px;
  font-size: 16px;
}

.password-field {
  position: relative;
}

.password-field input {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  inset: 0 0 0 auto;
  width: 46px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ink);
}

.error-message {
  margin: 0;
}

.login-submit {
  min-height: 46px;
  font-size: 15px;
  background: #a74669;
  border-color: #a74669;
}

.login-submit:hover {
  background: #923b5b;
}

button:focus-visible {
  outline: 2px solid #923b5b;
  outline-offset: 3px;
}
</style>
