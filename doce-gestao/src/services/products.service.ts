import type { Product, ProductInput } from '../types'
import { http } from './http'

/** Formato devolvido pela API (com campos que a tela não usa). */
interface ApiProduct extends Product {
  companyId: string
  createdAt: string
  updatedAt: string
}

function toProduct(api: ApiProduct): Product {
  return {
    id: api.id,
    name: api.name,
    category: api.category,
    description: api.description,
    cost: api.cost,
    price: api.price,
    stock: api.stock,
    minStock: api.minStock,
    active: api.active,
  }
}

/** Envia só os campos aceitos pela API (ela recusa campos desconhecidos). */
function toPayload(input: ProductInput): ProductInput {
  return {
    name: input.name,
    category: input.category,
    description: input.description,
    cost: input.cost,
    price: input.price,
    stock: input.stock,
    minStock: input.minStock,
    active: input.active,
  }
}

export const productsService = {
  async list(): Promise<Product[]> {
    return (await http.get<ApiProduct[]>('/products')).map(toProduct)
  },
  async create(input: ProductInput): Promise<Product> {
    return toProduct(await http.post<ApiProduct>('/products', toPayload(input)))
  },
  async update(id: string, input: ProductInput): Promise<Product> {
    return toProduct(await http.patch<ApiProduct>(`/products/${id}`, toPayload(input)))
  },
  /** Desativa o produto (a API não apaga do banco). */
  async deactivate(id: string): Promise<Product> {
    return toProduct(await http.delete<ApiProduct>(`/products/${id}`))
  },
  async addStock(id: string, quantity: number): Promise<Product> {
    return toProduct(await http.post<ApiProduct>(`/products/${id}/stock-entries`, { quantity }))
  },
}
