// src/Router/useRouterClient.tsx
import { Navigate, Outlet, useLocation, useRoutes, useSearchParams } from "react-router-dom";
import MainLayout from "../Layout/MainLayout";
import MainLayoutAuth from "../Layout/MainLayoutAuth";
import { path } from "../../Constants/path";
import { lazy, Suspense } from "react";
import { rolesForApi } from "src/Helpers/role_permission";
import { useAppStore } from "src/StateGlobal/zustand";

// Lazy load các component
const Home = lazy(() => import("../Pages/Home"));
const Menu = lazy(() => import("../Pages/Menu"));
// const DetailMenu = lazy(() => import("../Pages/DetailMenu"));
const Login = lazy(() => import("../Pages/Login"));
const Register = lazy(() => import("../Pages/Register"));

const ProjectRouter = () => {
  const { isAuthenticated } = useAppStore();
  const { pathname } = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to={`${path.Login}?redirect_url=${encodeURIComponent(pathname)}`} />;
};

const RejectRouter = () => {
  const { isAuthenticated } = useAppStore();
  const [searchParams] = useSearchParams();
  if (!isAuthenticated) {
    return <Outlet />;
  }
  const navigate = searchParams.get("redirect_url") || path.Home; // path.Home giờ là "/home"
  return <Navigate to={navigate} />;
};

const BlockAdminForClient = () => {
  const { role } = useAppStore();
  if (role === rolesForApi.ADMIN) {
    return <Navigate to={path.AdminNotFound} replace />;
  }
  return <Outlet />;
};

export default function useRouterClient() {
  const routerElement = useRoutes([
    {
      path: "",
      element: <BlockAdminForClient />,
      children: [
        {
          path: "",
          element: <MainLayout />,
          children: [
            {
              index: true,
              element: (
                <Suspense>
                  <Home />
                </Suspense>
              ),
            },
            {
              path: "home", // Thêm route "/home"
              element: (
                <Suspense>
                  <Home />
                </Suspense>
              ),
            },
            {
              path: "menu",
              element: (
                <Suspense>
                  <Menu />
                </Suspense>
              ),
            },
            // {
            //   path: "product/:id",
            //   element: (
            //     <Suspense>
            //       <DetailMenu />
            //     </Suspense>
            //   ),
            // },
          ],
        },
        {
          path: "",
          element: <ProjectRouter />,
          children: [
            {
              path: "",
              element: <MainLayoutAuth />,
              children: [], // Các route yêu cầu xác thực
            },
          ],
        },
        {
          path: "",
          element: <RejectRouter />,
          children: [
            {
              path: "login",
              element: (
                <Suspense>
                  <Login />
                </Suspense>
              ),
            },
            {
              path: "register",
              element: (
                <Suspense>
                  <Register />
                </Suspense>
              ),
            },
          ],
        },
      ],
    },
  ]);
  return routerElement;
}