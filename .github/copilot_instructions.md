# Restaurant Management System - AI Coding Guide

## Project Overview

React + TypeScript + Vite application for restaurant management with strict role-based access control. Two distinct user experiences: **Admin** (management portal) and **Client** (customer-facing).

## Architecture

### Dual-Portal Structure
- **Admin Portal** (`src/Admin/`): Complete restaurant management (tables, dishes, reservations, staff, inventory, reports)
- **Client Portal** (`src/Client/`): Customer interface (menu browsing, reservations, orders)
- **Shared Components** (`src/Components/`): Reusable UI components (shadcn/ui, custom inputs, buttons)

Each portal has its own:
- `Components/` - Portal-specific components
- `Layouts/` - Layout wrappers (authenticated vs public)
- `Pages/` - Route-level components (lazy-loaded)
- `Routes/` - Router configuration with role guards

### State Management
- **Zustand** (`src/StateGlobal/zustand.tsx`): Global auth state (isAuthenticated, role, user info)
- **TanStack Query**: Server state, caching, and data fetching
- **LocalStorage**: Token persistence via `src/Helpers/auth.ts` helpers

### Authentication Flow
1. Login via `adminAPI.auth.loginAdmin()` or client equivalent
2. Axios interceptor (`src/Helpers/http.ts`) automatically adds Bearer token to requests
3. Token stored in localStorage + user metadata (name, role, avatar, userId)
4. Automatic token refresh on 401 with `handleRefreshToken()` mechanism
5. Logout clears localStorage and dispatches `ClearLS` event for cleanup

## Critical Conventions

### Routing & Access Control
**Role-based route guards** (see `src/Admin/Routes/useRouterAdmin.tsx`, `src/Client/Routes/useRouterClient.tsx`):
- `ProtectedRoute`: Requires authentication, redirects to login
- `RejectRouter`: Blocks authenticated users from login pages
- `BlockClientForAdmin`: Prevents CUSTOMER role from accessing admin routes
- `BlockAdminForClient`: Prevents ADMIN role from accessing client routes

Roles defined in `src/Helpers/role_permission.ts`:
```typescript
rolesForApi = { ADMIN, SALES_STAFF, INVENTORY_STAFF, CUSTOMER }
```

### API Layer Pattern
**New Modular Structure (Recommended)**:
All APIs are now organized in domain-specific modules under `src/Apis/`:
- `Admin/` - Admin portal APIs (auth, tables, dishes, menus, etc.)
- `Client/` - Client portal APIs (to be developed)
- `Upload/` - File upload operations

**Import Patterns**:
```typescript
// ✅ RECOMMENDED: Import specific API modules (avoids conflicts)
import { authAPI, dishesAPI } from "src/Apis/Admin"
authAPI.loginAdmin({ email, password })
dishesAPI.getList(params, signal)

// ✅ GOOD: Direct import from specific file (most explicit)
import { authAPI } from "src/Apis/Admin/auth.api"

// ⚠️ LEGACY: Old style (still works, but deprecated)
import { adminAPI } from "src/Apis/admin.api"
adminAPI.auth.loginAdmin({ email, password })
```

**Module Organization**:
- `Admin/auth.api.ts` - Authentication (login, logout)
- `Admin/diningTable.api.ts` - Table management (create, update)
- `Admin/tableSession.api.ts` - Session tracking (list, details, history)
- `Admin/orderItems.api.ts` - Order status updates
- `Admin/dishCategory.api.ts` - Category CRUD operations
- `Admin/dishes.api.ts` - Dish management
- `Admin/menus.api.ts` - Menu versioning
- `Upload/media.api.ts` - Image uploads (dish, user)

All API calls go through singleton `Http` class (`src/Helpers/http.ts`):
- Automatically handles token attachment
- Intercepts login responses to store tokens
- Auto-refreshes expired tokens (debounced with `refreshTokenRequest` promise)
- Centralized error handling for 401/403/404

**Adding New APIs**:
1. Create new file in appropriate domain folder: `src/Apis/Admin/newFeature.api.ts`
2. Export named API object: `export const newFeatureAPI = { ... }`
3. Add export to `Admin/index.ts`: `export { newFeatureAPI } from "./newFeature.api"`
4. Use JSDoc comments for all functions with param descriptions

### Component Architecture
**Lazy Loading**: All route-level pages use React.lazy() for code splitting:
```typescript
const ManageDashboard = lazy(() => import('../Pages/ManageDashboard'))
```

**Shadcn/ui Integration**: UI primitives in `src/Components/ui/` use:
- `class-variance-authority` for variant-based styling
- `@radix-ui` for accessible base components
- `tailwind-merge` + `clsx` via `cn()` utility (`src/lib/utils.ts`)

**Custom Components** (`src/Components/`):
- `InputFileImage`: File upload with size/type validation (5MB limit from `config.maxSizeUploadImage`)
- Component structure: `ComponentName/ComponentName.tsx` + `index.ts` for clean exports

### Path Management
**Never hardcode routes**. Use centralized path constants (`src/Constants/path.ts`):
```typescript
path.AdminDashboard // "/admin/dashboard"
path.AdminTablesDetail // "/admin/tables/:id"
```

### Environment Configuration
- API base URL: `VITE_API_SERVER` from `.env` (see `src/Constants/config.ts`)
- Vite aliases configured: `src/` resolves to `./src`, `tinymce/` to node_modules

## Development Workflows

### Commands
```bash
yarn dev          # Dev server on port 4200
yarn build        # TypeScript check + Vite build
yarn lint         # ESLint check
yarn lint:fix     # Auto-fix ESLint issues
yarn prettier     # Check formatting
yarn prettier:fix # Auto-format code
```

### Adding New Admin Features
1. Define route in `src/Constants/path.ts`
2. Create page component in `src/Admin/Pages/[Feature]/`
3. Add lazy import + route in `src/Admin/Routes/useRouterAdmin.tsx`
4. Add sidebar item in `src/Admin/Components/Sidebar/Sidebar.tsx` with icon
5. Create API endpoints in `src/Apis/admin.api.ts` under appropriate namespace
6. Use TanStack Query hooks for data fetching

### Form Handling Pattern
- **react-hook-form** + **yup** for validation
- **@hookform/resolvers** integrates Yup with RHF
- Use `useForm()` with `yupResolver(schema)`
- Rules defined in `src/Helpers/rule.ts`

### Styling Approach
- **Tailwind CSS** as primary styling (custom colors: `primaryBlue`, `darkPrimary`, `darkSecond`)
- Dark mode via `darkMode: ["class"]` in tailwind config
- Custom container plugin disabled - use manual width classes
- Typography plugin enabled for rich text content

### TypeScript Types
- Domain types in `src/Types/`: `product.type.ts`, `user.type.ts`, `utils.type.ts`
- Generic response wrappers: `SuccessResponse<T>`, `PaginatedResponse<T>`
- Query param configs: `src/Types/queryParams.type.ts` (e.g., `queryParamConfigTableSessions`)

### Image Handling
- Static images in `src/Assets/img/` or `src/Assets/figma/`
- Centralized exports via `src/Assets/assets.ts`
- Upload via `MediaAPI.uploadImageDish()` or `MediaAPI.uploadImageUser()`
- Default fallback: `avatarDefault.png` for missing avatars

## Common Patterns

### Query Params Hook
Use `useQueryParams()` to parse URL search params into object:
```typescript
const params = useQueryParams() // { page: "1", search: "pizza" }
```

### Authentication Check
```typescript
const { isAuthenticated, role, nameUser } = useAppStore()
```

### Redirect After Login
Client routes support `redirect_url` param:
```typescript
<Navigate to={`${path.Login}?redirect_url=${encodeURIComponent(pathname)}`} />
```

### Toast Notifications
Use `react-toastify` for user feedback (already configured):
```typescript
toast.success("Success message", { autoClose: 1500 })
toast.error(error.message, { autoClose: 1500 })
```

## Integration Points

### Backend Communication
- **Axios** with credentials (`withCredentials: true`) for cookie-based refresh tokens
- Access tokens in Authorization header
- Base URL from `config.baseURLClient`
- 10s request timeout

### WebSocket (Socket.io)
- Client imported: `socket.io-client` for real-time features
- Implementation likely in admin dashboard for live updates

### Third-Party UI Libraries
- **Ant Design** (antd): Date pickers, tags, menus
- **Lucide React**: Icon system (e.g., `<Menu />`, `<LayoutDashboard />`)
- **TinyMCE**: Rich text editor for descriptions
- **Chart.js + react-chartjs-2**: Dashboard analytics

## File Organization Rules

- Components follow folder structure: `ComponentName/ComponentName.tsx` + `index.ts`
- Pages can have nested structure: `ManageTable/Pages/TableDetail.tsx`, `ManageTable/Components/`
- Helpers in `src/Helpers/`: Pure utility functions (auth, http, utils, rules)
- Constants in `src/Constants/`: Configuration, enums, paths, HTTP status codes
- No `.css` files except special cases (e.g., `Sidebar.css` for complex Ant Design menu overrides)

## Testing & Debugging

- React Query Devtools enabled in dev mode
- Vite CSS source maps enabled (`devSourcemap: true`)
- ESLint configured with React, TypeScript, a11y, and import plugins
- Prettier + Tailwind plugin for consistent formatting

## Key Files to Reference

- **Router Setup**: `src/Admin/Routes/useRouterAdmin.tsx`, `src/Client/Routes/useRouterClient.tsx`
- **Auth Logic**: `src/Helpers/http.ts` (interceptors), `src/Helpers/auth.ts` (localStorage)
- **State**: `src/StateGlobal/zustand.tsx`
- **API Definitions**: `src/Apis/Admin/`, `src/Apis/Client/`, `src/Apis/Upload/`
- **API Index**: `src/Apis/Admin/index.ts` (barrel exports)
- **Roles & Permissions**: `src/Helpers/role_permission.ts`
- **Paths**: `src/Constants/path.ts`
- **Types**: `src/Types/utils.type.ts` (response wrappers, domain entities)

## File Organization Rules

- Components follow folder structure: `ComponentName/ComponentName.tsx` + `index.ts`
- Pages can have nested structure: `ManageTable/Pages/TableDetail.tsx`, `ManageTable/Components/`
- **API modules**: Each domain in separate file with JSDoc comments
  - Example: `Admin/dishes.api.ts` exports `dishesAPI` object
  - Centralized via `index.ts` barrel exports
- Helpers in `src/Helpers/`: Pure utility functions (auth, http, utils, rules)
- Constants in `src/Constants/`: Configuration, enums, paths, HTTP status codes
- No `.css` files except special cases (e.g., `Sidebar.css` for complex Ant Design menu overrides)
