# Mở rộng Hệ thống Phân quyền

## 1. Thêm Ability Mới

### Scenario

Cần thêm tính năng "Reports" với 2 quyền:
- `reports:view` - Xem báo cáo
- `reports:export` - Export báo cáo

### Bước 1: Thêm vào abilities.ts

```typescript
// src/Authorization/abilities.ts
export enum AppAbility {
  // ... existing abilities
  
  // ✨ New: Reports
  REPORTS_VIEW = "reports:view",
  REPORTS_EXPORT = "reports:export",
}

// ALL_ABILITIES tự động bao gồm abilities mới
export const ALL_ABILITIES = Object.values(AppAbility)
```

### Bước 2: Thêm vào featurePermissions.ts

```typescript
// src/Authorization/featurePermissions.ts
export type FeatureKey =
  | "dashboard"
  | "tables"
  // ... existing features
  | "reports"  // ✨ New

export const FEATURE_VIEW_ABILITY: Record<FeatureKey, AppAbility> = {
  // ... existing mappings
  reports: AppAbility.REPORTS_VIEW,  // ✨ New
}

export const FEATURE_MANAGE_ABILITY: Partial<Record<FeatureKey, AppAbility>> = {
  // ... existing mappings
  reports: AppAbility.REPORTS_EXPORT,  // ✨ New (nếu cần)
}
```

### Bước 3: Cập nhật permissionMap.ts

```typescript
// src/Authorization/permissionMap.ts
export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  [AppRole.SUPER_ADMIN]: ALL_ABILITIES,  // ✅ Tự động có
  
  [AppRole.ADMINISTRATOR]: unique(
    ALL_ABILITIES.filter(ability => 
      ability !== AppAbility.PERMISSION_MATRIX_MANAGE
    )
  ),  // ✅ Tự động có
  
  [AppRole.MANAGER]: unique([
    // ... existing abilities
    AppAbility.REPORTS_VIEW,    // ✨ Add manually
    AppAbility.REPORTS_EXPORT,  // ✨ Add manually
  ]),
  
  [AppRole.CASHIER]: unique([
    // ... existing abilities
    AppAbility.REPORTS_VIEW,    // ✨ Add manually (chỉ xem)
  ]),
  
  // Staff, Kitchen, Waiter không có quyền reports
}
```

### Bước 4: Thêm route

```typescript
// src/Admin/Routes/useRouterAdmin.tsx
{
  path: path.AdminReports,  // Định nghĩa trong path.ts trước
  element: (
    <Suspense>
      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.reports}>
        <ManageReports />
      </PermissionBoundary>
    </Suspense>
  )
}
```

### Bước 5: Thêm vào sidebar

```typescript
// src/Admin/Components/Sidebar/Sidebar.tsx
const menuConfig: Record<string, MenuItem> = {
  // ... existing items
  
  reports: {  // ✨ New
    name: "Báo cáo",
    icon: FileText,
    path: path.AdminReports,
    feature: "reports"
  }
}

// Thêm vào section phù hợp hoặc tạo section mới
const reportItems = buildMenuChildren(['reports'])
if (reportItems.length > 0) {
  items.push({
    key: 'reports',
    label: 'Báo cáo & Thống kê',
    children: reportItems
  })
}
```

### Bước 6: Tạo component

```tsx
// src/Admin/Pages/ManageReports/index.tsx
import { PermissionGate, FEATURE_VIEW_ABILITY, FEATURE_MANAGE_ABILITY } from "src/Authorization"

export default function ManageReports() {
  return (
    <div>
      <h1>Báo cáo & Thống kê</h1>
      
      {/* Danh sách báo cáo */}
      <ReportList />
      
      {/* Export - chỉ Manager */}
      <PermissionGate ability={FEATURE_MANAGE_ABILITY.reports}>
        <button>Export Excel</button>
        <button>Export PDF</button>
      </PermissionGate>
    </div>
  )
}
```

---

## 2. Thêm Role Mới

### Scenario

Cần thêm role "Delivery" cho nhân viên giao hàng.

### Bước 1: Thêm vào roles.ts

```typescript
// src/Authorization/roles.ts
export enum AppRole {
  // ... existing roles
  DELIVERY = "delivery",  // ✨ New
}

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  // ... existing labels
  [AppRole.DELIVERY]: "Nhân viên giao hàng",  // ✨ New
}
```

### Bước 2: Thêm aliases (optional)

```typescript
const ROLE_ALIAS_ENTRIES: Array<[string, AppRole]> = [
  // ... existing aliases
  
  // ✨ New aliases for Delivery
  ["delivery", AppRole.DELIVERY],
  ["delivery staff", AppRole.DELIVERY],
  ["shipper", AppRole.DELIVERY],
  ["giao hàng", AppRole.DELIVERY],
]
```

### Bước 3: Định nghĩa quyền mặc định

```typescript
// src/Authorization/permissionMap.ts
export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  // ... existing roles
  
  [AppRole.DELIVERY]: unique([  // ✨ New
    AppAbility.DASHBOARD_VIEW,
    
    // Xem thông tin khách hàng
    AppAbility.CUSTOMERS_VIEW,
    
    // Xem hóa đơn để giao hàng
    AppAbility.INVOICES_VIEW,
    
    // Xem đặt bàn (nếu có giao hàng tận bàn)
    AppAbility.RESERVATIONS_VIEW,
  ]),
}
```

### Bước 4: Test role mới

```tsx
// Test component
function TestDeliveryRole() {
  const { role, roleLabel, permissions } = useAuthorization()
  
  return (
    <div>
      <p>Role: {role}</p>
      <p>Label: {roleLabel}</p>
      <p>Permissions: {permissions.length}</p>
      <ul>
        {permissions.map(p => <li key={p}>{p}</li>)}
      </ul>
    </div>
  )
}
```

---

## 3. Thêm Action Mới cho Ability

### Scenario

Thêm action "approve" cho invoices: `invoices:approve`

### Bước 1: Thêm ability

```typescript
// src/Authorization/abilities.ts
export enum AppAbility {
  // ... existing
  INVOICES_VIEW = "invoices:view",
  INVOICES_MANAGE = "invoices:manage",
  INVOICES_APPROVE = "invoices:approve",  // ✨ New action
}
```

### Bước 2: Gán cho roles phù hợp

```typescript
export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  [AppRole.MANAGER]: unique([
    // ... existing
    AppAbility.INVOICES_VIEW,
    AppAbility.INVOICES_MANAGE,
    AppAbility.INVOICES_APPROVE,  // ✨ Manager có thể approve
  ]),
  
  [AppRole.CASHIER]: unique([
    // ... existing
    AppAbility.INVOICES_VIEW,
    AppAbility.INVOICES_MANAGE,
    // ❌ Cashier không có quyền approve
  ]),
}
```

### Bước 3: Sử dụng trong UI

```tsx
function InvoiceDetail({ invoice }) {
  const { can } = useAuthorization()
  
  return (
    <div>
      {/* ... invoice content */}
      
      {invoice.status === 'pending' && (
        <PermissionGate ability={AppAbility.INVOICES_APPROVE}>
          <button onClick={handleApprove}>
            Phê duyệt hóa đơn
          </button>
        </PermissionGate>
      )}
    </div>
  )
}
```

---

## 4. Multi-tenant / Branch Support

### Scenario

Hệ thống có nhiều chi nhánh, mỗi Manager chỉ quản lý chi nhánh của mình.

### Approach 1: Branch-specific permissions

#### Backend trả về

```json
{
  "user": {
    "role": { "name": "manager" },
    "branch_id": "branch_001",
    "permissions": [
      { "code": "dashboard:view" },
      { "code": "tables:view:branch_001" },
      { "code": "tables:manage:branch_001" },
      ...
    ]
  }
}
```

#### Frontend xử lý

```typescript
// Extend ability format
export enum AppAbility {
  // Standard abilities
  TABLES_VIEW = "tables:view",
  TABLES_MANAGE = "tables:manage",
  
  // Branch-specific (dynamic)
  // Format: "feature:action:branch_id"
}

// Custom parser
const parsePermission = (code: string) => {
  const parts = code.split(':')
  return {
    feature: parts[0],
    action: parts[1],
    branch: parts[2] || null
  }
}

// Usage
function useTableActions() {
  const { permissions } = useAuthorization()
  const { branchId } = useAppStore()
  
  const canManageTables = permissions.some(p => {
    const parsed = parsePermission(p)
    return parsed.feature === 'tables' 
      && parsed.action === 'manage'
      && (!parsed.branch || parsed.branch === branchId)
  })
  
  return { canManageTables }
}
```

### Approach 2: Separate branch check

```typescript
// Store thêm branchId
type State = {
  // ... existing
  branchId: string | null
}

// Component check
function TableManagement() {
  const { can } = useAuthorization()
  const { branchId, currentBranchId } = useAppStore()
  
  // Check both permission and branch
  const canManage = can(AppAbility.TABLES_MANAGE) 
    && (branchId === currentBranchId)
  
  return (
    <div>
      {canManage && <button>Quản lý bàn</button>}
    </div>
  )
}
```

---

## 5. Dynamic Permissions từ Backend

### Scenario

Permissions thay đổi real-time, cần refresh không cần reload page.

### Implementation

```typescript
// Custom hook
function useRefreshPermissions() {
  const { setPermissions } = useAppStore()
  
  const refreshPermissions = async () => {
    const response = await userAPI.getCurrentPermissions()
    const backendPermissions = response.data.permissions.map(p => p.code)
    setPermissions(backendPermissions)
  }
  
  return { refreshPermissions }
}

// Sử dụng
function PermissionRefreshButton() {
  const { refreshPermissions } = useRefreshPermissions()
  
  return (
    <button onClick={refreshPermissions}>
      Làm mới quyền
    </button>
  )
}

// Auto-refresh mỗi 5 phút
function useAutoRefreshPermissions() {
  const { refreshPermissions } = useRefreshPermissions()
  
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPermissions()
    }, 5 * 60 * 1000)  // 5 minutes
    
    return () => clearInterval(interval)
  }, [])
}
```

---

## 6. Permission Inheritance

### Scenario

Một số permissions ngụ ý có permissions khác. Ví dụ: có `tables:manage` → tự động có `tables:view`.

### Implementation

```typescript
// src/Authorization/permissionMap.ts
const PERMISSION_DEPENDENCIES: Record<string, AppAbility[]> = {
  [AppAbility.TABLES_MANAGE]: [AppAbility.TABLES_VIEW],
  [AppAbility.MENU_MANAGE]: [AppAbility.MENU_VIEW, AppAbility.DISH_VIEW],
  [AppAbility.EMPLOYEES_MANAGE]: [AppAbility.EMPLOYEES_VIEW],
  // ... more dependencies
}

// Helper: expand permissions
const expandPermissions = (permissions: AppAbility[]): AppAbility[] => {
  const expanded = new Set(permissions)
  
  permissions.forEach(permission => {
    const deps = PERMISSION_DEPENDENCIES[permission]
    if (deps) {
      deps.forEach(dep => expanded.add(dep))
    }
  })
  
  return Array.from(expanded)
}

// Update useAuthorization
const effectiveAbilities = useMemo(() => {
  const base = normalizedExplicitAbilities.length > 0
    ? normalizedExplicitAbilities
    : getDefaultPermissionsForRole(role)
  
  return expandPermissions(base)  // ✨ Expand dependencies
}, [normalizedExplicitAbilities, role])
```

---

## 7. Audit Log cho Permission Changes

### Scenario

Log mọi thay đổi permissions để audit.

### Implementation

```typescript
// Custom store với logging
export const useAppStore = create<State & Actions>((set) => ({
  // ... existing state
  
  setPermissions: (value) => {
    // Log change
    const oldPermissions = useAppStore.getState().permissions
    console.log('Permission changed:', {
      old: oldPermissions,
      new: value,
      timestamp: new Date().toISOString()
    })
    
    // Optional: send to backend
    auditAPI.logPermissionChange({
      old: oldPermissions,
      new: value
    })
    
    set({ permissions: value })
  }
}))
```

---

## 8. Feature Flags Integration

### Scenario

Một số features cần cả permission VÀ feature flag.

### Implementation

```typescript
// Feature flags store
const useFeatureFlags = create<{
  flags: Record<string, boolean>
  setFlag: (key: string, value: boolean) => void
}>((set) => ({
  flags: {},
  setFlag: (key, value) => set(state => ({
    flags: { ...state.flags, [key]: value }
  }))
}))

// Custom hook kết hợp
function useFeatureAccess(feature: FeatureKey) {
  const { can } = useAuthorization()
  const { flags } = useFeatureFlags()
  
  const hasPermission = can(FEATURE_VIEW_ABILITY[feature])
  const flagEnabled = flags[`feature_${feature}`] !== false
  
  return hasPermission && flagEnabled
}

// Usage
function NewFeature() {
  const hasAccess = useFeatureAccess('reports')
  
  if (!hasAccess) {
    return null
  }
  
  return <ReportsPage />
}
```

---

## 9. Permission Testing Utilities

### Test Helpers

```typescript
// test-utils/authorization.ts
export const createMockAuthorization = (overrides = {}) => ({
  role: AppRole.MANAGER,
  roleLabel: "Manager",
  permissions: [AppAbility.DASHBOARD_VIEW],
  can: jest.fn(() => true),
  canSome: jest.fn(() => true),
  hasRole: jest.fn(() => true),
  hasAnyRole: jest.fn(() => true),
  abilitySet: new Set([AppAbility.DASHBOARD_VIEW]),
  ...overrides
})

export const mockWithPermissions = (abilities: AppAbility[]) => {
  const abilitySet = new Set(abilities)
  return createMockAuthorization({
    permissions: abilities,
    can: jest.fn((ability) => {
      if (Array.isArray(ability)) {
        return ability.every(a => abilitySet.has(a))
      }
      return abilitySet.has(ability)
    }),
    abilitySet
  })
}
```

### Test Examples

```typescript
describe('IngredientManagement', () => {
  it('hiển thị button khi có quyền manage', () => {
    jest.mock('src/Authorization', () => ({
      useAuthorization: () => mockWithPermissions([
        AppAbility.INGREDIENTS_VIEW,
        AppAbility.INGREDIENTS_MANAGE
      ])
    }))
    
    render(<IngredientManagement />)
    expect(screen.getByText('Thêm nguyên liệu')).toBeInTheDocument()
  })
  
  it('ẩn button khi chỉ có quyền view', () => {
    jest.mock('src/Authorization', () => ({
      useAuthorization: () => mockWithPermissions([
        AppAbility.INGREDIENTS_VIEW
      ])
    }))
    
    render(<IngredientManagement />)
    expect(screen.queryByText('Thêm nguyên liệu')).not.toBeInTheDocument()
  })
})
```

---

## 10. Migration Script

### Script chuyển đổi từ role-based sang ability-based

```typescript
// scripts/migrate-permissions.ts
import { ROLE_PERMISSIONS } from 'src/Authorization/permissionMap'

// Convert old role checks
const migrateComponent = (code: string): string => {
  return code
    // Import
    .replace(
      /import { useAppStore } from/g,
      'import { useAuthorization, AppAbility } from "src/Authorization"'
    )
    // Hook
    .replace(
      /const { role } = useAppStore\(\)/g,
      'const { can } = useAuthorization()'
    )
    // Checks
    .replace(
      /role === ["']admin["']/g,
      'can(AppAbility.ROLES_MANAGE)'
    )
    .replace(
      /role === ["']manager["']/g,
      'can(AppAbility.EMPLOYEES_MANAGE)'  // Example mapping
    )
}

// Usage
const oldCode = fs.readFileSync('Component.tsx', 'utf8')
const newCode = migrateComponent(oldCode)
fs.writeFileSync('Component.tsx', newCode)
```

---

## Best Practices

### ✅ Checklist khi mở rộng

- [ ] Thêm ability vào `abilities.ts`
- [ ] Cập nhật `featurePermissions.ts` (nếu là feature UI)
- [ ] Cập nhật `permissionMap.ts` cho các roles
- [ ] Thêm route với `PermissionBoundary`
- [ ] Thêm menu item vào sidebar
- [ ] Tạo page/component tương ứng
- [ ] Thêm guards cho actions (buttons, forms)
- [ ] Test với nhiều roles khác nhau
- [ ] Update documentation

### ✅ Naming Conventions

```typescript
// Abilities: lowercase, dash-separated
"feature:action"
"warehouse-import:view"

// Roles: lowercase, underscore-separated
"kitchen_staff"
"super_administrator"

// Feature keys: camelCase
"warehouseIn"
"permissionMatrix"
```

### ✅ Keep it Simple

- Không tạo quá nhiều abilities cho một feature
- Thường chỉ cần `view` và `manage`
- Chỉ thêm action đặc biệt khi thực sự cần (approve, export, etc.)
- Ưu tiên dùng feature keys thay vì hard-code abilities

---

**Xem thêm**:
- [Abilities](./02-ABILITIES.md)
- [Permission Map](./03-PERMISSION-MAP.md)
- [Ví dụ](./07-EXAMPLES.md)
