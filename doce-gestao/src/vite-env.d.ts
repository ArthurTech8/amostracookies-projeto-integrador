/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço da API, ex.: http://localhost:3000/api */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
