import { HelmetProvider } from "react-helmet-async"
import useRouterClient from "./Client/Routes/useRouterClient"
import useRouterAdmin from "./Admin/Routes/useRouterAdmin"
import { ToastContainer } from "react-toastify"
import { useEffect } from "react"
import { LocalStorageEventTarget } from "./Helpers/auth"
import { useLocation } from "react-router-dom"
import { useAppStore } from "./StateGlobal/zustand"

function App() {
  const routerClient = useRouterClient()
  const routerAdmin = useRouterAdmin()
  const { reset } = useAppStore()
  const location = useLocation()

  useEffect(() => {
    LocalStorageEventTarget.addEventListener("ClearLS", reset) // lắng nghe sự kiện
    return () => {
      LocalStorageEventTarget.removeEventListener("ClearLS", reset) // destroy event
    }
  }, [reset])

  const isAdminPath = location.pathname.startsWith("/admin")
  return (
    <HelmetProvider>
      {isAdminPath ? routerAdmin : routerClient}
      <ToastContainer />
    </HelmetProvider>
  )
}

export default App
