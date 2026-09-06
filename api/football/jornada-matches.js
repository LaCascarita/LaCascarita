import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type } = req.query

    if (!type) {
      return res.status(400).json({ error: 'Missing type parameter' })
    }

    // Obtener jornada activa del tipo especificado
    const { data: jornada, error: jornadaError } = await supabase
      .from('admin_jornadas')
      .select('*')
      .eq('type', type)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (jornadaError && jornadaError.code !== 'PGRST116') {
      throw jornadaError
    }

    if (!jornada) {
      return res.json({ jornada: null, matches: [] })
    }

    // Obtener partidos de la jornada
    const { data: matches, error: matchesError } = await supabase
      .from('admin_jornada_partidos')
      .select('*')
      .eq('jornada_id', jornada.id)
      .order('position')

    if (matchesError) {
      throw matchesError
    }

    res.json({ jornada, matches })

  } catch (error) {
    console.error('Error fetching jornada matches:', error)
    res.status(500).json({ error: 'Failed to fetch jornada matches' })
  }
}
