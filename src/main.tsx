import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import weekday from "dayjs/plugin/weekday"
import localeData from "dayjs/plugin/localeData"
import customParseFormat from "dayjs/plugin/customParseFormat"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

dayjs.extend(weekday)
dayjs.extend(localeData)
dayjs.extend(customParseFormat)
dayjs.locale("vi")

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0
    }
  }
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
