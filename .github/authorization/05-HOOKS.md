# Hooks Phân quyền

## useAuthorization

Hook chính để kiểm tra quyền hạn trong components.

## Import

```typescript
import { useAuthorization } from "src/Authorization"
```

## API

### Return Values

```typescript
const {
  role,          // AppRole | null - Vai trò hiện tại (đã chuẩn hóa)
  roleLabel,     // string | null - Nhãn hiển thị của vai trò
  permissions,   // AppAbility[] - Danh sách quyền hiệu lực
  can,           // (ability) => boolean - Kiểm tra quyền (AND)
  canSome,       // (ability) => boolean - Kiểm tra quyền (OR)
  hasRole,       // (role) => boolean - Kiểm tra vai trò (AND)
  hasAnyRole,    // (role) => boolean - Kiểm tra vai trò (OR)
  abilitySet     // Set<AppAbility> - Set quyền (nâng cao)
} = useAuthorization()
```

---

## role & roleLabel

### role

Vai trò hiện tại đã được chuẩn hóa về `AppRole`.

```typescript
const { role } = useAuthorization()

console.log(role)
// Output: "manager" | "cashier" | null
```

### roleLabel

Nhãn hiển thị thân thiện của vai trò.

```typescript
const { roleLabel } = useAuthorization()

console.log(roleLabel)
// Output: "Manager" | "Cashier" | null
```

### Ví dụ sử dụng

```tsx
function UserProfile() {
  const { role, roleLabel } = useAuthorization()
  
  if (!role) {
    return <div>Chưa đăng nhập</div>
  }
  
  return (
    <div>
      <h3>Thông tin tài khoản</h3>
      <p>Vai trò: {roleLabel}</p>
      <p>Code: {role}</p>
    </div>
  )
}
```

---

## permissions

Danh sách tất cả quyền mà user hiện có.

```typescript
const { permissions } = useAuthorization()

console.log(permissions)
// Output: [
//   "dashboard:view",
//   "tables:view",
//   "tables:manage",
//   ...
// ]
```

### Ví dụ: Hiển thị danh sách quyền

```tsx
function PermissionList() {
  const { permissions } = useAuthorization()
  
  return (
    <div>
      <h3>Quyền hạn của bạn</h3>
      <ul>
        {permissions.map(permission => (
          <li key={permission}>{permission}</li>
        ))}
      </ul>
      <p>Tổng: {permissions.length} quyền</p>
    </div>
  )
}
```

---

## can()

Kiểm tra xem user có **TẤT CẢ** các quyền được yêu cầu không (AND logic).

### Signature

```typescript
can(ability?: AppAbility | AppAbility[]): boolean
```

### Ví dụ

#### Kiểm tra một quyền

```tsx
function EditButton() {
  const { can } = useAuthorization()
  
  if (!can(AppAbility.TABLES_MANAGE)) {
    return null
  }
  
  return <button>Chỉnh sửa bàn</button>
}
```

#### Kiểm tra nhiều quyền (AND)

```tsx
function ComplexAction() {
  const { can } = useAuthorization()
  
  // Cần CẢ 3 quyền
  const allowed = can([
    AppAbility.MENU_VIEW,
    AppAbility.MENU_MANAGE,
    AppAbility.DISH_MANAGE
  ])
  
  if (!allowed) {
    return <div>Không đủ quyền</div>
  }
  
  return <button>Cập nhật menu</button>
}
```

#### Trong logic

```tsx
function handleSave() {
  const { can } = useAuthorization()
  
  if (!can(AppAbility.INGREDIENTS_MANAGE)) {
    toast.error("Bạn không có quyền lưu")
    return
  }
  
  // Proceed with save
  saveIngredient(data)
}
```

#### Điều kiện render

```tsx
function IngredientManagement() {
  const { can } = useAuthorization()
  
  const canView = can(AppAbility.INGREDIENTS_VIEW)
  const canManage = can(AppAbility.INGREDIENTS_MANAGE)
  
  return (
    <div>
      {canView && <IngredientList />}
      {canManage && (
        <div>
          <button>Thêm</button>
          <button>Import</button>
        </div>
      )}
    </div>
  )
}
```

---

## canSome()

Kiểm tra xem user có **ÍT NHẤT MỘT** trong các quyền được yêu cầu không (OR logic).

### Signature

```typescript
canSome(ability?: AppAbility | AppAbility[]): boolean
```

### Ví dụ

#### Kiểm tra nhiều quyền (OR)

```tsx
function ReportAccess() {
  const { canSome } = useAuthorization()
  
  // Chỉ cần 1 trong 3 quyền
  const canAccessReports = canSome([
    AppAbility.INVOICES_VIEW,
    AppAbility.PAYROLL_VIEW,
    AppAbility.WAREHOUSE_IMPORT_VIEW
  ])
  
  if (!canAccessReports) {
    return <div>Bạn không có quyền xem báo cáo</div>
  }
  
  return <ReportDashboard />
}
```

#### Menu sidebar

```tsx
function Sidebar() {
  const { canSome } = useAuthorization()
  
  // Hiện section "Tài chính" nếu có ít nhất 1 quyền liên quan
  const showFinanceSection = canSome([
    AppAbility.INVOICES_VIEW,
    AppAbility.PROMOTIONS_VIEW,
    AppAbility.INVOICES_MANAGE,
    AppAbility.PROMOTIONS_MANAGE
  ])
  
  return (
    <nav>
      {showFinanceSection && (
        <div>
          <h3>Tài chính</h3>
          {/* ... menu items */}
        </div>
      )}
    </nav>
  )
}
```

---

## hasRole()

Kiểm tra xem user có **TẤT CẢ** các vai trò được yêu cầu không (AND logic).

### Signature

```typescript
hasRole(roles?: AppRole | AppRole[]): boolean
```

### Ví dụ

```tsx
function AdminOnlySection() {
  const { hasRole } = useAuthorization()
  
  if (!hasRole(AppRole.SUPER_ADMIN)) {
    return null
  }
  
  return <div>Section chỉ dành cho Super Admin</div>
}
```

⚠️ **Lưu ý**: Thường dùng `can()` thay vì `hasRole()` vì linh hoạt hơn.

---

## hasAnyRole()

Kiểm tra xem user có **ÍT NHẤT MỘT** trong các vai trò được yêu cầu không (OR logic).

### Signature

```typescript
hasAnyRole(roles?: AppRole | AppRole[]): boolean
```

### Ví dụ

```tsx
function ManagerialDashboard() {
  const { hasAnyRole } = useAuthorization()
  
  const isManagerial = hasAnyRole([
    AppRole.SUPER_ADMIN,
    AppRole.ADMINISTRATOR,
    AppRole.MANAGER
  ])
  
  if (!isManagerial) {
    return <div>Chỉ dành cho quản lý</div>
  }
  
  return <Dashboard type="managerial" />
}
```

---

## abilitySet

Set chứa tất cả abilities (dạng `Set<AppAbility>`). Dùng cho các thao tác nâng cao.

### Ví dụ

```tsx
function AdvancedCheck() {
  const { abilitySet } = useAuthorization()
  
  // Kiểm tra trực tiếp trong Set (O(1))
  const hasAccess = abilitySet.has(AppAbility.TABLES_MANAGE)
  
  // Lọc danh sách abilities
  const managementAbilities = Array.from(abilitySet).filter(
    ability => ability.endsWith(':manage')
  )
  
  return (
    <div>
      <p>Có quyền quản lý: {managementAbilities.length}</p>
    </div>
  )
}
```

---

## Patterns thường dùng

### Pattern 1: Feature-based permissions

```tsx
import { FEATURE_VIEW_ABILITY, FEATURE_MANAGE_ABILITY } from "src/Authorization"

function FeatureManager({ feature }: { feature: FeatureKey }) {
  const { can } = useAuthorization()
  
  const canView = can(FEATURE_VIEW_ABILITY[feature])
  const canManage = FEATURE_MANAGE_ABILITY[feature] 
    ? can(FEATURE_MANAGE_ABILITY[feature])
    : false
  
  return (
    <div>
      {canView && <FeatureView />}
      {canManage && <FeatureActions />}
    </div>
  )
}
```

### Pattern 2: Conditional actions

```tsx
function DataTable() {
  const { can } = useAuthorization()
  
  const columns = [
    { key: 'name', label: 'Tên' },
    { key: 'price', label: 'Giá' },
    
    // Chỉ hiện cột actions khi có quyền
    ...(can(AppAbility.INGREDIENTS_MANAGE) ? [
      { key: 'actions', label: 'Thao tác' }
    ] : [])
  ]
  
  return <Table columns={columns} />
}
```

### Pattern 3: Guard functions

```tsx
function useIngredientActions() {
  const { can } = useAuthorization()
  
  const handleCreate = () => {
    if (!can(AppAbility.INGREDIENTS_MANAGE)) {
      toast.error("Không có quyền")
      return
    }
    createIngredient()
  }
  
  const handleDelete = (id: string) => {
    if (!can(AppAbility.INGREDIENTS_MANAGE)) {
      toast.error("Không có quyền")
      return
    }
    deleteIngredient(id)
  }
  
  return { handleCreate, handleDelete }
}
```

### Pattern 4: Dynamic menu

```tsx
function DynamicMenu() {
  const { can, canSome } = useAuthorization()
  
  const menuItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      visible: can(AppAbility.DASHBOARD_VIEW)
    },
    {
      label: "Bàn",
      path: "/admin/tables",
      visible: can(AppAbility.TABLES_VIEW)
    },
    {
      label: "Menu",
      path: "/admin/menu",
      visible: can(AppAbility.MENU_VIEW)
    },
    {
      label: "Kho",
      path: "/admin/warehouse",
      visible: canSome([
        AppAbility.WAREHOUSE_IMPORT_VIEW,
        AppAbility.WAREHOUSE_EXPORT_VIEW
      ])
    }
  ].filter(item => item.visible)
  
  return (
    <nav>
      {menuItems.map(item => (
        <Link key={item.path} to={item.path}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

### Pattern 5: Permission-aware forms

```tsx
function EmployeeForm() {
  const { can } = useAuthorization()
  
  const canEdit = can(AppAbility.EMPLOYEES_MANAGE)
  
  return (
    <form>
      <input 
        name="name" 
        disabled={!canEdit}
      />
      <input 
        name="email" 
        disabled={!canEdit}
      />
      
      {canEdit && (
        <button type="submit">Lưu</button>
      )}
    </form>
  )
}
```

---

## Performance Tips

### ✅ Destructure chỉ những gì cần

```tsx
// Tốt
const { can } = useAuthorization()

// Không cần thiết
const { can, canSome, hasRole, hasAnyRole, role, roleLabel, permissions, abilitySet } = useAuthorization()
```

### ✅ Memoize kết quả phức tạp

```tsx
function ExpensiveCheck() {
  const { can } = useAuthorization()
  
  const hasAccess = useMemo(() => {
    return can([
      AppAbility.MENU_VIEW,
      AppAbility.MENU_MANAGE,
      AppAbility.DISH_MANAGE
    ])
  }, [can])
  
  return hasAccess ? <Content /> : null
}
```

### ✅ Dùng abilitySet cho nhiều checks

```tsx
function MultipleChecks() {
  const { abilitySet } = useAuthorization()
  
  // O(1) cho mỗi check
  const canViewTables = abilitySet.has(AppAbility.TABLES_VIEW)
  const canManageTables = abilitySet.has(AppAbility.TABLES_MANAGE)
  const canViewMenu = abilitySet.has(AppAbility.MENU_VIEW)
  
  // ...
}
```

---

## Best Practices

### ✅ Nên làm

```tsx
// Dùng can() thay vì hasRole()
const canEdit = can(AppAbility.TABLES_MANAGE)  // ✅

// Tách logic rõ ràng
const canView = can(FEATURE_VIEW_ABILITY.menu)
const canManage = can(FEATURE_MANAGE_ABILITY.menu)

// Early return
if (!can(AppAbility.EMPLOYEES_VIEW)) {
  return null
}

// Guard trong functions
function handleSave() {
  if (!can(AppAbility.INGREDIENTS_MANAGE)) {
    toast.error("Không có quyền")
    return
  }
  // ...
}
```

### ❌ Không nên làm

```tsx
// Không dùng hasRole() trực tiếp
const isAdmin = hasRole(AppRole.SUPER_ADMIN)  // ❌

// Không kiểm tra string role trực tiếp
const { role } = useAppStore()
if (role === "admin") { }  // ❌

// Không skip guard
function handleDelete() {
  // Không kiểm tra quyền  // ❌
  deleteData()
}

// Không lặp lại checks
const canEdit = can(AppAbility.TABLES_MANAGE)
const canDelete = can(AppAbility.TABLES_MANAGE)  // ❌ Duplicate
```

---

## Debugging

### Log quyền hiện tại

```tsx
function DebugPermissions() {
  const { role, roleLabel, permissions, abilitySet } = useAuthorization()
  
  console.log('Role:', role)
  console.log('Role Label:', roleLabel)
  console.log('Permissions:', permissions)
  console.log('Ability Set:', Array.from(abilitySet))
  
  return null
}
```

### Test quyền cụ thể

```tsx
function TestPermission() {
  const { can } = useAuthorization()
  
  const abilities = [
    AppAbility.DASHBOARD_VIEW,
    AppAbility.TABLES_VIEW,
    AppAbility.TABLES_MANAGE,
    // ... test all
  ]
  
  return (
    <ul>
      {abilities.map(ability => (
        <li key={ability}>
          {ability}: {can(ability) ? '✅' : '❌'}
        </li>
      ))}
    </ul>
  )
}
```

---

## FAQ

**Q: Hook có trigger re-render nhiều không?**  
A: Không, đã optimize với useMemo. Chỉ re-render khi role/permissions thay đổi.

**Q: can() có case-sensitive không?**  
A: Không, đã normalize về lowercase trong mapping.

**Q: Có thể dùng hook ngoài component không?**  
A: Không, phải dùng trong React component/hook. Nếu cần ngoài, lấy từ store.

**Q: hasRole vs can, nên dùng gì?**  
A: Nên dùng `can()` vì linh hoạt hơn, dễ maintain khi role/ability thay đổi.

**Q: abilitySet dùng khi nào?**  
A: Khi cần check nhiều abilities liên tục, hoặc filter/transform danh sách abilities.

---

**Xem thêm**:
- [Components](./04-COMPONENTS.md)
- [Ví dụ](./07-EXAMPLES.md)
- [Tích hợp](./06-INTEGRATION.md)
