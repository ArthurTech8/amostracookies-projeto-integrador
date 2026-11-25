<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, Trash2, ReceiptText } from 'lucide-vue-next'
import { useConfectioneryStore } from '../stores/confectionery'
import ConfirmDialog from './ConfirmDialog.vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { errorMessage } from '../services/http'
import type { Expense } from '../types'
import { currency, dateLabel, todayISO } from '../utils/format'

const store = useConfectioneryStore()
const form = reactive({ description: '', category: 'Contas fixas', amount: 0, date: todayISO(), recurring: false })
const auth = useAuthStore()
const notifications = useNotificationsStore()
const selected = ref<Expense | null>(null)
const busy = ref(false)
const showForm = ref(false)
const total = computed(() => store.expenses.reduce((sum, expense) => sum + expense.amount, 0))
const recurringTotal = computed(() => store.expenses.filter(expense => expense.recurring).reduce((sum, expense) => sum + expense.amount, 0))
async function submit() {
  if (busy.value || !form.description.trim() || form.amount <= 0 || !form.date) return
  busy.value = true
  try {
    await store.saveExpense({ ...form, description: form.description.trim() })
    Object.assign(form, { description: '', category: 'Contas fixas', amount: 0, date: todayISO(), recurring: false })
    showForm.value = false
    notifications.success('Despesa registrada.')
  } catch (error) {
    notifications.error(errorMessage(error))
  } finally {
    busy.value = false
  }
}
async function remove() {
  if (!selected.value || busy.value) return
  busy.value = true
  try {
    await store.deleteExpense(selected.value.id)
    selected.value = null
    notifications.success('Despesa excluída.')
  } catch (error) {
    notifications.error(errorMessage(error))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">CONTROLE FINANCEIRO</p><h1>Despesas</h1><p class="muted">Registre contas fixas e gastos variáveis da confeitaria.</p></div><button v-if="auth.can('expenses', 'operate')" class="primary-btn" @click="showForm = !showForm"><Plus :size="18" /> Nova despesa</button></div>
  <div class="summary-grid two"><article class="metric-card"><div class="metric-top"><span>Total cadastrado</span><span class="metric-icon peach"><ReceiptText :size="18" /></span></div><strong>{{ currency(total) }}</strong><small>Soma dos lançamentos registrados</small></article><article class="metric-card"><div class="metric-top"><span>Despesas recorrentes</span><span class="metric-icon pink"><ReceiptText :size="18" /></span></div><strong>{{ currency(recurringTotal) }}</strong><small>Contas marcadas como fixas/recorrentes</small></article></div>
  <form v-if="showForm && auth.can('expenses', 'operate')" class="panel inline-form" @submit.prevent="submit"><div class="panel-heading"><div><h2>Adicionar despesa</h2><p class="muted">Informe os dados do gasto.</p></div></div><div class="form-grid"><label class="field span-2">Descrição *<input v-model="form.description" required placeholder="Ex.: Compra de embalagens" /></label><label class="field">Categoria<select v-model="form.category"><option>Contas fixas</option><option>Ingredientes</option><option>Embalagens</option><option>Transporte</option><option>Manutenção</option><option>Outros</option></select></label><label class="field">Valor (R$) *<input v-model.number="form.amount" type="number" min="0.01" step="0.01" required /></label><label class="field">Data *<input v-model="form.date" type="date" required /></label><label class="check-field align-end"><input v-model="form.recurring" type="checkbox" /> Despesa fixa/recorrente</label></div><div class="form-actions"><button type="button" class="secondary-btn" @click="showForm = false">Cancelar</button><button class="primary-btn" type="submit" :disabled="busy">Salvar despesa</button></div></form>
  <section class="panel table-panel"><div class="panel-heading"><div><h2>Histórico de despesas</h2></div></div><p v-if="store.expensesError" role="alert">{{ store.expensesError }}</p><div v-else-if="store.expenses.length" class="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Tipo</th><th>Valor</th><th>Ação</th></tr></thead><tbody><tr v-for="expense in [...store.expenses].sort((a,b) => b.date.localeCompare(a.date))" :key="expense.id"><td><strong>{{ expense.description }}</strong></td><td>{{ expense.category }}</td><td>{{ dateLabel(expense.date) }}</td><td><span class="status" :class="{ recurring: expense.recurring }">{{ expense.recurring ? 'Recorrente' : 'Variável' }}</span></td><td class="table-money">{{ currency(expense.amount) }}</td><td><button class="icon-btn danger" title="Excluir" v-if="auth.can('expenses', 'operate')" @click="selected = expense"><Trash2 :size="16" /></button></td></tr></tbody></table></div><div v-else class="empty-state"><p>Nenhuma despesa cadastrada.</p></div></section>
  <ConfirmDialog :open="selected !== null" title="Excluir despesa"
    :message="selected?.description ?? ''" confirm-label="Excluir" danger :busy="busy"
    @confirm="remove" @cancel="selected = null" />
</template>