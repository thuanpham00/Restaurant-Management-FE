# Components Phân quyền

## Giới thiệu

Hệ thống cung cấp 2 components chính để kiểm soát hiển thị UI dựa trên quyền:

1. **PermissionGate**: Ẩn/hiện UI elements (buttons, sections)
2. **PermissionBoundary**: Bảo vệ routes và pages

## PermissionGate

### Mục đích

Component để **ẩn/hiện** các UI elements nhỏ như buttons, sections, forms dựa trên quyền.

### Props

```typescript
interface PermissionGateProps {
  ability?: AppAbility | AppAbility[]      // Quyền bắt buộc (AND logic)
  anyAbility?: AppAbility | AppAbility[]   // Quyền tùy chọn (OR logic)
  roles?: AppRole | AppRole[]              // Vai trò bắt buộc
  fallback?: ReactNode                     // UI thay thế khi không đủ quyền
  children: ReactNode                      // Nội dung cần bảo vệ
}
```

### Cách hoạt động

```
1. Kiểm tra ability (AND): Tất cả phải có
2. Kiểm tra anyAbility (OR): Ít nhất một
3. Kiểm tra roles: Ít nhất một role khớp
4. Nếu TẤT CẢ pass → render children
5. Nếu không → render fallback (default: null)
```

### Ví dụ cơ bản

#### Ẩn button không có quyền

```tsx
import { PermissionGate, AppAbility } from "src/Authorization"

function TableActions() {
  return (
    <div>
      {/* Luôn hiện */}
      <button>Xem chi tiết</button>
      
      {/* Chỉ hiện khi có quyền TABLES_MANAGE */}
      <PermissionGate ability={AppAbility.TABLES_MANAGE}>
        <button>Chỉnh sửa</button>
      </PermissionGate>
      
      <PermissionGate ability={AppAbility.TABLES_MANAGE}>
        <button>Xóa</button>
      </PermissionGate>
    </div>
  )
}
```

#### Với fallback

```tsx
<PermissionGate 
  ability={AppAbility.EMPLOYEES_MANAGE}
  fallback={<button disabled>Không có quyền</button>}
>
  <button>Thêm nhân viên</button>
</PermissionGate>
```

#### Kiểm tra nhiều quyền (AND)

```tsx
// Cần CẢ HAI quyền
<PermissionGate ability={[
  AppAbility.INGREDIENTS_VIEW,
  AppAbility.INGREDIENTS_MANAGE
]}>
  <button>Nhập kho</button>
</PermissionGate>
```

#### Kiểm tra nhiều quyền (OR)

```tsx
// Chỉ cần MỘT trong các quyền
<PermissionGate anyAbility={[
  AppAbility.INVOICES_VIEW,
  AppAbility.PROMOTIONS_VIEW,
  AppAbility.PAYROLL_VIEW
]}>
  <button>Xem báo cáo</button>
</PermissionGate>
```

#### Kết hợp ability + role

```tsx
<PermissionGate 
  ability={AppAbility.ROLES_MANAGE}
  roles={[AppRole.SUPER_ADMIN, AppRole.ADMINISTRATOR]}
>
  <button>Quản lý vai trò</button>
</PermissionGate>
```

### Ví dụ nâng cao

#### Điều kiện phức tạp

```tsx
<PermissionGate 
  ability={AppAbility.MENU_VIEW}              // Phải có VIEW
  anyAbility={[                                // VÀ ít nhất một trong:
    AppAbility.MENU_MANAGE,
    AppAbility.DISH_MANAGE
  ]}
  roles={[AppRole.MANAGER, AppRole.KITCHEN_STAFF]}  // VÀ phải là Manager hoặc Kitchen
>
  <button>Cập nhật menu</button>
</PermissionGate>
```

#### Section có nhiều actions

```tsx
function MenuManagement() {
  return (
    <div>
      <h2>Quản lý Menu</h2>
      
      <PermissionGate ability={AppAbility.MENU_VIEW}>
        <MenuList />
      </PermissionGate>
      
      <PermissionGate ability={AppAbility.MENU_MANAGE}>
        <div>
          <button>Thêm menu</button>
          <button>Import menu</button>
        </div>
      </PermissionGate>
      
      <PermissionGate 
        ability={[AppAbility.MENU_VIEW, AppAbility.MENU_MANAGE]}
        fallback={<p>Bạn không có quyền xem menu</p>}
      >
        <MenuEditor />
      </PermissionGate>
    </div>
  )
}
```

#### Với Feature Keys

```tsx
import { FEATURE_VIEW_ABILITY, FEATURE_MANAGE_ABILITY } from "src/Authorization"

function IngredientActions() {
  return (
    <>
      <PermissionGate ability={FEATURE_VIEW_ABILITY.ingredients}>
        <IngredientList />
      </PermissionGate>
      
      <PermissionGate ability={FEATURE_MANAGE_ABILITY.ingredients}>
        <button>Thêm nguyên liệu</button>
      </PermissionGate>
    </>
  )
}
```

---

## PermissionBoundary

### Mục đích

Component để **bảo vệ routes và pages**. Nếu không đủ quyền, tự động redirect.

### Props

```typescript
interface PermissionBoundaryProps {
  ability: AppAbility | AppAbility[]       // Quyền bắt buộc (AND)
  anyAbility?: AppAbility | AppAbility[]   // Quyền tùy chọn (OR)
  roles?: AppRole | AppRole[]              // Vai trò bắt buộc
  fallback?: ReactNode                     // UI thay thế
  redirectTo?: string                      // Đường dẫn redirect (default: /admin/dashboard)
  children: ReactNode                      // Page/component cần bảo vệ
}
```

### Cách hoạt động

```
1. Kiểm tra ability (AND)
2. Kiểm tra anyAbility (OR)
3. Kiểm tra roles
4. Nếu TẤT CẢ pass → render children
5. Nếu có fallback → render fallback
6. Nếu không → redirect về redirectTo
```

### Ví dụ cơ bản

#### Bảo vệ route

```tsx
// src/Admin/Routes/useRouterAdmin.tsx
import { PermissionBoundary, FEATURE_VIEW_ABILITY } from "src/Authorization"

{
  path: path.AdminMenu,
  element: (
    <Suspense>
      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.menu}>
        <ManageMenu />
      </PermissionBoundary>
    </Suspense>
  )
}
```

#### Custom redirect

```tsx
<PermissionBoundary 
  ability={AppAbility.PERMISSION_MATRIX_MANAGE}
  redirectTo="/admin/forbidden"
>
  <ManagePermissionMatrix />
</PermissionBoundary>
```

#### Với fallback thay vì redirect

```tsx
<PermissionBoundary 
  ability={AppAbility.EMPLOYEES_MANAGE}
  fallback={<div>Bạn không có quyền truy cập trang này</div>}
>
  <EmployeeManagement />
</PermissionBoundary>
```

### Ví dụ trong routing

```tsx
export default function useRouterAdmin() {
  const useRouterElement = useRoutes([
    {
      path: "/admin",
      element: <ProtectedRoute />,
      children: [
        {
          path: "",
          element: <MainLayoutAdmin />,
          children: [
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
            {
              path: path.AdminStaff,
              element: (
                <Suspense>
                  <PermissionBoundary ability={FEATURE_VIEW_ABILITY.staff}>
                    <ManageEmployee />
                  </PermissionBoundary>
                </Suspense>
              )
            },
            // ... more routes
          ]
        }
      ]
    }
  ])
  
  return useRouterElement
}
```

### Chi tiết route có liên quan

```tsx
// Tables detail cần cùng quyền với Tables list
{
  path: path.AdminTablesDetail,
  element: (
    <Suspense>
      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.tables}>
        <TableDetail />
      </PermissionBoundary>
    </Suspense>
  )
}

// Staff detail cần quyền staff
{
  path: path.AdminStaffDetail,
  element: (
    <Suspense>
      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.staff}>
        <EmployeeDetail />
      </PermissionBoundary>
    </Suspense>
  )
}
```

---

## So sánh PermissionGate vs PermissionBoundary

| Tiêu chí | PermissionGate | PermissionBoundary |
|----------|----------------|-------------------|
| **Mục đích** | Ẩn/hiện UI elements | Bảo vệ routes/pages |
| **Default behavior** | Render `null` | Redirect |
| **Vị trí** | Trong component | Trong router config |
| **Use case** | Buttons, sections | Pages, routes |
| **Fallback** | Component thay thế | Component hoặc redirect |

### Khi nào dùng gì?

#### Dùng PermissionGate khi:
- ✅ Ẩn/hiện buttons
- ✅ Ẩn/hiện sections trong một page
- ✅ Conditional rendering dựa trên quyền
- ✅ Muốn hiển thị message thay thế

#### Dùng PermissionBoundary khi:
- ✅ Bảo vệ toàn bộ page
- ✅ Bảo vệ route
- ✅ Muốn redirect nếu không đủ quyền
- ✅ Cần ngăn người dùng access URL trực tiếp

---

## Patterns thường dùng

### Pattern 1: View + Manage

```tsx
function ResourceManagement() {
  return (
    <div>
      {/* VIEW: Hiển thị danh sách */}
      <PermissionGate ability={AppAbility.INGREDIENTS_VIEW}>
        <IngredientList />
      </PermissionGate>
      
      {/* MANAGE: Các actions */}
      <PermissionGate ability={AppAbility.INGREDIENTS_MANAGE}>
        <div>
          <button>Thêm</button>
          <button>Import</button>
        </div>
      </PermissionGate>
    </div>
  )
}
```

### Pattern 2: Nested permissions

```tsx
<PermissionGate ability={AppAbility.MENU_VIEW}>
  <div>
    <h2>Menu</h2>
    <MenuList />
    
    {/* Nested: chỉ hiện khi có MANAGE */}
    <PermissionGate ability={AppAbility.MENU_MANAGE}>
      <button>Thêm menu</button>
    </PermissionGate>
  </div>
</PermissionGate>
```

### Pattern 3: Feature-based

```tsx
import { FEATURE_VIEW_ABILITY, FEATURE_MANAGE_ABILITY } from "src/Authorization"

function FeatureManagement({ feature }: { feature: FeatureKey }) {
  return (
    <>
      <PermissionGate ability={FEATURE_VIEW_ABILITY[feature]}>
        <List />
      </PermissionGate>
      
      {FEATURE_MANAGE_ABILITY[feature] && (
        <PermissionGate ability={FEATURE_MANAGE_ABILITY[feature]}>
          <Actions />
        </PermissionGate>
      )}
    </>
  )
}
```

### Pattern 4: Disabled state

```tsx
function ActionButton() {
  const { can } = useAuthorization()
  const canManage = can(AppAbility.TABLES_MANAGE)
  
  return (
    <button 
      disabled={!canManage}
      onClick={handleEdit}
    >
      Chỉnh sửa
    </button>
  )
}

// Hoặc với PermissionGate
function ActionButtonWithGate() {
  return (
    <PermissionGate 
      ability={AppAbility.TABLES_MANAGE}
      fallback={<button disabled>Chỉnh sửa</button>}
    >
      <button onClick={handleEdit}>Chỉnh sửa</button>
    </PermissionGate>
  )
}
```

---

## Best Practices

### ✅ Nên làm

```tsx
// Dùng FEATURE_VIEW_ABILITY cho consistency
<PermissionGate ability={FEATURE_VIEW_ABILITY.menu}>

// Dùng PermissionBoundary cho routes
<PermissionBoundary ability={FEATURE_VIEW_ABILITY.dashboard}>
  <ManageDashboard />
</PermissionBoundary>

// Fallback có ý nghĩa
<PermissionGate 
  ability={AppAbility.ROLES_MANAGE}
  fallback={<p>Chỉ admin mới có quyền này</p>}
>

// Nested hợp lý: VIEW bao MANAGE
<PermissionGate ability={VIEW}>
  <Content />
  <PermissionGate ability={MANAGE}>
    <Actions />
  </PermissionGate>
</PermissionGate>
```

### ❌ Không nên làm

```tsx
// Không dùng PermissionGate cho routes
<Route path="/admin/menu" element={
  <PermissionGate ability={...}>  // ❌ Dùng PermissionBoundary
    <ManageMenu />
  </PermissionGate>
} />

// Không nested ngược: MANAGE bao VIEW
<PermissionGate ability={MANAGE}>  // ❌
  <PermissionGate ability={VIEW}>
    <Content />
  </PermissionGate>
</PermissionGate>

// Không duplicate checks
<PermissionGate ability={A}>
  <PermissionGate ability={A}>  // ❌ Duplicate
    <Content />
  </PermissionGate>
</PermissionGate>
```

---

## FAQ

**Q: PermissionGate có re-render nhiều không?**  
A: Không, hook `useAuthorization` đã được optimize với useMemo.

**Q: Có thể dùng cả hai components cùng lúc?**  
A: Có, PermissionBoundary cho page, PermissionGate cho buttons trong page.

**Q: Fallback có bắt buộc không?**  
A: Không, default là `null` cho Gate và redirect cho Boundary.

**Q: Nếu không truyền ability thì sao?**  
A: Gate sẽ render children, Boundary sẽ pass (không kiểm tra).

---

**Xem thêm**:
- [Hooks](./05-HOOKS.md)
- [Ví dụ](./07-EXAMPLES.md)
- [Tích hợp](./06-INTEGRATION.md)
