<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Menu, X, CakeSlice, LogOut } from 'lucide-vue-next'
import Login from './components/Login.vue'
import NoticeHost from './components/NoticeHost.vue'
import Sidebar from './components/Sidebar.vue'
import Dashboard from './components/Dashboard.vue'
import Products from './components/Products.vue'
import ProductForm from './components/ProductForm.vue'
import Expenses from './components/Expenses.vue'
import Sales from './components/Sales.vue'
import Reports from './components/Reports.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import TeamAccess from './components/TeamAccess.vue'
import { accessService } from './services/access.service'
import { errorMessage } from './services/http'
import { useNotificationsStore } from './stores/notifications'
import { moduleLabels, type AccessModule, type Product, type Section } from './types'
import { currency, todayISO } from './utils/format'
import { useConfectioneryStore } from './stores/confectionery'
import { useAuthStore } from './stores/auth'

const current = ref<Section>('dashboard')
const editingProduct = ref<Product | null>(null)
const mobileMenu = ref(false)
const store = useConfectioneryStore()
const auth = useAuthStore()

const notifications = useNotificationsStore()
const blocked = ref<AccessModule | null>(null)
const requesting = ref(false)
let navigation = 0
const ownSales = computed(() => store.sales.filter(sale => sale.createdById === auth.user?.id))
const ownExpenses = computed(() => store.expenses.filter(expense => expense.createdById === auth.user?.id))
const sectionModules: Partial<Record<Section, AccessModule>> = {
  products: 'products', stock: 'stock', 'product-form': 'products', sales: 'sales', expenses: 'expenses', reports: 'reports',
}

function canEnter(section: Section) {
  if (section === 'team') return auth.user?.role === 'admin'
  const module = sectionModules[section]
  return !module || auth.can(module, section === 'product-form' ? 'operate' : 'view')
}

async function applyLocation() {
  if (!auth.isAuthenticated) return
  const section = window.location.hash.slice(1)
  if (isSection(section)) await navigate(section)
}

function isSection(value: string): value is Section {
  return value === 'dashboard' || value === 'team' || Object.hasOwn(sectionModules, value)
}

onMounted(() => {
  window.addEventListener('hashchange', applyLocation)
  void auth.init()
})
onUnmounted(() => window.removeEventListener('hashchange', applyLocation))

watch(() => [auth.can('products') || auth.can('stock'), auth.can('sales'), auth.can('expenses'), auth.can('sales', 'operate')], ([products, sales, expenses, saleOptions], previous) => {
  if (!canEnter(current.value)) {
    current.value = 'dashboard'
    history.replaceState(null, '', '#dashboard')
  }
  if (products !== previous?.[0]) store.setProductsAccess(products)
  if (sales !== previous?.[1]) store.setSalesAccess(sales)
  if (expenses !== previous?.[2]) store.setExpensesAccess(expenses)
  if (saleOptions !== previous?.[3]) store.setSaleOptionsAccess(saleOptions)
})

async function requestAccess() {
  if (!blocked.value || requesting.value) return
  requesting.value = true
  try {
    await accessService.request(blocked.value)
    blocked.value = null
    notifications.success('Solicitação enviada à gerência.')
  } catch (error) {
    blocked.value = null
    notifications.error(errorMessage(error))
  } finally {
    requesting.value = false
  }
}

// Ao entrar, busca os produtos da empresa; ao sair, limpa tudo da sessão anterior.
watch(() => auth.isAuthenticated, authenticated => {
  if (authenticated) {
    void applyLocation()
  } else {
    navigation++
    store.resetSession()
    blocked.value = null
    current.value = 'dashboard'
    editingProduct.value = null
    mobileMenu.value = false
  }
})
const pageTitle = computed(() => ({
  dashboard: 'Visão geral',
  products: 'Produtos',
  stock: 'Estoque',
  'product-form': editingProduct.value ? 'Editar produto' : 'Cadastrar produto',
  expenses: 'Despesas',
  sales: 'Vendas',
  reports: 'Relatórios',
  team: 'Equipe e acessos',
}[current.value]))
// Cliques no menu e links diretos passam pela mesma verificação.
async function navigate(section: Section, product: Product | null = null) {
  const request = ++navigation
  const sessionUser = auth.user?.id
  try {
    if (section !== 'dashboard') await auth.refresh()
  } catch (error) {
    if (request === navigation && auth.isAuthenticated) notifications.error(errorMessage(error))
    return
  }
  if (request !== navigation || !auth.isAuthenticated || auth.user?.id !== sessionUser) return
  if (!canEnter(section)) {
    if (auth.user?.role === 'staff') blocked.value = sectionModules[section] ?? null
    history.replaceState(null, '', '#' + current.value)
    return
  }
  if (section === 'product-form') editingProduct.value = product
  current.value = section
  history.replaceState(null, '', '#' + section)
  mobileMenu.value = false
}

function editProduct(product: Product | null) {
  void navigate('product-form', product)
}
</script>

<template>
  <NoticeHost />
  <div v-if="auth.status === 'checking'" class="login-page"><p class="muted">Carregando...</p></div>
  <Login v-else-if="!auth.isAuthenticated" />
  <div v-else class="app-layout">
    <div v-if="mobileMenu" class="mobile-overlay" @click="mobileMenu = false"></div>
    <div class="sidebar-wrap" :class="{ open: mobileMenu }"><Sidebar :current="current" :can-enter="canEnter" :is-admin="auth.user?.role === 'admin'" @navigate="navigate" /></div>
    <main class="main-area">
      <header class="topbar">
        <button class="mobile-menu-btn" aria-label="Abrir menu" @click="mobileMenu = !mobileMenu"><X v-if="mobileMenu" /><Menu v-else /></button>
        <div class="breadcrumb"><span>Doce Gestão</span><span class="crumb-divider">/</span><strong>{{ pageTitle }}</strong></div>
        <div class="topbar-right"><span class="today-label">{{ todayISO().split('-').reverse().join('/') }}</span><div class="topbar-user"><strong>{{ auth.user?.name }}</strong><small>{{ auth.user?.company?.name }}</small></div><div class="topbar-avatar"><CakeSlice :size="18" /></div><button class="icon-btn" title="Sair" aria-label="Sair" @click="auth.logout()"><LogOut :size="16" /></button></div>
      </header>
      <div class="content-area">
        <Dashboard v-if="current === 'dashboard' && auth.user?.role === 'admin'" />
        <template v-else-if="current === 'dashboard'">
          <div class="page-heading"><h1>Minhas movimentações</h1></div>
          <div class="summary-grid two">
            <section v-if="auth.can('sales')" class="metric-card">
              <h2 class="metric-top">Minhas vendas</h2>
              <p v-if="store.salesError" role="alert">{{ store.salesError }}</p>
              <template v-else>
                <strong>{{ currency(ownSales.reduce((sum, sale) => sum + sale.total, 0)) }}</strong>
                <small>{{ ownSales.length }} venda(s) registrada(s)</small>
              </template>
            </section>
            <section v-if="auth.can('expenses')" class="metric-card">
              <h2 class="metric-top">Minhas despesas</h2>
              <p v-if="store.expensesError" role="alert">{{ store.expensesError }}</p>
              <template v-else>
                <strong>{{ currency(ownExpenses.reduce((sum, expense) => sum + expense.amount, 0)) }}</strong>
                <small>{{ ownExpenses.length }} despesa(s) registrada(s)</small>
              </template>
            </section>
          </div>
          <p v-if="!auth.can('sales') && !auth.can('expenses')" class="muted">
            Selecione uma área no menu para começar.
          </p>
        </template>
        <Products v-else-if="current === 'products' || current === 'stock'" :key="current" :stock-only="current === 'stock'" @edit="editProduct" />
        <ProductForm v-else-if="current === 'product-form'" :product="editingProduct" @back="navigate('products')" />
        <Expenses v-else-if="current === 'expenses'" />
        <Sales v-else-if="current === 'sales'" />
        <Reports v-else-if="current === 'reports'" />
        <TeamAccess v-else-if="current === 'team'" />
        <footer class="app-footer"><span>♡</span> Doce Gestão — mais organização para adoçar seus resultados.</footer>
      </div>
    </main>
  </div>
  <ConfirmDialog :open="blocked !== null" title="Acesso restrito"
    :message="blocked ? 'Seu perfil precisa de autorização para acessar ' + moduleLabels[blocked] + '.' : ''"
    confirm-label="Solicitar à gerência" cancel-label="Voltar" :busy="requesting"
    @confirm="requestAccess" @cancel="blocked = null" />
</template>