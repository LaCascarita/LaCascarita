// Servicio para conectar con API-Football
// Documentación: https://apifootball.com/documentation-v2/

const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY || ''
const BASE_URL = 'https://apifootball.com/api/'

// IDs de ligas según API-Football
const LEAGUE_IDS = {
  'Liga MX': 235,
  'Liga Brasileña': 99,
  'Liga Argentina': 44,
  'MLS': 253,
  'Premier League': 148,
  'La Liga': 140,
  'Ligue 1': 61,
  'Serie A': 135,
  'Bundesliga': 78,
  'Eredivisie': 88
}

// Mapeo de bolsas a ligas
const BAGA_TO_LEAGUES = {
  'media-semana': ['Liga MX', 'Liga Brasileña', 'Liga Argentina'],
  'fin-de-semana': ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS'],
  'dominical': ['Eredivisie', 'Liga MX', 'La Liga']
}

export async function getFixturesByDate(date) {
  try {
    const response = await fetch(
      `${BASE_URL}?action=get_events&from=${date}&to=${date}&APIkey=${API_KEY}`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching fixtures:', error)
    throw error
  }
}

export async function getFixturesByLeague(leagueId, date) {
  try {
    const response = await fetch(
      `${BASE_URL}?action=get_events&from=${date}&to=${date}&league_id=${leagueId}&APIkey=${API_KEY}`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching league fixtures:', error)
    throw error
  }
}

export async function getFixturesByBag(bagType, date) {
  try {
    const leagues = BAGA_TO_LEAGUES[bagType] || []
    const allFixtures = []

    for (const leagueName of leagues) {
      const leagueId = LEAGUE_IDS[leagueName]
      if (leagueId) {
        const fixtures = await getFixturesByLeague(leagueId, date)
        if (Array.isArray(fixtures)) {
          allFixtures.push(...fixtures)
        }
      }
    }

    return allFixtures
  } catch (error) {
    console.error('Error fetching bag fixtures:', error)
    throw error
  }
}

export async function getLeagueStandings(leagueId) {
  try {
    const response = await fetch(
      `${BASE_URL}?action=get_standings&league_id=${leagueId}&APIkey=${API_KEY}`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching standings:', error)
    throw error
  }
}

export function getLeagueId(leagueName) {
  return LEAGUE_IDS[leagueName]
}

export function getAvailableLeagues() {
  return Object.keys(LEAGUE_IDS)
}
