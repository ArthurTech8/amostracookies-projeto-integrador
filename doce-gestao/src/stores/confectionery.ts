import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Expense, Product, Sale, SaleItem } from '../types'
import { makeId, todayISO } from '../utils/format'

const STORAGE_KEY = 'doce-gestao-v1'

interface StoredData {
  products: Product[]
  expenses: Expense[]
  sales: Sale[]
}

const initialData: StoredData = {
  products: [{
    id: 'cupcake-tradicional',
    name: 'Cupcake tradicional',
    category: 'Cupcakes',
    description: 'Cupcake tradicional da confeitaria.',
    cost: 4.5,
    price: 8,
    stock: 0,
    minStock: 5,
    active: true,
  }],
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
    if (raw) return JSON.parse(raw) as StoredData
  } catch {
    console.warn('Não foi possível carregar os dados salvos. Será usado o cadastro inicial.')
  }
  return structuredClone(initialData)
}

export const useConfectioneryStore = defineStore('confectionery', () => {
  const loaded = loadData()
  const products = ref<Product[]>(loaded.products)
  const expenses = ref<Expense[]>(loaded.expenses)
  const sales = ref<Sale[]>(loaded.sales)

  watch([products, expenses, sales], () => {
    const data: StoredData = {
      products: products.value,
      expenses: expenses.value,
      sales: sales.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, { deep: true })

  const activeProducts = computed(() => products.value.filter(product => product.active))
  const fixedExpenses = computed(() => expenses.value.filter(expense => expense.recurring).reduce((sum, item) => sum + item.amount, 0))
  const lowStockProducts = computed(() => activeProducts.value.filter(product => product.stock <= product.minStock))

  function saveProduct(product: Omit<Product, 'id'> & { id?: string }) {
    if (product.id) {
      const index = products.value.findIndex(item => item.id === product.id)
      if (index >= 0) products.value[index] = { ...product, id: product.id }
    } else {
      products.value.push({ ...product, id: makeId() })
    }
  }

  function deleteProduct(id: string) {
    products.value = products.value.filter(product => product.id !== id)
  }

  function addStock(id: string, quantity: number) {
    const product = products.value.find(item => item.id === id)
    if (product && quantity > 0) product.stock += quantity
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
    products, expenses, sales, activeProducts, fixedExpenses, lowStockProducts,
    saveProduct, deleteProduct, addStock, saveExpense, deleteExpense, registerSale, deleteSale,
  }
})