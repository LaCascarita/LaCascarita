// Vercel Function para obtener ligas de API-Football
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY

    if (!API_FOOTBALL_KEY) {
      return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' })
    }

    const response = await fetch(
      `https://apiv3.apifootball.com/?action=get_leagues&APIkey=${API_FOOTBALL_KEY}`
    )

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()

    // Filtrar ligas relevantes (puedes ajustar según necesites)
    const relevantLeagues = data.filter(league => {
      const leagueId = parseInt(league.league_id)
      // Ligas principales de México y otras importantes
      return [
        140, // La Liga
        135, // Serie A
        78,  // Bundesliga
        61,  // Ligue 1
        39,  // Premier League
        153, // Championship
        164, // Ligue 2
        253, // Liga MX
        254, // Liga MX Expansion
        256, // Liga MX Femenil
      ].includes(leagueId)
    })

    res.json({ leagues: relevantLeagues })

  } catch (error) {
    console.error('Error fetching leagues:', error)
    res.status(500).json({ error: 'Failed to fetch leagues' })
  }
}
