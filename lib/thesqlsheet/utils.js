
export function colIndexToA1(colIndex) {
  let n = colIndex + 1, s = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function toStr(x) {
  if (x === null || x === undefined) return ''
  return String(x)
}
