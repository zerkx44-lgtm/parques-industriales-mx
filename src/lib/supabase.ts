import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Si faltan las variables de entorno lo decimos claro en vez de fallar en silencio. */
export const supabaseConfigurado = Boolean(url && anonKey)

if (!supabaseConfigurado) {
  console.error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y llena los valores.',
  )
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'sin-llave', {
  auth: { persistSession: true, autoRefreshToken: true },
})
