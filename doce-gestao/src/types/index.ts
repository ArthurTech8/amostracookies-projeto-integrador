export interface Product {
  id: string
  name: string
  category: string
  description: string
  cost: number
  price: number
  stock: number
  minStock: number
  active: boolean
}

/** Dados do formulário de produto (sem o id). */
export type ProductInput = Omit<Product, 'id' | 'stock' | 'minStock'> & Partial<Pick<Product, 'stock' | 'minStock'>>

export const moduleLabels = {
  products: 'Cadastro de produtos',
  stock: 'Estoque',
  sales: 'Vendas',
  expenses: 'Despesas',
  reports: 'Relatórios',
} as const
export type AccessModule = keyof typeof moduleLabels
export type AccessLevel = 'view' | 'operate'
export type ModulePermissions = Partial<Record<AccessModule, AccessLevel>>

export type UserRole = 'super_admin' | 'admin' | 'staff'

/** Usuário logado, como devolvido por /auth/login e /auth/me. */
export interface AuthProfile {
  id: string
  name: string
  username: string
  role: UserRole
  permissions?: ModulePermissions
  company: { id: string; name: string; slug: string } | null
}

export interface Expense {
  createdById: string
  id: string
  description: string
  category: string
  amount: number
  date: string
  recurring: boolean
}

export type SaleOption = Pick<Product, 'id' | 'name' | 'price' | 'stock'>

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  unitCost: number
}

export interface Sale {
  createdById: string
  id: string
  date: string
  items: SaleItem[]
  discount: number
  paymentMethod: string
  total: number
}

export type Period = 'daily' | 'weekly' | 'monthly'
export type Section = 'dashboard' | 'products' | 'stock' | 'product-form' | 'expenses' | 'sales' | 'reports' | 'team'
