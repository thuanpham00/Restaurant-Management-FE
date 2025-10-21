# Quyền hạn (Abilities)

## Giới thiệu

Abilities (quyền hạn) là các quyền chi tiết được gán cho từng vai trò. Mỗi ability kiểm soát một hành động cụ thể trên một tính năng cụ thể.

## Định dạng

Abilities theo định dạng: **`feature:action`**

- `feature`: Tính năng/module (ví dụ: `tables`, `employees`, `menu`)
- `action`: Hành động (`view`, `manage`)

Ví dụ:
- `tables:view` - Xem danh sách bàn
- `tables:manage` - Quản lý bàn (thêm, sửa, xóa)
- `employees:view` - Xem danh sách nhân viên
- `employees:manage` - Quản lý nhân viên

## Định nghĩa Abilities

```typescript
// src/Authorization/abilities.ts
export enum AppAbility {
  // Dashboard
  DASHBOARD_VIEW = "dashboard:view",
  
  // Tables (Bàn ăn)
  TABLES_VIEW = "tables:view",
  TABLES_MANAGE = "tables:manage",
  
  // Reservations (Đặt bàn)
  RESERVATIONS_VIEW = "reservations:view",
  RESERVATIONS_MANAGE = "reservations:manage",
  
  // Customers (Khách hàng)
  CUSTOMERS_VIEW = "customers:view",
  CUSTOMERS_MANAGE = "customers:manage",
  
  // Employees (Nhân viên)
  EMPLOYEES_VIEW = "employees:view",
  EMPLOYEES_MANAGE = "employees:manage",
  
  // Shifts (Ca làm việc)
  SHIFTS_VIEW = "shifts:view",
  SHIFTS_MANAGE = "shifts:manage",
  
  // Payroll (Lương)
  PAYROLL_VIEW = "payroll:view",
  PAYROLL_MANAGE = "payroll:manage",
  
  // Menu Category (Danh mục món)
  MENU_CATEGORY_VIEW = "menu-category:view",
  MENU_CATEGORY_MANAGE = "menu-category:manage",
  
  // Dishes (Món ăn)
  DISH_VIEW = "dishes:view",
  DISH_MANAGE = "dishes:manage",
  
  // Menu
  MENU_VIEW = "menu:view",
  MENU_MANAGE = "menu:manage",
  
  // Ingredients (Nguyên liệu)
  INGREDIENTS_VIEW = "ingredients:view",
  INGREDIENTS_MANAGE = "ingredients:manage",
  
  // Suppliers (Nhà cung cấp)
  SUPPLIERS_VIEW = "suppliers:view",
  SUPPLIERS_MANAGE = "suppliers:manage",
  
  // Warehouse Import (Nhập kho)
  WAREHOUSE_IMPORT_VIEW = "warehouse-import:view",
  WAREHOUSE_IMPORT_MANAGE = "warehouse-import:manage",
  
  // Warehouse Export (Xuất kho)
  WAREHOUSE_EXPORT_VIEW = "warehouse-export:view",
  WAREHOUSE_EXPORT_MANAGE = "warehouse-export:manage",
  
  // Warehouse Loss (Hao hụt kho)
  WAREHOUSE_LOSS_VIEW = "warehouse-loss:view",
  WAREHOUSE_LOSS_MANAGE = "warehouse-loss:manage",
  
  // Invoices (Hóa đơn)
  INVOICES_VIEW = "invoices:view",
  INVOICES_MANAGE = "invoices:manage",
  
  // Promotions (Khuyến mãi)
  PROMOTIONS_VIEW = "promotions:view",
  PROMOTIONS_MANAGE = "promotions:manage",
  
  // Roles (Vai trò)
  ROLES_VIEW = "roles:view",
  ROLES_MANAGE = "roles:manage",
  
  // Permission Matrix (Ma trận phân quyền)
  PERMISSION_MATRIX_VIEW = "permission-matrix:view",
  PERMISSION_MATRIX_MANAGE = "permission-matrix:manage"
}
```

## Phân loại Abilities

### 1. Dashboard & Reporting

| Ability | Mô tả |
|---------|-------|
| `dashboard:view` | Xem dashboard thống kê tổng quan |

### 2. Quản lý Bàn & Đặt bàn

| Ability | Mô tả |
|---------|-------|
| `tables:view` | Xem danh sách bàn |
| `tables:manage` | Thêm, sửa, xóa bàn |
| `reservations:view` | Xem danh sách đặt bàn |
| `reservations:manage` | Quản lý đặt bàn |

### 3. Khách hàng

| Ability | Mô tả |
|---------|-------|
| `customers:view` | Xem danh sách khách hàng |
| `customers:manage` | Thêm, sửa, xóa khách hàng |

### 4. Nhân sự

| Ability | Mô tả |
|---------|-------|
| `employees:view` | Xem danh sách nhân viên |
| `employees:manage` | Quản lý nhân viên (thêm, sửa, xóa) |
| `shifts:view` | Xem lịch ca làm việc |
| `shifts:manage` | Phân công ca làm việc |
| `payroll:view` | Xem bảng lương |
| `payroll:manage` | Tính lương, chỉnh sửa |

### 5. Menu & Món ăn

| Ability | Mô tả |
|---------|-------|
| `menu-category:view` | Xem danh mục món |
| `menu-category:manage` | Quản lý danh mục món |
| `dishes:view` | Xem danh sách món ăn |
| `dishes:manage` | Thêm, sửa, xóa món ăn |
| `menu:view` | Xem menu |
| `menu:manage` | Chỉnh sửa menu |

### 6. Nguyên liệu & Kho

| Ability | Mô tả |
|---------|-------|
| `ingredients:view` | Xem danh sách nguyên liệu |
| `ingredients:manage` | Quản lý nguyên liệu |
| `suppliers:view` | Xem nhà cung cấp |
| `suppliers:manage` | Quản lý nhà cung cấp |
| `warehouse-import:view` | Xem phiếu nhập kho |
| `warehouse-import:manage` | Tạo phiếu nhập kho |
| `warehouse-export:view` | Xem phiếu xuất kho |
| `warehouse-export:manage` | Tạo phiếu xuất kho |
| `warehouse-loss:view` | Xem báo cáo hao hụt |
| `warehouse-loss:manage` | Ghi nhận hao hụt |

### 7. Tài chính

| Ability | Mô tả |
|---------|-------|
| `invoices:view` | Xem hóa đơn |
| `invoices:manage` | Tạo, chỉnh sửa hóa đơn |
| `promotions:view` | Xem khuyến mãi |
| `promotions:manage` | Quản lý khuyến mãi |

### 8. Bảo mật & Cấu hình

| Ability | Mô tả |
|---------|-------|
| `roles:view` | Xem danh sách vai trò |
| `roles:manage` | Quản lý vai trò |
| `permission-matrix:view` | Xem ma trận phân quyền |
| `permission-matrix:manage` | Chỉnh sửa ma trận phân quyền |

## Mapping với Backend

### Backend trả về permission codes

```typescript
// API response
{
  user: {
    role: {
      permissions: [
        { code: "dashboard:view" },
        { code: "tables:view" },
        { code: "tables:manage" }
      ]
    }
  }
}
```

### Frontend mapping

```typescript
// src/Authorization/useAuthorization.ts
const mapPermissionCodeToAbility = (code?: string | null): AppAbility | undefined => {
  if (!code) return undefined
  const normalized = code.trim().toLowerCase()
  return ABILITY_LOOKUP.get(normalized)
}

// ABILITY_LOOKUP là Map của ALL_ABILITIES
const ABILITY_LOOKUP = new Map<string, AppAbility>(
  ALL_ABILITIES.map((ability) => [ability.toLowerCase(), ability])
)
```

### Ví dụ mapping

```typescript
mapPermissionCodeToAbility("dashboard:view")     // → AppAbility.DASHBOARD_VIEW
mapPermissionCodeToAbility("TABLES:MANAGE")      // → AppAbility.TABLES_MANAGE
mapPermissionCodeToAbility("Menu-Category:View") // → AppAbility.MENU_CATEGORY_VIEW
```

## Sử dụng Abilities

### Kiểm tra một quyền

```typescript
import { useAuthorization, AppAbility } from "src/Authorization"

function EditButton() {
  const { can } = useAuthorization()
  
  if (!can(AppAbility.TABLES_MANAGE)) {
    return null
  }
  
  return <button>Chỉnh sửa bàn</button>
}
```

### Kiểm tra nhiều quyền (AND)

```typescript
function ComplexAction() {
  const { can } = useAuthorization()
  
  // Cần CẢ HAI quyền
  if (!can([AppAbility.TABLES_VIEW, AppAbility.TABLES_MANAGE])) {
    return <div>Không đủ quyền</div>
  }
  
  return <button>Thao tác nâng cao</button>
}
```

### Kiểm tra nhiều quyền (OR)

```typescript
function ReportButton() {
  const { canSome } = useAuthorization()
  
  // Chỉ cần MỘT trong các quyền
  if (!canSome([
    AppAbility.INVOICES_VIEW,
    AppAbility.PAYROLL_VIEW,
    AppAbility.WAREHOUSE_IMPORT_VIEW
  ])) {
    return null
  }
  
  return <button>Xem báo cáo</button>
}
```

### Lấy danh sách abilities hiện có

```typescript
function PermissionsList() {
  const { permissions, abilitySet } = useAuthorization()
  
  return (
    <ul>
      {permissions.map(ability => (
        <li key={ability}>{ability}</li>
      ))}
    </ul>
  )
}
```

## Feature Permissions

### Mapping tính năng → Ability

```typescript
// src/Authorization/featurePermissions.ts
export type FeatureKey =
  | "dashboard"
  | "tables"
  | "reservations"
  // ...

export const FEATURE_VIEW_ABILITY: Record<FeatureKey, AppAbility> = {
  dashboard: AppAbility.DASHBOARD_VIEW,
  tables: AppAbility.TABLES_VIEW,
  reservations: AppAbility.RESERVATIONS_VIEW,
  // ...
}

export const FEATURE_MANAGE_ABILITY: Partial<Record<FeatureKey, AppAbility>> = {
  tables: AppAbility.TABLES_MANAGE,
  reservations: AppAbility.RESERVATIONS_MANAGE,
  // ...
}
```

### Sử dụng Feature Keys

```typescript
import { FEATURE_VIEW_ABILITY, FEATURE_MANAGE_ABILITY } from "src/Authorization"

function TableManagement() {
  const { can } = useAuthorization()
  
  const canView = can(FEATURE_VIEW_ABILITY.tables)
  const canManage = can(FEATURE_MANAGE_ABILITY.tables)
  
  return (
    <div>
      {canView && <TableList />}
      {canManage && <button>Thêm bàn</button>}
    </div>
  )
}
```

## So sánh View vs Manage

### View (Xem)
- Chỉ đọc dữ liệu
- Không thay đổi trạng thái
- Ít rủi ro
- Thường được gán cho nhiều role

### Manage (Quản lý)
- Tạo mới, sửa, xóa
- Thay đổi trạng thái hệ thống
- Nhiều rủi ro hơn
- Thường giới hạn cho admin/manager

### Ví dụ

```typescript
// Waiter có thể XEM bàn
permissions: [AppAbility.TABLES_VIEW]

// Manager có thể XEM và QUẢN LÝ bàn
permissions: [
  AppAbility.TABLES_VIEW,
  AppAbility.TABLES_MANAGE
]
```

## Best Practices

### ✅ Nên làm

```typescript
// Dùng enum
if (can(AppAbility.TABLES_MANAGE)) { }

// Tách VIEW và MANAGE rõ ràng
const canView = can(FEATURE_VIEW_ABILITY.tables)
const canEdit = can(FEATURE_MANAGE_ABILITY.tables)

// Dùng feature keys cho consistency
const ability = FEATURE_VIEW_ABILITY[featureKey]
```

### ❌ Không nên làm

```typescript
// Không dùng string literal
if (can("tables:manage")) { }  // ❌ Type-unsafe

// Không giả định VIEW → MANAGE
if (can(AppAbility.TABLES_VIEW)) {
  // Không nên cho phép edit ở đây
  <button onClick={deleteTable}>Xóa</button>  // ❌
}

// Không hard-code ability trong component
const abilities = ["tables:view", "tables:manage"]  // ❌
```

## Thêm Ability mới

### Bước 1: Thêm vào enum

```typescript
export enum AppAbility {
  // ... existing abilities
  
  // ✨ New abilities
  REPORTS_VIEW = "reports:view",
  REPORTS_EXPORT = "reports:export",
}
```

### Bước 2: Export trong ALL_ABILITIES

```typescript
export const ALL_ABILITIES = Object.values(AppAbility)
// Tự động bao gồm abilities mới
```

### Bước 3: Thêm vào Feature Permissions (optional)

```typescript
export type FeatureKey =
  | "dashboard"
  // ...
  | "reports"  // ✨ New

export const FEATURE_VIEW_ABILITY: Record<FeatureKey, AppAbility> = {
  // ...
  reports: AppAbility.REPORTS_VIEW,  // ✨ New
}

export const FEATURE_MANAGE_ABILITY: Partial<Record<FeatureKey, AppAbility>> = {
  // ...
  reports: AppAbility.REPORTS_EXPORT,  // ✨ New (optional)
}
```

### Bước 4: Cập nhật Permission Map

```typescript
// src/Authorization/permissionMap.ts
export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  [AppRole.MANAGER]: [
    // ... existing abilities
    AppAbility.REPORTS_VIEW,      // ✨ Add to relevant roles
    AppAbility.REPORTS_EXPORT,    // ✨ Add to relevant roles
  ],
}
```

## FAQ

**Q: Tại sao phân tách VIEW và MANAGE?**  
A: Để có độ chi tiết cao. Ví dụ: Waiter cần XEM menu nhưng không được SỬA menu.

**Q: Backend có cần trả về đúng format `feature:action`?**  
A: Nên tuân theo format này, nhưng mapping function có thể normalize case.

**Q: Ability có thể có nhiều hơn 2 actions (view, manage)?**  
A: Có thể mở rộng, ví dụ: `reports:export`, `invoices:print`, `tables:reserve`.

**Q: Làm sao biết nên tạo ability mới hay dùng ability có sẵn?**  
A: Nếu là feature mới → tạo mới. Nếu chỉ là UI khác của feature cũ → dùng lại.

**Q: Có giới hạn số lượng abilities?**  
A: Không, nhưng nên group hợp lý để dễ quản lý. Hiện tại ~38 abilities là hợp lý.

---

**Xem thêm**:
- [Vai trò (Roles)](./01-ROLES.md)
- [Bảng phân quyền](./03-PERMISSION-MAP.md)
- [Components](./04-COMPONENTS.md)
