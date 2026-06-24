/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Web3Forms access key for the contact form (see README). */
  readonly PUBLIC_WEB3FORMS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
