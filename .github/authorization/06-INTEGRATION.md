# Tích hợp Hệ thống Phân quyền

## Tổng quan

Tài liệu này hướng dẫn cách tích hợp hệ thống phân quyền vào các phần khác nhau của ứng dụng.

## 1. Cấu hình Store (Zustand)

### Store State

```typescript
// src/StateGlobal/zustand.tsx
type State = {
  isAuthenticated: boolean
  nameUser: string | null
  role: string | null           // ✨ Lưu raw role từ backend
  avatar: string | null
  userId: string | null
  employeeId: string | null
  isShowCategory: boolean
  permissions: string[]          // ✨ Lưu raw permissions từ backend
}
```

### Store Actions

```typescript
type Actions = {
  setRole: (value: string | null) => void
  setPermissions: (value: string[]) => void
  reset: () => void              // ✨ Reset bao gồm permissions
}
```

### Implementation

```typescript
export const useAppStore = create<State & Actions>((set) => ({
  // ... other state
  role: getRoleFromLS(),
  permissions: [],
  
  setRole: (value) => set({ role: value }),
  setPermissions: (value) => set({ permissions: value }),
  
  reset: () => set({
    isAuthenticated: false,
    nameUser: null,
    role: null,
    avatar: null,
    userId: null,
    employeeId: null,
    isShowCategory: false,
    permissions: []              // ✨ Xóa permissions khi logout
  })
}))
```

---

## 2. Login Flow

### AdminLogin Component

```typescript
// src/Admin/Pages/AdminLogin/AdminLogin.tsx
import { getDefaultPermissionsForRole, resolveRole } from "src/Authorization"

export default function AdminLogin() {
  const { setRole, setPermissions } = useAppStore()
  
  const loginMutation = useMutation({
    mutationFn: (body) => authAPI.loginAdmin(body)
  })
  
  const handleSubmitForm = handleSubmit((data) => {
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        const user = response.data.data.user
        const roleName = user.role?.name ?? null
        
        // 1. Lưu raw role
        setRole(roleName)
        
        // 2. Chuẩn hóa role
        const resolvedRole = resolveRole(roleName)
        
        // 3. Lấy permissions từ backend
        const backendPermissions = user.role?.permissions?.map(
          (permission: { code: string }) => permission.code
        ) ?? []
        
        // 4. Fallback về default nếu backend không có
        const fallbackPermissions = resolvedRole 
          ? getDefaultPermissionsForRole(resolvedRole) 
          : []
        
        // 5. Lưu vào store
        setPermissions(
          backendPermissions.length > 0 
            ? backendPermissions 
            : fallbackPermissions
        )
      }
    })
  })
  
  // ... rest of component
}
```

### API Response Format

Backend cần trả về format:

```json
{
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "...",
      "role": {
        "name": "manager",
        "permissions": [
          { "code": "dashboard:view" },
          { "code": "tables:view" },
          { "code": "tables:manage" },
          ...
        ]
      },
      "employee_profile": {
        "id": "123"
      }
    }
  }
}
```

---

## 3. Logout Flow

### Logout Handler

```typescript
// src/Admin/Components/Sidebar/Sidebar.tsx
const handleLogout = () => {
  logoutMutation.mutate(undefined, {
    onSuccess: () => {
      setIsAuthenticated(false)
      setNameUser(null)
      setRole(null)
      setAvatar(null)
      setEmployeeId(null)
      setPermissions([])         // ✨ Xóa permissions
      
      navigate(path.AdminLogin)
    }
  })
}
```

---

## 4. Router Integration

### Admin Routes

```typescript
// src/Admin/Routes/useRouterAdmin.tsx
import { PermissionBoundary, FEATURE_VIEW_ABILITY, resolveRole } from "src/Authorization"

// Guard: Block non-admin users
const BlockClientForAdmin = () => {
  const { role } = useAppStore()
  if (!role) return <Outlet />
  
  const normalizedRole = resolveRole(role)
  if (!normalizedRole) {
    return <Navigate to={path.NotFound} replace />
  }
  
  return <Outlet />
}

export default function useRouterAdmin() {
  return useRoutes([
    {
      path: "",
      element: <BlockClientForAdmin />,
      children: [
        {
          path: "/admin",
          element: <ProtectedRoute />,
          children: [
            {
              path: "",
              element: <MainLayoutAdmin />,
              children: [
                // ✨ Wrap mỗi route với PermissionBoundary
                {
                  path: path.AdminDashboard,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.dashboard}>
                        <ManageDashboard />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                {
                  path: path.AdminTables,
                  element: (
                    <Suspense>
                      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.tables}>
                        <ManageTable />
                      </PermissionBoundary>
                    </Suspense>
                  )
                },
                // ... more routes
              ]
            }
          ]
        }
      ]
    }
  ])
}
```

### Client Routes

```typescript
// src/Client/Routes/useRouterClient.tsx
import { resolveRole } from "src/Authorization"

// Guard: Block admin users from client pages
const BlockAdminForClient = () => {
  const { role } = useAppStore()
  
  if (role && resolveRole(role)) {
    return <Navigate to={path.AdminNotFound} replace />
  }
  
  return <Outlet />
}

export default function useRouterClient() {
  return useRoutes([
    {
      path: "",
      element: <BlockAdminForClient />,
      children: [
        // ... client routes
      ]
    }
  ])
}
```

---

## 5. Sidebar Integration

### Dynamic Menu

```typescript
// src/Admin/Components/Sidebar/Sidebar.tsx
import { FEATURE_VIEW_ABILITY, useAuthorization } from "src/Authorization"

export default function Sidebar() {
  const { can } = useAuthorization()
  
  // Menu configuration với feature keys
  const menuConfig: Record<string, MenuItem> = {
    dashboard: { 
      name: "Thống kê", 
      icon: LayoutDashboard, 
      path: path.AdminDashboard, 
      feature: "dashboard" 
    },
    tables: { 
      name: "Danh sách bàn", 
      icon: UtensilsCrossed, 
      path: path.AdminTables, 
      feature: "tables" 
    },
    // ... more items
  }
  
  // Helper: check quyền
  const canAccessFeature = (feature: keyof typeof FEATURE_VIEW_ABILITY) => 
    can(FEATURE_VIEW_ABILITY[feature])
  
  // Build menu items động
  const buildMenuChildren = (keys: MenuKey[]): MenuItems =>
    keys
      .map((key) => {
        const item = menuConfig[key]
        if (!canAccessFeature(item.feature)) {
          return null
        }
        return {
          key: item.path,
          label: <SidebarItem {...item} />
        }
      })
      .filter(Boolean)
  
  // Build sections
  const items: MenuItems = []
  
  // Dashboard
  if (canAccessFeature("dashboard")) {
    items.push({
      key: path.AdminDashboard,
      label: <Link to={path.AdminDashboard}>Thống kê hệ thống</Link>
    })
  }
  
  // Quản lý bàn
  const tableChildren = buildMenuChildren(["tables", "reservations"])
  if (tableChildren.length > 0) {
    items.push({
      key: "sub1",
      label: "Quản lý bàn",
      children: tableChildren
    })
  }
  
  // ... more sections
  
  return <Menu items={items} />
}
```

---

## 6. Component Integration

### Page Level

```tsx
// src/Admin/Pages/ManageIngredient/index.tsx
import { PermissionGate, FEATURE_MANAGE_ABILITY } from "src/Authorization"

export default function ManageIngredient() {
  return (
    <div>
      <h1>Quản lý Nguyên liệu</h1>
      
      {/* List luôn hiện (đã được bảo vệ ở route) */}
      <IngredientList />
      
      {/* Actions chỉ hiện khi có quyền MANAGE */}
      <PermissionGate ability={FEATURE_MANAGE_ABILITY.ingredients}>
        <div>
          <button>Thêm nguyên liệu</button>
          <button>Import Excel</button>
        </div>
      </PermissionGate>
    </div>
  )
}
```

### Component Level

```tsx
// Component nhỏ
import { useAuthorization, AppAbility } from "src/Authorization"

function IngredientActions({ item }) {
  const { can } = useAuthorization()
  
  const canManage = can(AppAbility.INGREDIENTS_MANAGE)
  
  return (
    <div>
      <button onClick={handleView}>Xem</button>
      
      {canManage && (
        <>
          <button onClick={handleEdit}>Sửa</button>
          <button onClick={handleDelete}>Xóa</button>
        </>
      )}
    </div>
  )
}
```

---

## 7. API Integration

### Check quyền trước khi gọi API

```typescript
import { useAuthorization, AppAbility } from "src/Authorization"

function useIngredientMutations() {
  const { can } = useAuthorization()
  
  const createMutation = useMutation({
    mutationFn: (data) => {
      // Guard: check quyền trước khi gọi API
      if (!can(AppAbility.INGREDIENTS_MANAGE)) {
        throw new Error("Không có quyền")
      }
      return ingredientsAPI.create(data)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (!can(AppAbility.INGREDIENTS_MANAGE)) {
        throw new Error("Không có quyền")
      }
      return ingredientsAPI.update(id, data)
    }
  })
  
  return { createMutation, updateMutation }
}
```

---

## 8. Testing Integration

### Mock useAuthorization

```typescript
// test-utils.tsx
export const mockUseAuthorization = (overrides = {}) => {
  return {
    role: AppRole.MANAGER,
    roleLabel: "Manager",
    permissions: [AppAbility.DASHBOARD_VIEW],
    can: jest.fn(() => true),
    canSome: jest.fn(() => true),
    hasRole: jest.fn(() => true),
    hasAnyRole: jest.fn(() => true),
    abilitySet: new Set([AppAbility.DASHBOARD_VIEW]),
    ...overrides
  }
}

// In test
jest.mock("src/Authorization", () => ({
  useAuthorization: () => mockUseAuthorization({
    can: jest.fn((ability) => ability === AppAbility.TABLES_VIEW)
  })
}))
```

### Test Components

```typescript
import { render, screen } from "@testing-library/react"
import { mockUseAuthorization } from "./test-utils"

test("hiển thị button khi có quyền", () => {
  jest.mock("src/Authorization", () => ({
    useAuthorization: () => mockUseAuthorization({
      can: () => true
    })
  }))
  
  render(<EditButton />)
  expect(screen.getByText("Chỉnh sửa")).toBeInTheDocument()
})

test("ẩn button khi không có quyền", () => {
  jest.mock("src/Authorization", () => ({
    useAuthorization: () => mockUseAuthorization({
      can: () => false
    })
  }))
  
  render(<EditButton />)
  expect(screen.queryByText("Chỉnh sửa")).not.toBeInTheDocument()
})
```

---

## 9. Error Handling

### 403 Forbidden

```typescript
// src/Helpers/http.ts
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Backend từ chối quyền
      toast.error("Bạn không có quyền thực hiện hành động này")
      
      // Optional: redirect về dashboard
      window.location.href = path.AdminDashboard
    }
    return Promise.reject(error)
  }
)
```

### Permission denied message

```tsx
function PermissionDenied() {
  return (
    <div className="permission-denied">
      <h2>Không có quyền truy cập</h2>
      <p>Bạn không có quyền xem trang này.</p>
      <Link to={path.AdminDashboard}>Về trang chủ</Link>
    </div>
  )
}

// Sử dụng trong PermissionBoundary
<PermissionBoundary 
  ability={...}
  fallback={<PermissionDenied />}
>
  <Page />
</PermissionBoundary>
```

---

## 10. Migration Guide

### Từ role-based cũ sang ability-based mới

#### Trước (role-based)

```tsx
const { role } = useAppStore()

if (role === rolesForApi.ADMIN) {
  return <AdminPanel />
}
```

#### Sau (ability-based)

```tsx
import { useAuthorization, AppAbility } from "src/Authorization"

const { can } = useAuthorization()

if (can(AppAbility.ROLES_MANAGE)) {
  return <AdminPanel />
}
```

### Checklist migration

- [ ] Import `useAuthorization` thay vì `useAppStore`
- [ ] Thay `role === "admin"` bằng `can(AppAbility.XXX)`
- [ ] Wrap routes với `PermissionBoundary`
- [ ] Wrap buttons/actions với `PermissionGate`
- [ ] Update login flow để lưu permissions
- [ ] Update logout flow để xóa permissions
- [ ] Test với các role khác nhau

---

## Best Practices

### ✅ Nên làm

```tsx
// Import từ Authorization module
import { useAuthorization, AppAbility, FEATURE_VIEW_ABILITY } from "src/Authorization"

// Dùng ability thay vì role
const canEdit = can(AppAbility.TABLES_MANAGE)

// Wrap routes với PermissionBoundary
<PermissionBoundary ability={FEATURE_VIEW_ABILITY.tables}>
  <ManageTable />
</PermissionBoundary>

// Guard API calls
if (!can(AppAbility.INGREDIENTS_MANAGE)) {
  throw new Error("Không có quyền")
}
```

### ❌ Không nên làm

```tsx
// Không so sánh role trực tiếp
if (role === "admin") { }  // ❌

// Không skip PermissionBoundary
<Route path="/admin/tables" element={<ManageTable />} />  // ❌

// Không quên xóa permissions khi logout
reset()  // Phải bao gồm permissions: []  // ✅
```

---

## Troubleshooting

### Vấn đề: Không có quyền nào

**Nguyên nhân**: Backend không trả về permissions và role không hợp lệ.

**Giải pháp**:
1. Check API response có đúng format
2. Check `resolveRole()` có chuẩn hóa được role
3. Check `ROLE_PERMISSIONS` có định nghĩa role đó

### Vấn đề: Menu không hiện

**Nguyên nhân**: `can()` trả về false.

**Giải pháp**:
1. Log permissions: `console.log(permissions)`
2. Check feature key mapping trong `FEATURE_VIEW_ABILITY`
3. Check permission map của role

### Vấn đề: Route redirect liên tục

**Nguyên nhân**: PermissionBoundary redirect về trang cũng cần quyền.

**Giải pháp**: Đảm bảo `redirectTo` không cần quyền (hoặc user có quyền).

---

**Xem thêm**:
- [Components](./04-COMPONENTS.md)
- [Hooks](./05-HOOKS.md)
- [Ví dụ](./07-EXAMPLES.md)
