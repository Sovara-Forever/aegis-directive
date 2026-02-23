/// <reference types="vite/client" />

// =============================================================================
// Aegis Intelligence - Alpha V1.0
// Type declarations for Vite environment variables
//
// This file tells TypeScript what environment variables exist so it stops
// complaining when we use import.meta.env.VITE_*
// =============================================================================

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
