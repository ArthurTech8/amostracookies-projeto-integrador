<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { accessService, type AccessRequest, type TeamUser } from '../services/access.service'
import { productActionLabels, productsService, type ProductMovement } from '../services/products.service'
import { errorMessage } from '../services/http'
import { useConfectioneryStore } from '../stores/confectionery'
import { useNotificationsStore } from '../stores/notifications'
import { moduleLabels, type AccessLevel, type AccessModule } from '../types'
import { currency, dateLabel } from '../utils/format'

const store = useConfectioneryStore()
const notifications = useNotificationsStore()
const users = ref<TeamUser[]>([])
const requests = ref<AccessRequest[]>([])
const busy = ref(false)
const loadError = ref('')
const staff = computed(() => users.value.filter(user => user.role === 'staff'))
const selectedUser = ref('')
const selectedStaff = ref('')
const from = ref('')
const through = ref('')
const productMovements = ref<ProductMovement[]>([])
const productMovementsError = ref('')
const productEntries = computed(() => productMovements.value.filter(movement => {
  const date = new Date(movement.createdAt)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return (!selectedUser.value || movement.userId === selectedUser.value)
    && (!from.value || localDate >= from.value)
    && (!through.value || localDate <= through.value)
}))
const movementDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const person = computed(() => staff.value.find(user => user.id === selectedStaff.value))
// Usa a data comercial e o autor da venda registrados pela API.
const movements = computed(() => store.sales.filter(sale =>
  (!selectedUser.value || sale.createdById === selectedUser.value)
  && (!from.value || sale.date >= from.value)
  && (!through.value || sale.date <= through.value)))
const total = computed(() => movements.value.reduce((sum, sale) => sum + sale.total, 0))
const expenses = computed(() => store.expenses.filter(expense =>
  (!selectedUser.value || expense.createdById === selectedUser.value)
  && (!from.value || expense.date >= from.value)
  && (!through.value || expense.date <= through.value)))
const expenseTotal = computed(() => expenses.value.reduce((sum, expense) => sum + expense.amount, 0))

async function load() {
  loadError.value = ''
  try {
    const [team, pending] = await Promise.all([accessService.team(), accessService.requests()])
    users.value = team
    requests.value = pending
  } catch (error) {
    loadError.value = errorMessage(error)
  }
}

async function save(operation: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  try {
    await operation()
    await load()
  } catch (error) {
    notifications.error(errorMessage(error))
    await load()
  } finally {
    busy.value = false
  }
}

function setLevel(id: string, module: AccessModule, event: Event) {
  const input = event.target
  if (!(input instanceof HTMLSelectElement)) return
  const level = input.value as AccessLevel | 'none'
  input.value = person.value?.permissions[module] ?? 'none'
  void save(() => accessService.set(id, module, level))
}

function userName(id: string) {
  return users.value.find(user => user.id === id)?.name ?? 'Usuário indisponível'
}

onMounted(() => {
  void load()
  void productsService.movements().then(result => {
    productMovements.value = result
  }).catch((error: unknown) => {
    productMovementsError.value = errorMessage(error)
  })
})
</script>

<template>
  <div class="page-heading"><h1>Equipe e acessos</h1></div>
  <p v-if="loadError" role="alert">{{ loadError }}</p>
  <section class="panel">
    <div class="panel-heading">
      <h2>Solicitações pendentes</h2>
      <button type="button" class="small-btn" :disabled="busy" @click="load">Atualizar</button>
    </div>
    <p v-if="!requests.length">Nenhuma solicitação pendente.</p>
    <div v-for="request in requests" :key="request.id" class="stock-summary">
      <span>{{ userName(request.userId) }} · {{ moduleLabels[request.module] }}</span>
      <div class="action-buttons">
        <button type="button" class="small-btn" :disabled="busy"
          @click="save(() => accessService.resolve(request.id, true))">{{ request.module === 'reports' ? 'Liberar visualização' : 'Liberar operação' }}</button>
        <button type="button" class="small-btn" :disabled="busy"
          @click="save(() => accessService.resolve(request.id, false))">Recusar</button>
      </div>
    </div>
  </section>
  <section class="panel history-panel">
    <h2>Permissões por funcionário</h2>
    <label class="field">Funcionário
      <select v-model="selectedStaff" :disabled="busy">
        <option value="">Selecione um funcionário</option>
        <option v-for="user in staff" :key="user.id" :value="user.id">
          {{ user.name }}{{ user.active ? '' : ' (inativo)' }}
        </option>
      </select>
    </label>
    <div v-if="person" class="form-grid">
      <label v-for="(label, module) in moduleLabels" :key="module" class="field">
        {{ label }}
        <select :value="person.permissions[module] ?? 'none'" :disabled="busy"
          @change="setLevel(person.id, module, $event)">
          <option value="none">Sem acesso</option>
          <option value="view">Visualizar</option>
          <option v-if="module !== 'reports'" value="operate">Operar</option>
        </select>
      </label>
    </div>
  </section>
  <section class="panel history-panel">
    <h2>Movimentações por usuário</h2>
    <label class="field">Autor
      <select v-model="selectedUser">
        <option value="">Todos</option>
        <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
      </select>
    </label>
    <div class="form-grid">
      <label class="field">De <input v-model="from" type="date" :max="through || undefined" /></label>
      <label class="field">Até <input v-model="through" type="date" :min="from || undefined" /></label>
    </div>
    <h3>Vendas</h3>
    <p v-if="store.salesError" role="alert">{{ store.salesError }}</p>
    <template v-else>
      <p>{{ movements.length }} venda(s) · {{ currency(total) }}</p>
      <div v-for="sale in movements" :key="sale.id" class="stock-summary">
        <span>{{ dateLabel(sale.date) }} · {{ userName(sale.createdById) }}</span>
        <strong>{{ currency(sale.total) }}</strong>
      </div>
    </template>
    <h3>Estoque e cadastro</h3>
    <p v-if="productMovementsError" role="alert">{{ productMovementsError }}</p>
    <p v-else>{{ productEntries.length }} movimentação(ões)</p>
    <div v-for="movement in productEntries" :key="movement.id" class="stock-summary">
      <span>{{ movementDate.format(new Date(movement.createdAt)) }} · {{ userName(movement.userId) }}</span>
      <strong>{{ productActionLabels[movement.action] }} · {{ movement.productName }}
        <template v-if="movement.stockDelta !== null"> · {{ movement.stockDelta > 0 ? '+' : '' }}{{ movement.stockDelta }} un.</template>
      </strong>
    </div>
    <h3>Despesas</h3>
    <p v-if="store.expensesError" role="alert">{{ store.expensesError }}</p>
    <template v-else>
      <p>{{ expenses.length }} despesa(s) · {{ currency(expenseTotal) }}</p>
      <div v-for="expense in expenses" :key="expense.id" class="stock-summary">
        <span>{{ dateLabel(expense.date) }} · {{ userName(expense.createdById) }} · {{ expense.description }}</span>
        <strong>{{ currency(expense.amount) }}</strong>
      </div>
    </template>
  </section>
</template>
