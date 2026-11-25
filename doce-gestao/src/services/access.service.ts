import type { AccessLevel, AccessModule, ModulePermissions, UserRole } from '../types'
import { http } from './http'

export interface TeamUser {
  id: string
  name: string
  username: string
  role: UserRole
  active: boolean
  permissions: ModulePermissions
}

export interface AccessRequest {
  id: string
  userId: string
  module: AccessModule
}

export const accessService = {
  team: () => http.get<TeamUser[]>('/users'),
  requests: () => http.get<AccessRequest[]>('/access/requests'),
  request: (module: AccessModule) => http.post<void>('/access/requests', { module }),
  resolve: (id: string, approved: boolean) => http.patch<void>('/access/requests/' + id, { approved }),
  set: (id: string, module: AccessModule, level: AccessLevel | 'none') =>
    http.patch<void>('/access/staff/' + id, { module, level }),
}
