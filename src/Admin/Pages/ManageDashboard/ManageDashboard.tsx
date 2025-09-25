import { useEffect } from "react"
import Http from "src/Helpers/http"

export default function ManageDashboard() {
  useEffect(() => {
    Http.get("/api/auth/me").then((res) => console.log(res))
  }, [])

  return <div>ManageDashboard</div>
}
