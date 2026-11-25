import type { Expense, Product, Sale, SaleItem } from '../types'
import { http } from './http'

export interface ReportsData {
  sales: (Pick<Sale, 'id' | 'date' | 'total'> & {
    items: Pick<SaleItem, 'productName' | 'quantity' | 'unitCost' | 'unitPrice'>[]
  })[]
  expenses: Omit<Expense, 'createdById'>[]
  products: Pick<Product, 'id' | 'name' | 'category' | 'stock' | 'minStock'>[]
}

export const reportsService = {
  read: () => http.get<ReportsData>('/reports'),
}
