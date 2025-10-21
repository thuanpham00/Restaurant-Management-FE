# 🏗️ Kiến Trúc Tổng Quan Hệ Thống

## 📋 Mục Lục
- [Giới Thiệu](#giới-thiệu)
- [Tech Stack](#tech-stack)
- [Kiến Trúc Tổng Quan](#kiến-trúc-tổng-quan)
- [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [Mô Hình Kiến Trúc](#mô-hình-kiến-trúc)

---

## Giới Thiệu

**Restaurant Management System** là một ứng dụng web quản lý nhà hàng toàn diện được xây dựng bằng **React + TypeScript + Vite**. Hệ thống hỗ trợ hai vai trò chính:

- 🔐 **Admin Portal**: Quản lý toàn bộ hoạt động nhà hàng
- 🍽️ **Client Portal**: Giao diện cho khách hàng đặt bàn, xem menu, đặt món

---

## Tech Stack

### Core Framework
```
React 18.3.1          → UI Framework
TypeScript 5.6.2      → Type Safety
Vite 6.0.5           → Build Tool & Dev Server
```

### State Management
```
Zustand 5.0.8                    → Global State Management
@tanstack/react-query 5.64.1    → Server State & Caching
React Hook Form 7.54.2           → Form State Management
```

### Routing & Navigation
```
React Router DOM 7.1.1  → Client-side Routing
```

### UI & Styling
```
TailwindCSS 3.4.17              → Utility-first CSS
Radix UI                        → Headless UI Components
Lucide React                    → Icon Library
Framer Motion 11.18.1           → Animations
Ant Design 5.26.3               → Complex UI Components
```

### Data Fetching & API
```
Axios 1.7.9        → HTTP Client
Socket.io-client   → Real-time Communication (planned)
```

### Form & Validation
```
React Hook Form 7.54.2       → Form Management
Yup 1.6.1                    → Schema Validation
@hookform/resolvers 3.10.0   → RHF + Yup Integration
```

### Charts & Visualization
```
Chart.js 4.5.0              → Chart Library
React-Chartjs-2 5.3.0       → React Wrapper for Chart.js
FullCalendar 6.1.15         → Calendar & Scheduling
```

### Utilities
```
date-fns 4.1.0           → Date Manipulation
dayjs 1.11.18            → Lightweight Date Library
lodash 4.17.21           → Utility Functions
clsx / classnames        → Conditional CSS Classes
js-cookie 3.0.5          → Cookie Management
```

### Development Tools
```
ESLint 8.57.0         → Code Linting
Prettier 3.4.2        → Code Formatting
TypeScript ESLint     → TypeScript Linting
```

---

## Kiến Trúc Tổng Quan

Hệ thống sử dụng kiến trúc **Feature-Based Modular Architecture** kết hợp với **Layered Architecture**:

```mermaid
graph TB
    subgraph Application["Application Layer"]
        AdminPortal["Admin Portal<br/>(Admin/ folder)"]
        ClientPortal["Client Portal<br/>(Client/ folder)"]
    end
    
    subgraph Presentation["Presentation Layer"]
        Pages["Pages"]
        Components["Components"]
        Layouts["Layouts"]
    end
    
    subgraph Business["Business Logic Layer"]
        Authorization["Authorization<br/>(RBAC)"]
        Helpers["Helpers<br/>Functions"]
        Hooks["Custom Hooks"]
    end
    
    subgraph State["State Management Layer"]
        Zustand["Zustand<br/>(App State)"]
        ReactQuery["React Query<br/>(Server State)"]
    end
    
    subgraph Data["Data Access Layer"]
        HTTPClient["HTTP Client<br/>(Axios + Auth)"]
        APIModules["API Modules<br/>(Admin/Client)"]
    end
    
    Backend["Backend API<br/>(REST/GraphQL)"]
    
    Application --> Presentation
    Presentation --> Business
    Business --> State
    State --> Data
    Data --> Backend
    
    style Application fill:#e1f5ff
    style Presentation fill:#fff4e1
    style Business fill:#ffe1f5
    style State fill:#e1ffe1
    style Data fill:#f5e1ff
    style Backend fill:#ffe1e1
```

---

## Cấu Trúc Thư Mục

```
src/
├── Admin/                      # 🔐 Admin Portal Module
│   ├── Components/            # Admin-specific components
│   │   ├── HeaderAdmin/
│   │   ├── Sidebar/
│   │   ├── PermissionMatrix/
│   │   └── ...
│   ├── Layouts/              # Admin layout wrappers
│   │   ├── MainLayoutAdmin/
│   │   └── LayoutAuthAdmin/
│   ├── Pages/                # Admin feature pages
│   │   ├── ManageDashboard/
│   │   ├── ManageTable/
│   │   ├── ManageDished/
│   │   ├── ManageEmployee/
│   │   ├── ManageShift/
│   │   ├── ManagePayroll/
│   │   ├── ManageIngredient/
│   │   ├── ManageStockImport/
│   │   ├── ManageFinancial/
│   │   ├── ManageRoles/
│   │   └── ...
│   └── Routes/               # Admin routing configuration
│       └── useRouterAdmin.tsx
│
├── Client/                    # 🍽️ Client Portal Module
│   ├── Components/           # Client-specific components
│   ├── Layout/              # Client layouts
│   ├── Pages/               # Client pages
│   │   ├── Home/
│   │   ├── Menu/
│   │   ├── Table/
│   │   ├── Login/
│   │   └── ...
│   └── Routes/              # Client routing
│       └── useRouterClient.tsx
│
├── Apis/                      # 📡 API Layer
│   ├── Admin/               # Admin API endpoints
│   │   ├── auth.api.ts
│   │   ├── dishes.api.ts
│   │   ├── employees.api.ts
│   │   ├── shifts.api.ts
│   │   ├── payroll.api.ts
│   │   ├── ingredients.api.ts
│   │   └── ...
│   ├── Client/              # Client API endpoints
│   └── admin.api.ts         # API aggregator
│
├── Authorization/             # 🔒 Authorization System (RBAC)
│   ├── abilities.ts         # Permission definitions
│   ├── roles.ts            # Role definitions
│   ├── permissionMap.ts    # Role-Permission mapping
│   ├── featurePermissions.ts
│   ├── PermissionBoundary.tsx
│   ├── PermissionGate.tsx
│   └── useAuthorization.ts
│
├── Components/               # 🧩 Shared Components
│   ├── ui/                 # Shadcn/Radix UI components
│   ├── Button/
│   ├── Input/
│   └── ...
│
├── StateGlobal/              # 🗄️ Global State
│   └── zustand.tsx         # Zustand store
│
├── Helpers/                  # 🛠️ Utility Functions
│   ├── http.ts            # HTTP client with interceptors
│   ├── auth.ts            # Auth utilities
│   ├── common.ts          # Common helpers
│   ├── role_permission.ts # Permission helpers
│   └── utils.ts
│
├── Hook/                     # 🎣 Custom Hooks
│   ├── useQueryParams.tsx
│   └── useRealtimeQuery.tsx
│
├── Types/                    # 📝 TypeScript Definitions
│   ├── user.type.ts
│   ├── employee.type.ts
│   ├── dish.type.ts
│   ├── shift.type.ts
│   ├── payroll.type.ts
│   ├── ingredient.type.ts
│   ├── invoice.type.ts
│   └── ...
│
├── Constants/               # 📌 Constants
│   ├── config.ts          # App configuration
│   ├── path.ts            # Route paths
│   ├── enum.ts            # Enums
│   └── httpStatus.ts      # HTTP status codes
│
├── Assets/                  # 🎨 Static Assets
│   ├── img/
│   └── figma/
│
├── lib/                     # 📚 Third-party Config
│   ├── utils.ts           # Tailwind utilities
│   └── chart.ts           # Chart.js config
│
├── App.tsx                  # 🚀 Root App Component
├── main.tsx                # 🎯 Application Entry Point
└── index.css               # 🎨 Global Styles
```

---

## Mô Hình Kiến Trúc

### 1. **Two-Portal Architecture**

Hệ thống được chia thành hai portal riêng biệt:

```mermaid
graph LR
    subgraph App["App.tsx (Router)"]
        subgraph Admin["Admin Portal<br/>/admin/*"]
            A1["Dashboard"]
            A2["Tables"]
            A3["Employees"]
            A4["Shifts"]
            A5["Payroll"]
            A6["Inventory"]
            A7["Financial"]
            A8["Roles/Perms"]
        end
        
        subgraph Client["Client Portal<br/>/*"]
            C1["Home"]
            C2["Menu"]
            C3["Reservations"]
            C4["Profile"]
        end
    end
    
    style Admin fill:#ffe1e1
    style Client fill:#e1f5ff
```

### 2. **Authentication Flow**

```mermaid
sequenceDiagram
    participant User as Login Form
    participant Backend as Backend API
    participant Storage as LocalStorage + Zustand
    participant HTTP as HTTP Client Interceptor
    
    User->>Backend: Submit Credentials
    Backend->>User: JWT + Refresh Token
    User->>Storage: Save access_token & user info<br/>(name, role, avatar, employeeId)
    
    Note over HTTP: All Subsequent Requests
    HTTP->>HTTP: Auto attach Bearer token
    HTTP->>HTTP: Auto refresh on 401
    HTTP->>HTTP: Handle 403 (Forbidden)
```

### 3. **RBAC (Role-Based Access Control)**

```mermaid
graph TB
    User[User Login]
    Role[Assigned Role]
    Abilities[AppAbility Enum<br/>43+ Permissions]
    Guards[Route Guards +<br/>PermissionGate]
    
    User --> Role
    Role --> Abilities
    Abilities --> Guards
    
    subgraph Roles["7 Main Roles"]
        SA[Super Admin<br/>All permissions]
        ADM[Administrator<br/>Most permissions]
        MNG[Manager<br/>Operation management]
        CSH[Cashier<br/>Payment + Invoice]
        KIT[Kitchen Staff<br/>Food preparation]
        WAT[Waiter<br/>Customer service]
        STF[Staff<br/>Basic access]
    end
    
    Role -.-> Roles
    
    subgraph PermMap["Permission Map Example"]
        PM["Manager → [<br/>'dashboard:view',<br/>'tables:view',<br/>'tables:manage',<br/>'employees:view',<br/>'shifts:view',<br/>'shifts:manage',<br/>...]"]
    end
    
    Abilities -.-> PermMap
    
    style SA fill:#ff6b6b
    style ADM fill:#ffa94d
    style MNG fill:#ffd43b
    style CSH fill:#74c0fc
    style KIT fill:#69db7c
    style WAT fill:#da77f2
    style STF fill:#868e96
```

**Authorization Guards:**
- **Route Level**: `PermissionBoundary`
- **Component Level**: `PermissionGate`
- **Hook Level**: `useAuthorization`

### 4. **Data Flow Pattern**

```mermaid
flowchart TD
    UserAction["User Action"]
    UIComponent["UI Component<br/>(Form/Button)"]
    EventHandler["Event Handler<br/>(onClick, etc)"]
    ReactQuery["React Query<br/>useMutation"]
    CacheCheck{{"Cache Check"}}
    APIModule["API Module<br/>(dishes.api.ts)"]
    HTTPClient["HTTP Client<br/>(Axios + Auth)"]
    BackendAPI["Backend API"]
    Response["Response"]
    UpdateCache["React Query<br/>- Update Cache<br/>- Invalidate"]
    UIRerender["UI Re-render<br/>(Optimistic UI)"]
    
    UserAction --> UIComponent
    UIComponent --> EventHandler
    EventHandler --> ReactQuery
    CacheCheck -.-> ReactQuery
    ReactQuery --> APIModule
    APIModule --> HTTPClient
    HTTPClient --> BackendAPI
    BackendAPI --> Response
    Response --> UpdateCache
    UpdateCache --> UIRerender
    
    style ReactQuery fill:#61dafb
    style APIModule fill:#ffd43b
    style HTTPClient fill:#74c0fc
    style UpdateCache fill:#69db7c
```

---

## 🔗 Tài Liệu Liên Quan

- [Authentication & Authorization](./AUTHENTICATION_AUTHORIZATION.md)
- [Routing Structure](./ROUTING_STRUCTURE.md)
- [State Management](./STATE_MANAGEMENT.md)
- [API Architecture](./API_ARCHITECTURE.md)
- [Component Structure](./COMPONENT_STRUCTURE.md)
- [Data Flow](./DATA_FLOW.md)

---

**Cập nhật lần cuối**: October 21, 2025
