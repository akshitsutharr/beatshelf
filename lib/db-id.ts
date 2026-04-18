function hashToUInt32(input: string, seed: number) {
  let hash = seed >>> 0
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function toHex(value: number) {
  return value.toString(16).padStart(8, "0")
}

export function clerkIdToDatabaseId(clerkId: string) {
  const normalized = clerkId.trim()
  const part1 = toHex(hashToUInt32(normalized, 0x811c9dc5))
  const part2 = toHex(hashToUInt32(normalized, 0x9e3779b9))
  const part3 = toHex(hashToUInt32(normalized, 0x85ebca6b))
  const part4 = toHex(hashToUInt32(normalized, 0xc2b2ae35))
  const joined = `${part1}${part2}${part3}${part4}`

  const timeHiAndVersion = `4${joined.slice(12, 15)}`
  const clockSeqHiAndReserved = `${((parseInt(joined.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}`

  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${timeHiAndVersion}-${clockSeqHiAndReserved}${joined.slice(18, 20)}-${joined.slice(20, 32)}`
}