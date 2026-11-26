export enum UserRole {
  /** Administrador da plataforma: não pertence a nenhuma empresa. */
  SuperAdmin = 'super_admin',
  /** Administrador de uma empresa. */
  Admin = 'admin',
  /** Colaborador de uma empresa. */
  Staff = 'staff',
}

/** Papéis que podem ser atribuídos a usuários de uma empresa. */
export const COMPANY_ROLES = [UserRole.Admin, UserRole.Staff] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];
