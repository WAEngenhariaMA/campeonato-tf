/**
 * Sorteio "prova pública": a mesma chave (seed) sempre embaralha a mesma lista, na mesma ordem,
 * da mesma forma — então o resultado não depende de nada guardado em segredo. Qualquer pessoa com
 * a chave e a lista de times (salvas junto do sorteio) pode rodar `seededShuffle` de novo e
 * conferir que bate exatamente com o que foi confirmado, provando que não foi alterado depois.
 */

function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates determinístico: mesma `list` (na mesma ordem de entrada) + mesma `seed` = mesmo resultado, sempre. */
export function seededShuffle<T>(list: T[], seed: string): T[] {
  const rand = mulberry32(hashSeed(seed))
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Gera uma chave legível de 16 dígitos hexadecimais, agrupada em blocos (ex: "3F9A-72E1-B5C8-091D"). */
export function generateDrawSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('')
  return hex.match(/.{1,4}/g)!.join('-')
}
