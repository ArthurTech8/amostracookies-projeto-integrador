<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, ShoppingCart, Trash2 } from 'lucide-vue-next'
import { useConfectioneryStore } from '../stores/confectionery'
import { currency, dateLabel, todayISO } from '../utils/format'
import ConfirmDialog from './ConfirmDialog.vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { errorMessage } from '../services/http'
import { paymentLabels, type PaymentMethod } from '../services/sales.service'
import type { SaleItem } from '../types'

const store = useConfectioneryStore()
const auth = useAuthStore()
const notifications = useNotificationsStore()
const busy = ref(false)
const selectedSale = ref<string | null>(null)
const selectedId = ref('')
const quantity = ref(1)
const cart = ref<Omit<SaleItem, 'unitCost'>[]>([])
const form = reactive({ discount: 0, paymentMethod: 'pix' as PaymentMethod, date: todayISO() })
const error = ref('')
const subtotal = computed(() => cart.value.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))
const total = computed(() => Math.max(0, subtotal.value - form.discount))
const available = computed(() => store.saleOptions.filter(product => product.stock > 0))
function addItem() {
  error.value = ''
  const product = store.saleOptions.find(item => item.id === selectedId.value)
  if (!product || !Number.isInteger(quantity.value) || quantity.value < 1 || quantity.value > product.stock) {
    error.value = 'Confira o produto, a quantidade e o estoque disponível.'
    return
  }
  const existing = cart.value.find(item => item.productId === product.id)
  if (existing) {
    if (existing.quantity + quantity.value > product.stock) {
      error.value = 'A quantidade no carrinho ultrapassa o estoque disponível.'
      return
    }
    existing.quantity += quantity.value
  } else {
    cart.value.push({ productId: product.id, productName: product.name, quantity: quantity.value, unitPrice: product.price })
  }
  quantity.value = 1
}
async function finishSale() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await store.registerSale(cart.value, form.discount, form.paymentMethod, form.date)
    cart.value = []
    form.discount = 0
    form.date = todayISO()
    notifications.success('Venda registrada.')
  } catch (err) {
    notifications.error(errorMessage(err))
  } finally {
    busy.value = false
  }
}
async function removeSale() {
  if (!selectedSale.value || busy.value) return
  busy.value = true
  try {
    await store.deleteSale(selectedSale.value)
    selectedSale.value = null
    notifications.success('Venda excluída.')
  } catch (err) {
    notifications.error(errorMessage(err))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">MOVIMENTAÇÃO DA LOJA</p><h1>Vendas</h1><p class="muted">Monte a venda, escolha o pagamento e registre a saída do estoque.</p></div></div>
  <div v-if="auth.can('sales', 'operate')" class="sales-layout">
    <section class="panel sale-builder"><div class="panel-heading"><div><h2><ShoppingCart :size="19" /> Nova venda</h2><p class="muted">Adicione os produtos vendidos.</p></div></div>
      <div class="add-product-row"><label class="field grow">Produto<select v-model="selectedId"><option value="" disabled>Selecione um produto</option><option v-for="product in available" :key="product.id" :value="product.id">{{ product.name }} · {{ product.stock }} em estoque</option></select></label><label class="field qty-field">Qtd.<input v-model.number="quantity" type="number" min="1" step="1" /></label><button class="small-btn add-cart" @click="addItem"><Plus :size="17" /> Adicionar</button></div>
      <div v-if="store.saleOptionsError" class="error-message">{{ store.saleOptionsError }} <button type="button" class="small-btn" @click="store.loadSaleOptions()">Tentar novamente</button></div>
      <div v-else-if="!available.length" class="notice">Nenhum produto com estoque disponível. Cadastre um produto ou adicione estoque antes de vender.</div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="cart.length" class="cart-list"><div v-for="item in cart" :key="item.productId" class="cart-row"><div><strong>{{ item.productName }}</strong><small>{{ item.quantity }} × {{ currency(item.unitPrice) }}</small></div><strong>{{ currency(item.quantity * item.unitPrice) }}</strong><button class="icon-btn danger" @click="cart = cart.filter(i => i.productId !== item.productId)"><Trash2 :size="15" /></button></div></div><div v-else class="empty-cart">Os itens adicionados aparecerão aqui.</div>
      <div class="form-grid sale-fields"><label class="field">Data da venda<input v-model="form.date" type="date" /></label><label class="field">Forma de pagamento<select v-model="form.paymentMethod"><option v-for="(label, method) in paymentLabels" :key="method" :value="method">{{ label }}</option></select></label><label class="field">Desconto (R$)<input v-model.number="form.discount" type="number" min="0" :max="subtotal" step="0.01" /></label></div>
      <div class="sale-total"><div><span>Subtotal</span><strong>{{ currency(subtotal) }}</strong></div><div><span>Desconto</span><strong>{{ currency(form.discount) }}</strong></div><div class="grand-total"><span>Total da venda</span><strong>{{ currency(total) }}</strong></div></div>
      <button class="primary-btn full-btn" :disabled="busy || !cart.length || form.discount < 0 || form.discount > subtotal" @click="finishSale">Registrar venda</button>
    </section>
    <section class="panel"><div class="panel-heading"><div><h2>Resumo do estoque</h2><p class="muted">Disponibilidade atual</p></div></div><div v-for="product in store.saleOptions.slice(0, 6)" :key="product.id" class="stock-summary"><span>{{ product.name }}</span><strong>{{ product.stock }} un.</strong></div><p v-if="!store.saleOptions.length" class="muted">Cadastre produtos para começar.</p></section>
  </div>
  <section class="panel table-panel history-panel"><div class="panel-heading"><div><h2>Histórico de vendas</h2><p class="muted">Vendas registradas nesta instalação.</p></div></div><p v-if="store.salesError" class="error-message">{{ store.salesError }}</p><div v-else-if="store.sales.length" class="table-wrap"><table><thead><tr><th>Data</th><th>Produtos</th><th>Pagamento</th><th>Total</th><th>Ação</th></tr></thead><tbody><tr v-for="sale in [...store.sales].sort((a,b) => b.date.localeCompare(a.date))" :key="sale.id"><td>{{ dateLabel(sale.date) }}</td><td>{{ sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ') }}</td><td>{{ paymentLabels[sale.paymentMethod as PaymentMethod] ?? sale.paymentMethod }}</td><td class="table-money">{{ currency(sale.total) }}</td><td><button class="icon-btn danger" title="Excluir venda e devolver estoque" v-if="auth.user?.role === 'admin'" @click="selectedSale = sale.id"><Trash2 :size="16" /></button></td></tr></tbody></table></div><div v-else class="empty-state compact"><p>Você ainda não registrou vendas.</p></div></section>
  <ConfirmDialog :open="selectedSale !== null" title="Excluir venda"
    message="O estoque dos produtos será devolvido." confirm-label="Excluir" danger :busy="busy"
    @confirm="removeSale" @cancel="selectedSale = null" />
</template>