import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase - Usa variables de entorno del archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función para generar ID único formato LC-XXXXXX
export const generateUserId = () => {
  const randomNumber = Math.floor(Math.random() * 900000) + 100000
  return `LC-${randomNumber}`
}