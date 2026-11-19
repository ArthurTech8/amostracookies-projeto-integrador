import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../DashboardLayout.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/auth'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'dashboard', component: DashboardLayout },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.restoreSession()

  if (!auth.user && to.name === 'dashboard') return { name: 'login' }
  if (auth.user && to.name === 'login') return { name: 'dashboard' }
})
