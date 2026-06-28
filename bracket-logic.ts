// Define o mapeamento exato dos confrontos do bracket
export const BRACKET_LOGIC = {
  'Round of 16': [
    { num: 89, team1: 'W74', team2: 'W77' },
    { num: 90, team1: 'W73', team2: 'W75' },
    { num: 91, team1: 'W76', team2: 'W78' },
    { num: 92, team1: 'W79', team2: 'W80' },
    { num: 93, team1: 'W83', team2: 'W84' },
    { num: 94, team1: 'W81', team2: 'W82' },
    { num: 95, team1: 'W86', team2: 'W88' },
    { num: 96, team1: 'W85', team2: 'W87' }
  ],
  'Quarter-final': [
    { num: 97, team1: 'W89', team2: 'W90' },
    { num: 98, team1: 'W93', team2: 'W94' },
    { num: 99, team1: 'W91', team2: 'W92' },
    { num: 100, team1: 'W95', team2: 'W96' }
  ],
  'Semi-final': [
    { num: 101, team1: 'W97', team2: 'W98' },
    { num: 102, team1: 'W99', team2: 'W100' }
  ],
  'Match for third place': [
    { num: 103, team1: 'L101', team2: 'L102' }
  ],
  'Final': [
    { num: 104, team1: 'W101', team2: 'W102' }
  ]
}

// Extrai o número do winner (ex: "W74" → 74)
export function extractMatchNumber(reference: string): number {
  const match = reference.match(/(\d+)/)
  return match ? parseInt(match[1]) : -1
}

// Identifica se é Winner (W) ou Loser (L)
export function isWinner(reference: string): boolean {
  return reference.startsWith('W')
}

export function isLoser(reference: string): boolean {
  return reference.startsWith('L')
}
