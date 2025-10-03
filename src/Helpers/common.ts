/* eslint-disable @typescript-eslint/no-explicit-any */
export const cleanObject = (obj: Record<string, any>) => {
  const result: Record<string, any> = {}
  for (const key in obj) {
    const value = obj[key]
    if (value !== "" && value !== undefined && !Number.isNaN(value)) {
      result[key] = value
    }
  }
  return result
}
