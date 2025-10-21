# 🛣️ Routing Structure

## 📋 Mục Lục
- [Tổng Quan](#tổng-quan)
- [Admin Routes](#admin-routes)
- [Client Routes](#client-routes)
- [Route Guards](#route-guards)
- [Navigation Flow](#navigation-flow)

---

## Tổng Quan

Hệ thống sử dụng **React Router v7** với cấu trúc routing hai portal riêng biệt:

```
App.tsx
  │
  ├─── /admin/*          → Admin Portal (useRouterAdmin)
  │                        - Dashboard, Management Pages
  │                        - Requires Authentication + Admin Role
  │
  └─── /*                → Client Portal (useRouterClient)
                          - Home, Menu, Reservations
                          - Public & Protected Routes
```

### Route Detection Logic

```tsx
// src/App.tsx
function App() {
  const routerClient = useRouterClient()
  const routerAdmin = useRouterAdmin()
  const location = useLocation()
  
  const isAdminPath = location.pathname.startsWith("/admin")
  
  return (
    <HelmetProvider>
      {isAdminPath ? routerAdmin : routerClient}
      <ToastContainer />
    </HelmetProvider>
  )
}
```

---

## Admin Routes

### Route Structure

```
/admin/
├── login                              # Admin Login Page
│
├── dashboard                          # Dashboard (Overview)
│
├── tables                             # Table Management
│   ├── :id                           # Table Detail
│   └── :id/session/:sessionId        # Session History
│
├── reservations                       # Reservation Management
│
├── category-dishes                    # Dish Category Management
│
├── dishes                            # Dish Management
│   └── :id                           # Dish Detail
│
├── menus                             # Menu Management
│   └── :id                           # Menu Detail
│
├── customers                          # Customer Management
│
├── staff                             # Employee Management
│   └── :id                           # Employee Detail
│
├── shifts                            # Shift Management
│   └── :id                           # Shift Assignment Detail
│
├── payroll                           # Payroll Management
│   └── :id                           # Payroll Detail
│
├── promotions                        # Promotion Management
│
├── invoices                          # Invoice Management
│   └── :id                           # Invoice Detail
│
├── ingredients                       # Ingredient Management
│
├── suppliers                         # Supplier Management
│
├── warehouse-in                      # Stock Import
│
├── warehouse-out                     # Stock Export
│
├── inventory-loss                    # Stock Loss
│
├── roles                             # Role Management
│
└── permission-matrix                 # Permission Matrix
```

### Route Configuration

```tsx
// src/Admin/Routes/useRouterAdmin.tsx

const FEATURE_ROUTES = [
  { 
    path: "/admin/dashboard", 
    feature: "dashboard", 
    Component: ManageDashboard 
  },
  { 
    path: "/admin/tables", 
    feature: "tables", 
    Component: ManageTable 
  },
  { 
    path: "/admin/tables/:id", 
    feature: "tables", 
    Component: TableDetail 
  },
  { 
    path: "/admin/tables/:id/session/:sessionId", 
    feature: "tables", 
    Component: TableSessionHistoryDetail 
  },
  { 
    path: "/admin/staff", 
    feature: "staff", 
    Component: ManageEmployee 
  },
  { 
    path: "/admin/staff/:id", 
    feature: "staff", 
    Component: EmployeeDetail 
  },
  { 
    path: "/admin/shifts", 
    feature: "shifts", 
    Component: ManageShift 
  },
  { 
    path: "/admin/shifts/:id", 
    feature: "shifts", 
    Component: ShiftAssignmentDetail 
  },
  { 
    path: "/admin/payroll", 
    feature: "payroll", 
    Component: ManagePayroll 
  },
  { 
    path: "/admin/payroll/:id", 
    feature: "payroll", 
    Component: PayrollDetail 
  },
  // ... more routes
]
```

### Admin Route Diagram

```
                    ┌──────────────────┐
                    │   /admin/login   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Login Success   │
                    └────────┬─────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │      Check Role & Permissions       │
          └──────────────────┬──────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
    ┌─────▼─────┐                      ┌───────▼────────┐
    │ Has Admin │                      │ No Admin Role  │
    │   Role    │                      │                │
    └─────┬─────┘                      └───────┬────────┘
          │                                    │
    ┌─────▼──────────┐                  ┌──────▼─────────┐
    │ /admin/dashboard│                 │ Redirect to    │
    │                │                  │ /admin/not-    │
    │ (Protected by  │                  │ found          │
    │  Permissions)  │                  └────────────────┘
    └────────────────┘
          │
          ├─── /admin/tables (TABLES_VIEW)
          ├─── /admin/staff (EMPLOYEES_VIEW)
          ├─── /admin/shifts (SHIFTS_VIEW)
          ├─── /admin/payroll (PAYROLL_VIEW)
          ├─── /admin/ingredients (INGREDIENTS_VIEW)
          ├─── /admin/invoices (INVOICES_VIEW)
          └─── ... (Feature-based permissions)
```

---

## Client Routes

### Route Structure

```
/
├── /                                  # Home Page (Index)
├── /home                              # Home Page (Explicit)
├── /login                             # Client Login
├── /register                          # Client Registration
├── /forgot-password                   # Password Recovery
├── /auth/callback                     # OAuth Callback
│
├── /menu                              # Menu Listing
├── /dish/:id                          # Dish Detail
│
├── /table                             # Table Booking
├── /reservation-history               # User's Reservations
│
└── /settings                          # User Settings
```

### Client Route Configuration

```tsx
// src/Client/Routes/useRouterClient.tsx

const routes = [
  {
    path: "/auth/callback",
    element: <AuthCallback />
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "",
    element: <BlockAdminForClient />,
    children: [
      {
        path: "",
        element: <MainLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "home", element: <Home /> },
          { path: "menu", element: <Menu /> },
          { path: "dish/:id", element: <DetailMenu /> },
          { path: "table", element: <Table /> },
          { path: "reservation-history", element: <ReservationHistory /> },
          { path: "settings", element: <Setting /> }
        ]
      },
      {
        path: "",
        element: <RejectRouter />,
        children: [
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> }
        ]
      }
    ]
  }
]
```

### Client Route Diagram

```
                    ┌──────────────────┐
                    │   / or /home     │
                    │   (Public)       │
                    └────────┬─────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
    ┌─────▼──────┐                      ┌──────▼────────┐
    │ Logged In  │                      │ Not Logged In │
    └─────┬──────┘                      └──────┬────────┘
          │                                    │
    ┌─────▼──────────┐                  ┌──────▼─────────┐
    │ Access All     │                  │ Public Pages   │
    │ Features       │                  │ Only           │
    │                │                  │                │
    │ - Menu         │                  │ - Home         │
    │ - Table Booking│                  │ - Menu (view)  │
    │ - Reservations │                  │ - Login        │
    │ - Settings     │                  │ - Register     │
    └────────────────┘                  └────────────────┘
```

---

## Route Guards

### 1. **ProtectedRoute** (Admin)

Yêu cầu đăng nhập:

```tsx
const ProtectedRoute = () => {
  const { isAuthenticated } = useAppStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" />
}

// Usage
{
  path: "/admin",
  element: <ProtectedRoute />,
  children: [
    { path: "dashboard", element: <ManageDashboard /> },
    // ... protected routes
  ]
}
```

### 2. **RejectRouter** (Admin)

Ngăn user đã login truy cập trang login:

```tsx
const RejectRouter = () => {
  const { isAuthenticated } = useAppStore()
  if (!isAuthenticated) {
    return <Outlet />
  }
  return <Navigate to="/admin/dashboard" />
}

// Usage
{
  path: "",
  element: <RejectRouter />,
  children: [
    { path: "/admin/login", element: <AdminLogin /> }
  ]
}
```

### 3. **BlockClientForAdmin**

Ngăn Admin role truy cập Client portal:

```tsx
const BlockClientForAdmin = () => {
  const { role } = useAppStore()
  if (role && resolveRole(role)) {
    // Has admin role -> redirect
    return <Navigate to="/admin/not-found" replace />
  }
  return <Outlet />
}

// Usage in Client Routes
{
  path: "",
  element: <BlockClientForAdmin />,
  children: [
    // All client routes
  ]
}
```

### 4. **BlockAdminForClient**

Ngăn Client role truy cập Admin portal (tương tự):

```tsx
const BlockAdminForClient = () => {
  const { role } = useAppStore()
  if (!role) return <Outlet />
  
  const normalizedRole = resolveRole(role)
  if (!normalizedRole) {
    return <Navigate to="/not-found" replace />
  }
  return <Outlet />
}
```

### 5. **PermissionBoundary**

Kiểm tra quyền truy cập feature cụ thể:

```tsx
const withPermission = (feature: FeatureKey, Component) => (
  <Suspense>
    <PermissionBoundary ability={FEATURE_VIEW_ABILITY[feature]}>
      <Component />
    </PermissionBoundary>
  </Suspense>
)

// Usage
const routes = FEATURE_ROUTES.map(({ path, feature, Component }) => ({
  path,
  element: withPermission(feature, Component)
}))
```

### Route Guards Flow

```
┌─────────────────────────────────────────────────────────┐
│                  User Access Route                      │
└───────────────────┬─────────────────────────────────────┘
                    │
          ┌─────────▼──────────┐
          │ Check if /admin/*  │
          └─────────┬──────────┘
                    │
       ┌────────────┴────────────┐
       │                         │
┌──────▼───────┐         ┌───────▼──────┐
│ Admin Portal │         │Client Portal │
└──────┬───────┘         └───────┬──────┘
       │                         │
┌──────▼────────────┐    ┌───────▼──────────────┐
│ BlockClientFor-   │    │ BlockAdminFor-       │
│ Admin             │    │ Client               │
└──────┬────────────┘    └───────┬──────────────┘
       │                         │
       │ ✓ Pass                  │ ✓ Pass
       │                         │
┌──────▼────────────┐    ┌───────▼──────────────┐
│ ProtectedRoute    │    │ Public/Protected     │
│ (Auth Check)      │    │ Routes               │
└──────┬────────────┘    └───────┬──────────────┘
       │                         │
       │ ✓ Authenticated         │
       │                         │
┌──────▼────────────┐            │
│ PermissionBoundary│            │
│ (Role Check)      │            │
└──────┬────────────┘            │
       │                         │
       │ ✓ Has Permission        │
       │                         │
┌──────▼─────────────────────────▼──────┐
│         Render Component              │
└───────────────────────────────────────┘
```

---

## Navigation Flow

### Admin Navigation Flow

```tsx
// Programmatic Navigation
import { useNavigate } from 'react-router-dom'
import { path } from 'src/Constants/path'

function EmployeeList() {
  const navigate = useNavigate()
  
  const handleViewDetail = (employeeId: string) => {
    navigate(`/admin/staff/${employeeId}`)
  }
  
  const handleBack = () => {
    navigate(-1) // Go back
  }
  
  return (
    <div>
      {employees.map(emp => (
        <div onClick={() => handleViewDetail(emp.id)}>
          {emp.name}
        </div>
      ))}
    </div>
  )
}
```

### Client Navigation with Redirect

```tsx
// Login with redirect to original requested page
const ProjectRouter = () => {
  const { isAuthenticated } = useAppStore()
  const { pathname } = useLocation()
  
  return isAuthenticated 
    ? <Outlet /> 
    : <Navigate to={`/login?redirect_url=${encodeURIComponent(pathname)}`} />
}

// After login, redirect back
const RejectRouter = () => {
  const { isAuthenticated } = useAppStore()
  const [searchParams] = useSearchParams()
  
  if (!isAuthenticated) {
    return <Outlet />
  }
  
  const navigate = searchParams.get("redirect_url") || "/home"
  return <Navigate to={navigate} />
}
```

### Common Navigation Patterns

```tsx
// 1. Navigate to route
navigate('/admin/dashboard')

// 2. Navigate with params
navigate(`/admin/staff/${employeeId}`)

// 3. Navigate with query params
navigate(`/admin/invoices?status=paid&month=10`)

// 4. Navigate with state
navigate('/admin/shifts/123', { 
  state: { from: 'calendar' } 
})

// 5. Replace (no history)
navigate('/admin/login', { replace: true })

// 6. Go back
navigate(-1)

// 7. Go forward
navigate(1)
```

---

## 🔗 Path Constants

Tất cả routes được định nghĩa tập trung trong `src/Constants/path.ts`:

```typescript
export const path = {
  // Client
  Home: "/home",
  Login: "/login",
  NotFound: "*",
  
  // Admin
  AdminLogin: "/admin/login",
  AdminDashboard: "/admin/dashboard",
  AdminTables: "/admin/tables",
  AdminTablesDetail: "/admin/tables/:id",
  AdminStaff: "/admin/staff",
  AdminStaffDetail: "/admin/staff/:id",
  AdminShifts: "/admin/shifts",
  AdminShiftDetail: "/admin/shifts/:id",
  AdminPayroll: "/admin/payroll",
  AdminPayrollDetail: "/admin/payroll/:id",
  // ... more paths
}
```

**Lợi ích**:
- Tập trung quản lý
- Tránh typo
- Dễ dàng refactor
- Type-safe với TypeScript

---

**Cập nhật lần cuối**: October 21, 2025
