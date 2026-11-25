import type { Expense } from '../types'
import { http } from './http'

export type ExpenseInput = Omit<Expense, 'id' | 'createdById'>

export const expensesService = {
  list: () => http.get<Expense[]>('/expenses'),
  create: (input: ExpenseInput) => http.post<Expense>('/expenses', input),
  remove: (id: string) => http.delete<void>('/expenses/' + id),
}
