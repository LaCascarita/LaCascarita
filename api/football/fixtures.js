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
    
    // Probar diferentes formatos de API-Football
    const BASE_URL = 'https://apifootball.com/api/'
    
    // Formato 1: action=get_events
    let url1 = `${BASE_URL}?action=get_events&from=${date}&to=${date}&APIkey=${API_KEY}`
    if (leagueId) url1 += `&league_id=${leagueId}`
    
    // Formato 2: action=get_events con league_id diferente
    let url2 = `${BASE_URL}?action=get_events&from=${date}&to=${date}&league_id=${leagueId || 140}&APIkey=${API_KEY}`
    
    console.log('Trying URL 1:', url1.replace(API_KEY, '***'))
    
    let response = await fetch(url1)
    console.log('URL 1 Response status:', response.status, response.statusText)
    
    let data
    let errorText
    
    if (!response.ok) {
      errorText = await response.text()
      console.error('URL 1 failed:', errorText)
      
      // Intentar formato 2
      console.log('Trying URL 2:', url2.replace(API_KEY, '***'))
      response = await fetch(url2)
      console.log('URL 2 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        errorText = await response.text()
        console.error('URL 2 failed:', errorText)
        return res.status(500).json({ 
          error: `API request failed: ${response.status} ${response.statusText}`, 
          details: errorText,
          triedUrls: [url1.replace(API_KEY, '***'), url2.replace(API_KEY, '***')]
        })
      }
    }
    
    data = await response.json()
    console.log('API Response data type:', Array.isArray(data) ? 'array' : typeof data, 'length:', Array.isArray(data) ? data.length : 'N/A')
    console.log('Sample data:', JSON.stringify(data).substring(0, 200))

    // Si se especifica bagType, filtrar por ligas correspondientes
    if (bagType) {
      const leagueMappings = {
        'media-semana': [235, 99, 44], // Liga MX, Liga Brasileña, Liga Argentina
        'fin-de-semana': [148, 140, 135, 78, 61, 253], // Premier League, La Liga, Serie A, Bundesliga, Ligue 1, MLS
        'dominical': [88, 235, 140] // Eredivisie, Liga MX, La Liga
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
