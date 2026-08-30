// Vercel Function para obtener partidos de fútbol
export default async function handler(req, res) {
  // Habilitar CORS
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
    const { date, bagType, leagueId } = req.query

    if (!date) {
      console.error('Error: Date parameter is required')
      return res.status(400).json({ error: 'Date parameter is required' })
    }

    const API_KEY = process.env.API_FOOTBALL_KEY
    
    if (!API_KEY) {
      console.error('Error: API_FOOTBALL_KEY environment variable is not set')
      return res.status(500).json({ error: 'API key not configured' })
    }

    console.log('Fetching fixtures for date:', date, 'bagType:', bagType, 'leagueId:', leagueId)
    
    // Construir URL según API v3 de API-Football
    const BASE_URL = 'https://apiv3.apifootball.com/'
    let url = `${BASE_URL}?action=get_events&APIkey=${API_KEY}&from=${date}&to=${date}`
    
    if (leagueId) {
      url += `&league_id=${leagueId}`
    }
    
    console.log('API Request URL:', url.replace(API_KEY, '***'))

    const response = await fetch(url)
    console.log('API Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      console.error('API Response error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('API Response body:', errorText)
      return res.status(500).json({ error: `API request failed: ${response.status} ${response.statusText}`, details: errorText })
    }
    
    const data = await response.json()
    console.log('API Response data type:', Array.isArray(data) ? 'array' : typeof data, 'length:', Array.isArray(data) ? data.length : 'N/A')
    console.log('Sample data:', JSON.stringify(data).substring(0, 200))

    // Si se especifica bagType, filtrar por ligas correspondientes (usando ligas de prueba)
    if (bagType) {
      const leagueMappings = {
        'media-semana': [153, 164], // Championship, Ligue 2 (pruebas)
        'fin-de-semana': [153, 164], // Championship, Ligue 2 (pruebas)
        'dominical': [153, 164] // Championship, Ligue 2 (pruebas)
      }

      const leagueIds = leagueMappings[bagType]
      if (leagueIds && Array.isArray(data)) {
        const filteredData = data.filter(match => 
          leagueIds.includes(parseInt(match.league_id))
        )
        console.log('Filtered matches:', filteredData.length, 'from', data.length)
        return res.json(filteredData)
      }
    }

    res.json(data)

  } catch (error) {
    console.error('Error fetching fixtures:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({ error: 'Error fetching fixtures', details: error.message })
  }
}
