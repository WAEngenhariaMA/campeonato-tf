/** Uppercase, trim, and collapse internal whitespace — the canonical form stored for any person/team name. */
export function normalizeName(raw: string): string {
  return raw
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('pt-BR')
}

/** Strips dots, hyphens, slashes and spaces, and uppercases — the key used to detect duplicate documents across teams. */
export function normalizeDocument(raw: string): string {
  return raw
    .trim()
    .toLocaleUpperCase('pt-BR')
    .replace(/[.\-/\s]/g, '')
}

/** Levenshtein distance, used only to flag possible (non-blocking) name duplicates for admin review. */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = new Array(n + 1)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = temp
    }
  }
  return dp[n]
}

/**
 * Heuristic similarity in [0,1] between two already-normalized names.
 * Combines edit distance with a token-overlap check so word-order/insertions
 * (e.g. "JOAO PEDRO SILVA" vs "JOAO PEDRO DA SILVA") still score as similar.
 */
export function nameSimilarity(a: string, b: string): number {
  if (a === b) return 1
  const dist = levenshtein(a, b)
  const editScore = 1 - dist / Math.max(a.length, b.length, 1)

  const tokensA = new Set(a.split(' ').filter((t) => t.length > 1))
  const tokensB = new Set(b.split(' ').filter((t) => t.length > 1))
  const shared = [...tokensA].filter((t) => tokensB.has(t)).length
  const tokenScore = shared / Math.max(tokensA.size, tokensB.size, 1)

  return Math.max(editScore, tokenScore)
}

export const POSSIBLE_DUPLICATE_THRESHOLD = 0.72
