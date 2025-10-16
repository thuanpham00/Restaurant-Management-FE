import { useSearchParams } from "react-router-dom"

export default function useQueryParams() {
  const [searchParams] = useSearchParams()
  const params: Record<string, any> = {}

  searchParams.forEach((value, key) => {
    // Handle array parameters like ingredient_ids[] or category_ids[]
    const normalizedKey = key.replace(/\[\]$/, "") // Remove [] suffix
    
    if (params[normalizedKey]) {
      // Key already exists, convert to array
      if (Array.isArray(params[normalizedKey])) {
        params[normalizedKey].push(value)
      } else {
        params[normalizedKey] = [params[normalizedKey], value]
      }
    } else {
      // Check if this is an array parameter (ends with [])
      if (key.endsWith("[]")) {
        params[normalizedKey] = [value] // Start as array
      } else {
        params[normalizedKey] = value
      }
    }
  })

  return params
}
