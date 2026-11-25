import type { Sale, SaleItem } from '../types'
import { http } from './http'

export const paymentLabels = {
  pix: 'Pix',
  cash: 'Dinheiro',
  debit_card: 'Cartão de débito',
  credit_card: 'Cartão de crédito',
  transfer: 'Transferência',
  other: 'Outro',
}
export type PaymentMethod = keyof typeof paymentLabels

export const salesService = {
  list: () => http.get<Sale[]>('/sales'),
  create: (items: Pick<SaleItem, 'productId' | 'quantity'>[], discount: number, paymentMethod: PaymentMethod, date: string) =>
    http.post<Sale>('/sales', { items, discount, paymentMethod, date }),
  remove: (id: string) => http.delete<void>('/sales/' + id),
}
