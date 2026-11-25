<script setup lang="ts">
import { computed, ref } from 'vue'
import { PackagePlus, Pencil, Trash2, Plus, Search, RefreshCw } from 'lucide-vue-next'
import ConfirmDialog from './ConfirmDialog.vue'
import { useConfectioneryStore } from '../stores/confectionery'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { errorMessage } from '../services/http'
import { currency } from '../utils/format'
import type { Product } from '../types'

defineProps<{ stockOnly?: boolean }>()
const store = useConfectioneryStore()
const auth = useAuthStore()
const notifications = useNotificationsStore()
const emit = defineEmits<{ edit: [product: Product | null] }>()
const search = ref('')
const stockInput = ref<Record<string, string>>({})
const stockBusy = ref<Record<string, boolean>>({})
const toDeactivate = ref<Product | null>(null)
const deactivating = ref(false)

const filtered = computed(() => store.products.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase())))

async function replenish(product: Product) {
  const quantity = Number(stockInput.value[product.id])
  if (!Number.isInteger(quantity) || quantity <= 0) {
    notifications.error('Informe uma quantidade inteira maior que zero.')
    return
  }
  stockBusy.value[product.id] = true
  try {
    await store.addStock(product.id, quantity)
    stockInput.value[product.id] = ''
    notifications.success(`${quantity} un. adicionada(s) ao estoque de ${product.name}.`)
  } catch (error) {
    notifications.error(errorMessage(error))
  } finally {
    stockBusy.value[product.id] = false
  }
}

async function confirmDeactivate() {
  if (!toDeactivate.value) return
  deactivating.value = true
  try {
    await store.deleteProduct(toDeactivate.value.id)
    notifications.success(`"${toDeactivate.value.name}" foi desativado.`)
    toDeactivate.value = null
  } catch (error) {
    notifications.error(errorMessage(error))
  } finally {
    deactivating.value = false
  }
}
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">CATÁLOGO DA CONFEITARIA</p><h1>{{ stockOnly ? 'Estoque' : 'Produtos' }}</h1></div><button v-if="!stockOnly && auth.can('products', 'operate')" class="primary-btn" @click="emit('edit', null)"><Plus :size="18" /> Novo produto</button></div>
  <div class="toolbar"><label class="search-box"><Search :size="18" /><input v-model="search" placeholder="Buscar produto..." /></label><span class="muted">{{ store.products.length }} produto(s) cadastrado(s)</span></div>
  <section class="panel table-panel">
    <div v-if="store.productsStatus === 'loading'" class="empty-state"><strong>Carregando produtos...</strong></div>
    <div v-else-if="store.productsStatus === 'error'" class="empty-state"><strong>Não foi possível carregar os produtos</strong><p>{{ store.productsError }}</p><button class="small-btn" @click="store.loadProducts()"><RefreshCw :size="14" /> Tentar de novo</button></div>
    <div v-else-if="filtered.length" class="table-wrap">
      <table><thead><tr><th>Produto</th><th>Categoria</th><th v-if="!stockOnly">Custo</th><th v-if="!stockOnly">Venda</th><th v-if="!stockOnly">Margem bruta</th><th v-if="stockOnly">Estoque</th><th>Status</th><th v-if="!stockOnly">Ações</th></tr></thead>
        <tbody><tr v-for="product in filtered" :key="product.id">
          <td><strong>{{ product.name }}</strong><small class="table-sub">{{ product.description || 'Sem descrição' }}</small></td><td>{{ product.category }}</td><td v-if="!stockOnly">{{ currency(product.cost) }}</td><td v-if="!stockOnly">{{ currency(product.price) }}</td><td v-if="!stockOnly" class="positive">{{ currency(product.price - product.cost) }}</td><td v-if="stockOnly"><span class="stock-pill" :class="{ low: product.stock <= product.minStock }">{{ product.stock }} un.</span></td><td><span class="status" :class="{ inactive: !product.active }">{{ product.active ? 'Ativo' : 'Inativo' }}</span></td>
          <td v-if="!stockOnly"><div v-if="auth.can('products', 'operate')" class="action-buttons"><button class="icon-btn" title="Editar" @click="emit('edit', product)"><Pencil :size="16" /></button><button v-if="product.active" class="icon-btn danger" title="Desativar" @click="toDeactivate = product"><Trash2 :size="16" /></button></div></td>
        </tr></tbody>
      </table>
    </div>
    <div v-else class="empty-state"><div class="empty-icon"><PackagePlus /></div><strong>Nenhum produto encontrado</strong><p>Cadastre um produto para começar a organizar seu estoque.</p></div>
  </section>
  <section v-if="stockOnly && auth.can('stock', 'operate')" class="panel replenish-panel"><div class="panel-heading"><div><h2>Entrada de estoque</h2><p class="muted">Registre ingredientes prontos ou produtos produzidos para venda.</p></div></div>
    <div class="replenish-grid"><div v-for="product in store.activeProducts" :key="product.id" class="replenish-item"><div><strong>{{ product.name }}</strong><small>Estoque atual: {{ product.stock }} un.</small></div><div class="replenish-controls"><input v-model="stockInput[product.id]" type="number" min="1" step="1" placeholder="Qtd." :disabled="stockBusy[product.id]" @keyup.enter="replenish(product)" /><button class="small-btn" :disabled="stockBusy[product.id]" @click="replenish(product)">{{ stockBusy[product.id] ? '...' : 'Adicionar' }}</button></div></div></div>
  </section>
  <ConfirmDialog
    :open="toDeactivate !== null"
    title="Desativar produto"
    :message="`“${toDeactivate?.name ?? ''}” ficará inativo e sairá da lista de vendas. O histórico é mantido e você pode reativá-lo editando o produto.`"
    confirm-label="Desativar"
    danger
    :busy="deactivating"
    @confirm="confirmDeactivate"
    @cancel="toDeactivate = null"
  />
</template>
