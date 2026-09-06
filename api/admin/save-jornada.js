import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, name, start_date, end_date, matches } = req.body

    if (!type || !name || !start_date || !end_date || !matches || matches.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (matches.length > 9) {
      return res.status(400).json({ error: 'Maximum 9 matches allowed' })
    }

    // Validar tipo de jornada
    if (!['media_semana', 'fin_de_semana', 'dominical'].includes(type)) {
      return res.status(400).json({ error: 'Invalid jornada type' })
    }

    // Crear jornada
    const { data: jornada, error: jornadaError } = await supabase
      .from('admin_jornadas')
      .insert({
        type,
        name,
        start_date,
        end_date,
        status: 'active'
      })
      .select()
      .single()

    if (jornadaError) {
      throw jornadaError
    }

    // Insertar partidos
    const partidosToInsert = matches.map((match, index) => ({
      jornada_id: jornada.id,
      match_id: match.match_id,
      league_id: match.league_id,
      league_name: match.league_name,
      home_team_name: match.home_team_name,
      away_team_name: match.away_team_name,
      home_team_badge: match.home_team_badge,
      away_team_badge: match.away_team_badge,
      match_date: match.match_date,
      match_status: match.match_status || 'NS',
      home_score: match.home_score || null,
      away_score: match.away_score || null,
      position: index + 1
    }))

    const { error: partidosError } = await supabase
      .from('admin_jornada_partidos')
      .insert(partidosToInsert)

    if (partidosError) {
      throw partidosError
    }

    res.json({ success: true, jornada })

  } catch (error) {
    console.error('Error saving jornada:', error)
    res.status(500).json({ error: 'Failed to save jornada' })
  }
}
