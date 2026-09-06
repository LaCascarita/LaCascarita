export default async function handler(req, res) {
  // Habilitar CORS
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
    // Test simple para verificar que la función se ejecuta
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    return res.json({
      message: 'Función ejecutándose correctamente',
      supabaseUrlConfigured: !!supabaseUrl,
      supabaseKeyConfigured: !!supabaseKey,
      supabaseKeyLength: supabaseKey ? supabaseKey.length : 0,
      body: req.body
    })

  } catch (error) {
    return res.status(500).json({ error: 'Error: ' + error.message })
  }
}
