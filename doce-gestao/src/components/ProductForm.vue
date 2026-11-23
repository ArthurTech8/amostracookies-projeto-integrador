<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ArrowLeft, Save } from 'lucide-vue-next'
import type { Product, ProductInput } from '../types'
import { useConfectioneryStore } from '../stores/confectionery'
import { useNotificationsStore } from '../stores/notifications'
import { errorMessage } from '../services/http'
import { currency } from '../utils/format'

const props = defineProps<{ product: Product | null }>()
const emit = defineEmits<{ back: [] }>()
const store = useConfectioneryStore()
const notifications = useNotificationsStore()

const emptyForm = (): ProductInput => ({ name: '', category: 'Cupcakes', description: '', cost: 0, price: 0, stock: 0, minStock: 5, active: true })
const form = reactive<ProductInput>(emptyForm())
const saving = ref(false)
const error = ref<string | null>(null)
const margin = computed(() => form.price - form.cost)

watch(() => props.product, product => {
  error.value = null
  const source = product ?? emptyForm()
  Object.assign(form, {
    name: source.name, category: source.category, description: source.description, cost: source.cost,
    price: source.price, stock: source.stock, minStock: source.minStock, active: source.active,
  })
}, { immediate: true })

function validate(): string | null {
  if (!form.name.trim()) return 'Informe o nome do produto.'
  if (!(form.price > 0)) return 'O preço de venda deve ser maior que zero.'
  if (!(form.cost >= 0)) return 'O custo não pode ser negativo.'
  if (!Number.isInteger(form.stock) || form.stock < 0) return 'O estoque deve ser um número inteiro, zero ou maior.'
  if (!Number.isInteger(form.minStock) || form.minStock < 0) return 'O estoque mínimo deve ser um número inteiro, zero ou maior.'
  return null
}

const roundMoney = (value: number) => Math.round(value * 100) / 100

async function submit() {
  if (saving.value) return
  error.value = validate()
  if (error.value) return
  saving.value = true
  try {
    await store.saveProduct({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      cost: roundMoney(form.cost),
      price: roundMoney(form.price),
    }, props.product?.id)
    notifications.success('Produto salvo com sucesso!')
    emit('back')
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">CATÁLOGO DA CONFEITARIA</p><h1>{{ product ? 'Editar produto' : 'Cadastrar produto' }}</h1><p class="muted">Preencha as informações para controlar custo, preço e estoque.</p></div><button class="secondary-btn" @click="emit('back')"><ArrowLeft :size="17" /> Voltar</button></div>
  <form class="panel form-panel" @submit.prevent="submit">
    <div class="form-section-title"><span class="section-number">01</span><div><h2>Informações do produto</h2><p class="muted">Identificação e categoria</p></div></div>
    <div class="form-grid"><label class="field span-2">Nome do produto *<input v-model="form.name" required maxlength="80" placeholder="Ex.: Cupcake de chocolate" /></label><label class="field">Categoria<select v-model="form.category"><option>Cupcakes</option><option>Bolos</option><option>Docinhos</option><option>Tortas</option><option>Cookies</option><option>Bebidas</option><option>Outros</option></select></label><label class="field span-2">Descrição<textarea v-model="form.description" rows="2" maxlength="500" placeholder="Descreva o produto (opcional)" /></label></div>
    <div class="form-section-title separated"><span class="section-number">02</span><div><h2>Valores e estoque</h2><p class="muted">Esses dados alimentam os cálculos financeiros.</p></div></div>
    <div class="form-grid"><label class="field">Custo unitário (R$) *<input v-model.number="form.cost" type="number" min="0" step="0.01" required /></label><label class="field">Preço de venda (R$) *<input v-model.number="form.price" type="number" min="0.01" step="0.01" required /></label><label class="field">{{ product ? 'Estoque atual (un.)' : 'Estoque inicial (un.)' }}<input v-model.number="form.stock" type="number" min="0" step="1" /></label><label class="field">Alerta de estoque mínimo<input v-model.number="form.minStock" type="number" min="0" step="1" /></label></div>
    <div class="margin-preview"><div><small>Lucro bruto por unidade</small><strong :class="margin >= 0 ? 'positive' : 'negative'">{{ currency(margin) }}</strong></div><div><small>Margem sobre a venda</small><strong>{{ form.price > 0 ? ((margin / form.price) * 100).toFixed(1).replace('.', ',') : '0,0' }}%</strong></div></div>
    <label class="check-field"><input v-model="form.active" type="checkbox" /> Produto ativo e disponível para venda</label>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <div class="form-actions"><button type="button" class="secondary-btn" :disabled="saving" @click="emit('back')">Cancelar</button><button class="primary-btn" type="submit" :disabled="saving"><Save :size="17" /> {{ saving ? 'Salvando...' : 'Salvar produto' }}</button></div>
  </form>
</template>
