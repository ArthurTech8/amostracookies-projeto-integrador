import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { errorMessage } from '../services/http'
import { productsService } from '../services/products.service'
import { salesService, type PaymentMethod } from '../services/sales.service'
import type { Expense, Product, ProductInput, Sale, SaleItem, SaleOption } from '../types'
import { expensesService, type ExpenseInput } from '../services/expenses.service'
import { todayISO } from '../utils/format'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useConfectioneryStore = defineStore('confectionery', () => {
  const products = ref<Product[]>([])
  const productsStatus = ref<LoadStatus>('idle')
  const productsError = ref<string | null>(null)
  const expenses = ref<Expense[]>([])
  const expensesError = ref<string | null>(null)
  const sales = ref<Sale[]>([])
  const saleOptions = ref<SaleOption[]>([])
  const saleOptionsError = ref<string | null>(null)
  const salesError = ref<string | null>(null)
  let session = 0
  let expenseRequest = 0
  let productRequest = 0
  let saleRequest = 0
  let optionsRequest = 0

  const activeProducts = computed(() => products.value.filter(product => product.active))
  const fixedExpenses = computed(() => expenses.value.filter(expense => expense.recurring).reduce((sum, item) => sum + item.amount, 0))
  const lowStockProducts = computed(() => activeProducts.value.filter(product => product.stock <= product.minStock))

  function replaceProduct(updated: Product) {
    const index = products.value.findIndex(item => item.id === updated.id)
    if (index >= 0) products.value[index] = updated
    else products.value.push(updated)
  }

  async function loadProducts() {
    const request = ++productRequest
    productsStatus.value = 'loading'
    productsError.value = null
    try {
      const result = await productsService.list()
      if (request !== productRequest) return
      products.value = result
      productsStatus.value = 'ready'
    } catch (error) {
      if (request !== productRequest) return
      productsError.value = errorMessage(error)
      productsStatus.value = 'error'
    }
  }

  /** Limpa os dados e ignora respostas iniciadas na sessão anterior. */
  function resetSession() {
    session++
    setSalesAccess(false)
    setSaleOptionsAccess(false)
    setProductsAccess(false)
    setExpensesAccess(false)
  }

  function setSalesAccess(allowed: boolean) {
    if (allowed) { void loadSales(); return }
    saleRequest++
    sales.value = []
    salesError.value = null
  }

  function setSaleOptionsAccess(allowed: boolean) {
    if (allowed) {
      void loadSaleOptions()
      return
    }
    optionsRequest++
    saleOptions.value = []
    saleOptionsError.value = null
  }

  async function loadSaleOptions() {
    const request = ++optionsRequest
    saleOptionsError.value = null
    try {
      const options = await productsService.saleOptions()
      if (optionsRequest === request) saleOptions.value = options
    } catch (error) {
      if (optionsRequest === request) saleOptionsError.value = errorMessage(error)
    }
  }

  function setProductsAccess(allowed: boolean) {
    if (allowed) { void loadProducts(); return }
    productRequest++
    products.value = []
    productsStatus.value = 'idle'
    productsError.value = null
  }

  async function saveProduct(input: ProductInput, id?: string) {
    const currentSession = session
    const product = id ? await productsService.update(id, input) : await productsService.create(input)
    if (session === currentSession) replaceProduct(product)
  }

  /** "Excluir" desativa o produto na API; ele continua na lista como inativo. */
  async function deleteProduct(id: string) {
    const currentSession = session
    const product = await productsService.deactivate(id)
    if (session === currentSession) replaceProduct(product)
  }

  async function addStock(id: string, quantity: number) {
    const currentSession = session
    const product = await productsService.addStock(id, quantity)
    if (session === currentSession) replaceProduct(product)
  }

  function setExpensesAccess(allowed: boolean) {
    expensesError.value = null
    const request = ++expenseRequest
    if (!allowed) {
      expenses.value = []
      return
    }
    void expensesService.list().then(result => {
      if (request === expenseRequest) expenses.value = result
    }).catch((error: unknown) => {
      if (request === expenseRequest) expensesError.value = errorMessage(error)
    })
  }

  async function saveExpense(input: ExpenseInput) {
    const currentSession = session
    const expense = await expensesService.create(input)
    if (session === currentSession) expenses.value = [expense, ...expenses.value]
  }

  async function deleteExpense(id: string) {
    const currentSession = session
    await expensesService.remove(id)
    if (session === currentSession) expenses.value = expenses.value.filter(expense => expense.id !== id)
  }

  async function loadSales() {
    const request = ++saleRequest
    salesError.value = null
    try {
      const result = await salesService.list()
      if (request === saleRequest) sales.value = result
    } catch (error) {
      if (request === saleRequest) salesError.value = errorMessage(error)
    }
  }

  // O servidor calcula os totais e movimenta o estoque na mesma transação.
  async function registerSale(items: Pick<SaleItem, 'productId' | 'quantity'>[], discount: number, paymentMethod: PaymentMethod, date = todayISO()) {
    const currentSession = session
    const sale = await salesService.create(items.map(({ productId, quantity }) => ({ productId, quantity })), discount, paymentMethod, date)
    if (session !== currentSession) return
    sales.value = [sale, ...sales.value.filter(item => item.id !== sale.id)]
    await Promise.all([
      loadSales(),
      loadSaleOptions(),
      ...(productsStatus.value === 'idle' ? [] : [loadProducts()]),
    ])
  }

  async function deleteSale(id: string) {
    const currentSession = session
    await salesService.remove(id)
    if (session !== currentSession) return
    sales.value = sales.value.filter(item => item.id !== id)
    await Promise.all([loadSales(), loadSaleOptions(), loadProducts()])
  }

  return {
    products, productsStatus, productsError, expenses, sales, salesError, activeProducts, fixedExpenses, lowStockProducts,
    loadProducts, loadSales, resetSession, setProductsAccess, setSalesAccess, saveProduct, deleteProduct, addStock,
    setSaleOptionsAccess, loadSaleOptions, saleOptions, saleOptionsError,
    setExpensesAccess, expensesError, saveExpense, deleteExpense, registerSale, deleteSale,
  }
})