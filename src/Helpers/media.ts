export function toMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  const rawBase = (import.meta as { env?: { VITE_API_SERVER?: string } }).env?.VITE_API_SERVER || ""
  const base = String(rawBase)
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "") 
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}
