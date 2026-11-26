import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { errorMessage } from '../services/http'
import { productsService } from '../services/products.service'
import type { Expense, Product, ProductInput, Sale, SaleItem } from '../types'
import { makeId, todayISO } from '../utils/format'

const STORAGE_KEY = 'doce-gestao-v1'

/**
 * Despesas e vendas ainda ficam no navegador até migrarem para a API.
 * Produtos já vêm da API e não são mais salvos aqui.
 */
interface StoredData {
  expenses: Expense[]
  sales: Sale[]
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

const initialData: StoredData = {
  expenses: [
    { id: 'internet-inicial', description: 'Internet', category: 'Contas fixas', amount: 120, date: todayISO(), recurring: true },
    { id: 'luz-inicial', description: 'Energia elétrica', category: 'Contas fixas', amount: 230, date: todayISO(), recurring: true },
    { id: 'agua-inicial', description: 'Água', category: 'Contas fixas', amount: 90, date: todayISO(), recurring: true },
  ],
  sales: [],
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredData>
      return { expenses: parsed.expenses ?? [], sales: parsed.sales ?? [] }
    }
  } catch {
    console.warn('Não foi possível carregar os dados salvos. Será usado o cadastro inicial.')
  }
  return structuredClone(initialData)
}

export const useConfectioneryStore = defineStore('confectionery', () => {
  const loaded = loadData()
  const products = ref<Product[]>([])
  const productsStatus = ref<LoadStatus>('idle')
  const productsError = ref<string | null>(null)
  const expenses = ref<Expense[]>(loaded.expenses)
  const sales = ref<Sale[]>(loaded.sales)

  watch([expenses, sales], () => {
    const data: StoredData = {
      expenses: expenses.value,
      sales: sales.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, { deep: true })

  const activeProducts = computed(() => products.value.filter(product => product.active))
  const fixedExpenses = computed(() => expenses.value.filter(expense => expense.recurring).reduce((sum, item) => sum + item.amount, 0))
  const lowStockProducts = computed(() => activeProducts.value.filter(product => product.stock <= product.minStock))

  function replaceProduct(updated: Product) {
    const index = products.value.findIndex(item => item.id === updated.id)
    if (index >= 0) products.value[index] = updated
    else products.value.push(updated)
  }

  async function loadProducts() {
    productsStatus.value = 'loading'
    productsError.value = null
    try {
      products.value = await productsService.list()
      productsStatus.value = 'ready'
    } catch (error) {
      productsError.value = errorMessage(error)
      productsStatus.value = 'error'
    }
  }

  /** Limpa os produtos ao sair, para não mostrar dados de outra empresa no próximo login. */
  function resetProducts() {
    products.value = []
    productsStatus.value = 'idle'
    productsError.value = null
  }

  async function saveProduct(input: ProductInput, id?: string) {
    replaceProduct(id ? await productsService.update(id, input) : await productsService.create(input))
  }

  /** "Excluir" desativa o produto na API; ele continua na lista como inativo. */
  async function deleteProduct(id: string) {
    replaceProduct(await productsService.deactivate(id))
  }

  async function addStock(id: string, quantity: number) {
    replaceProduct(await productsService.addStock(id, quantity))
  }

  function saveExpense(expense: Omit<Expense, 'id'>) {
    expenses.value.push({ ...expense, id: makeId() })
  }

  function deleteExpense(id: string) {
    expenses.value = expenses.value.filter(expense => expense.id !== id)
  }

  function registerSale(items: SaleItem[], discount: number, paymentMethod: string, date = todayISO()) {
    if (!items.length) throw new Error('Adicione pelo menos um produto à venda.')
    for (const item of items) {
      const product = products.value.find(product => product.id === item.productId)
      if (!product || product.stock < item.quantity) throw new Error(`Estoque insuficiente para ${item.productName}.`)
    }
    for (const item of items) {
      const product = products.value.find(product => product.id === item.productId)
      if (product) product.stock -= item.quantity
    }
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const sale: Sale = {
      id: makeId(),
      date,
      items: items.map(item => ({ ...item })),
      discount,
      paymentMethod,
      total: Math.max(0, subtotal - discount),
    }
    sales.value.push(sale)
    return sale
  }

  function deleteSale(id: string) {
    const sale = sales.value.find(item => item.id === id)
    if (!sale) return
    for (const item of sale.items) {
      const product = products.value.find(product => product.id === item.productId)
      if (product) product.stock += item.quantity
    }
    sales.value = sales.value.filter(item => item.id !== id)
  }

  return {
    products, productsStatus, productsError, expenses, sales, activeProducts, fixedExpenses, lowStockProducts,
    loadProducts, resetProducts, saveProduct, deleteProduct, addStock,
    saveExpense, deleteExpense, registerSale, deleteSale,
  }
})