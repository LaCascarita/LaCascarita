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
      return res.status(400).json({ error: 'Date parameter is required' })
    }

    const API_KEY = process.env.API_FOOTBALL_KEY || ''
    const BASE_URL = 'https://apifootball.com/api/'

    let url = `${BASE_URL}?action=get_events&from=${date}&to=${date}&APIkey=${API_KEY}`

    if (leagueId) {
      url += `&league_id=${leagueId}`
    }

    const response = await fetch(url)
    const data = await response.json()

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
        return res.json(filteredData)
      }
    }

    res.json(data)

  } catch (error) {
    console.error('Error fetching fixtures:', error)
    res.status(500).json({ error: 'Error fetching fixtures' })
  }
}
