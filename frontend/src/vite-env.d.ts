/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del backend. Si no se define, se usa `/api` (proxy de Vite en desarrollo). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
