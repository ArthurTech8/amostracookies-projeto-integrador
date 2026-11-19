<script setup lang="ts">
import { computed, ref } from 'vue'
import { Menu, X, CakeSlice } from 'lucide-vue-next'
import Sidebar from './components/Sidebar.vue'
import Dashboard from './components/Dashboard.vue'
import Products from './components/Products.vue'
import ProductForm from './components/ProductForm.vue'
import Expenses from './components/Expenses.vue'
import Sales from './components/Sales.vue'
import Reports from './components/Reports.vue'
import type { Product, Section } from './types'
import { todayISO } from './utils/format'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const current = ref<Section>('dashboard')
const editingProduct = ref<Product | null>(null)
const mobileMenu = ref(false)
const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  void router.replace({ name: 'login' })
}
const pageTitle = computed(() => ({
  dashboard: 'Visão geral',
  products: 'Produtos e estoque',
  'product-form': editingProduct.value ? 'Editar produto' : 'Cadastrar produto',
  expenses: 'Despesas',
  sales: 'Vendas',
  reports: 'Relatórios',
}[current.value]))
function navigate(section: Section) {
  if (section === 'product-form') editingProduct.value = null
  current.value = section
  mobileMenu.value = false
}
function editProduct(product: Product | null) {
  editingProduct.value = product
  current.value = 'product-form'
}
</script>

<template>
  <div class="app-layout">
    <div v-if="mobileMenu" class="mobile-overlay" @click="mobileMenu = false"></div>
    <div class="sidebar-wrap" :class="{ open: mobileMenu }"><Sidebar :current="current" @navigate="navigate" /></div>
    <main class="main-area">
      <header class="topbar">
        <button class="mobile-menu-btn" aria-label="Abrir menu" @click="mobileMenu = !mobileMenu"><X v-if="mobileMenu" /><Menu v-else /></button>
        <div class="breadcrumb"><span>Doce Gestão</span><span class="crumb-divider">/</span><strong>{{ pageTitle }}</strong></div>
        <div class="topbar-right"><span class="today-label">{{ todayISO().split('-').reverse().join('/') }}</span><div class="topbar-avatar"><CakeSlice :size="18" /></div><button class="secondary-btn" type="button" @click="logout">Sair</button></div>
      </header>
      <div class="content-area">
        <Dashboard v-if="current === 'dashboard'" />
        <Products v-else-if="current === 'products'" @edit="editProduct" />
        <ProductForm v-else-if="current === 'product-form'" :product="editingProduct" @back="current = 'products'" />
        <Expenses v-else-if="current === 'expenses'" />
        <Sales v-else-if="current === 'sales'" />
        <Reports v-else-if="current === 'reports'" />
        <footer class="app-footer"><span>♡</span> Doce Gestão — mais organização para adoçar seus resultados.</footer>
      </div>
    </main>
  </div>
</template>