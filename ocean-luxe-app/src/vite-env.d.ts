/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VARIANT?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
