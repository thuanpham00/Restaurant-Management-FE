# Vai trò (Roles)

## Giới thiệu

Vai trò (Role) là nền tảng của hệ thống phân quyền. Mỗi người dùng được gán một vai trò, và vai trò này xác định những quyền hạn mặc định mà người dùng có.

## Định nghĩa vai trò

### AppRole Enum

```typescript
// src/Authorization/roles.ts
export enum AppRole {
  SUPER_ADMIN = "super_administrator",
  ADMINISTRATOR = "administrator",
  MANAGER = "manager",
  STAFF = "staff",
  CASHIER = "cashier",
  KITCHEN_STAFF = "kitchen_staff",
  WAITER = "waiter"
}
```

### Danh sách vai trò

| Vai trò | Code | Mô tả |
|---------|------|-------|
| **Super Administrator** | `super_administrator` | Quyền cao nhất, quản lý toàn bộ hệ thống bao gồm phân quyền |
| **Administrator** | `administrator` | Quản trị viên, có hầu hết quyền trừ quản lý ma trận phân quyền |
| **Manager** | `manager` | Quản lý nhà hàng, quản lý nhân sự, menu, kho, tài chính |
| **Staff** | `staff` | Nhân viên thông thường, chỉ xem được thông tin |
| **Cashier** | `cashier` | Thu ngân, quản lý khách hàng, hóa đơn, khuyến mãi |
| **Kitchen Staff** | `kitchen_staff` | Nhân viên bếp, quản lý menu, nguyên liệu, kho |
| **Waiter** | `waiter` | Phục vụ bàn, quản lý bàn, đặt bàn, xem menu |

## Nhãn hiển thị

```typescript
export const APP_ROLE_LABELS: Record<AppRole, string> = {
  [AppRole.SUPER_ADMIN]: "Super Administrator",
  [AppRole.ADMINISTRATOR]: "Administrator",
  [AppRole.MANAGER]: "Manager",
  [AppRole.STAFF]: "Staff",
  [AppRole.CASHIER]: "Cashier",
  [AppRole.KITCHEN_STAFF]: "Kitchen Staff",
  [AppRole.WAITER]: "Waiter"
}
```

### Cách sử dụng nhãn

```typescript
import { useAuthorization } from "src/Authorization"

function UserInfo() {
  const { role, roleLabel } = useAuthorization()
  
  return <div>Vai trò: {roleLabel}</div>
  // Output: "Vai trò: Manager"
}
```

## Chuẩn hóa vai trò (Role Resolution)

### Vấn đề

Backend có thể trả về tên vai trò theo nhiều định dạng khác nhau:
- `"Administrator"`, `"administrator"`, `"admin"`
- `"ADMIN"`, `"SUPER_ADMIN"`, `"SuperAdmin"`
- `"Kitchen Staff"`, `"kitchen_staff"`, `"inventory_staff"`

### Giải pháp: resolveRole()

Hàm `resolveRole()` chuẩn hóa tất cả các biến thể về `AppRole` chuẩn:

```typescript
export const resolveRole = (rawRole?: string | null): AppRole | null => {
  if (!rawRole) return null
  const normalized = rawRole.trim().toLowerCase()
  return ROLE_ALIAS_LOOKUP[normalized] ?? null
}
```

### Alias được hỗ trợ

#### Super Administrator
```
"super administrator", "super_admin", "super-admin", "superadmin",
"super admin", "superadministrator", "super-administrator", "ADMIN",
"SUPER_ADMIN", "SUPERADMIN"
```

#### Administrator
```
"administrator", "admin", "system admin", "system administrator",
"ADMINISTRATOR"
```

#### Manager
```
"general manager", "manager", "MANAGER"
```

#### Staff
```
"staff", "employee", "staff_member", "STAFF"
```

#### Cashier
```
"cashier", "sales staff", "sales_staff", "CASHIER", "SALES_STAFF"
```

#### Kitchen Staff
```
"kitchen staff", "kitchen_staff", "inventory staff", "inventory_staff",
"chef", "cook", "KITCHEN_STAFF", "INVENTORY_STAFF"
```

#### Waiter
```
"waiter", "wait staff", "wait_staff", "server", "WAITER"
```

### Ví dụ sử dụng

```typescript
import { resolveRole, AppRole } from "src/Authorization"

// Các input khác nhau
resolveRole("administrator")     // → AppRole.ADMINISTRATOR
resolveRole("Admin")             // → AppRole.ADMINISTRATOR
resolveRole("SUPER_ADMIN")       // → AppRole.SUPER_ADMIN
resolveRole("Kitchen Staff")     // → AppRole.KITCHEN_STAFF
resolveRole("sales_staff")       // → AppRole.CASHIER
resolveRole("invalid")           // → null
```

## So sánh vai trò

### Kiểm tra vai trò cụ thể

```typescript
import { useAuthorization, AppRole } from "src/Authorization"

function AdminOnlyButton() {
  const { hasRole } = useAuthorization()
  
  if (!hasRole(AppRole.SUPER_ADMIN)) {
    return null
  }
  
  return <button>Quản lý hệ thống</button>
}
```

### Kiểm tra nhiều vai trò

```typescript
function ManagerialButton() {
  const { hasAnyRole } = useAuthorization()
  
  if (!hasAnyRole([AppRole.SUPER_ADMIN, AppRole.ADMINISTRATOR, AppRole.MANAGER])) {
    return null
  }
  
  return <button>Báo cáo quản lý</button>
}
```

### Lấy vai trò hiện tại

```typescript
function CurrentRole() {
  const { role, roleLabel } = useAuthorization()
  
  return (
    <div>
      <p>Code: {role}</p>
      {/* Code: manager */}
      
      <p>Label: {roleLabel}</p>
      {/* Label: Manager */}
    </div>
  )
}
```

## Phân cấp vai trò

Mặc dù hệ thống không có khái niệm "kế thừa" quyền giữa các vai trò, nhưng về logic nghiệp vụ có thể hiểu như sau:

```
Super Administrator (Toàn quyền)
    ↓
Administrator (Toàn quyền trừ quản lý phân quyền)
    ↓
Manager (Quản lý vận hành)
    ↓
┌────────────┬─────────────┬──────────────┐
Cashier    Kitchen Staff   Waiter         Staff (Chỉ xem)
(Thu ngân)  (Bếp + Kho)   (Phục vụ)     (Hạn chế nhất)
```

## Lưu trữ vai trò

### Trong Zustand Store

```typescript
// src/StateGlobal/zustand.tsx
type State = {
  role: string | null  // Lưu raw string từ backend
  // ...
}
```

### Trong localStorage (qua auth.ts)

```typescript
// src/Helpers/auth.ts
export const setRoleToLS = (role: string) => {
  localStorage.setItem('role', role)
}

export const getRoleFromLS = () => {
  return localStorage.getItem('role')
}
```

## Luồng xử lý vai trò

```
1. Đăng nhập
   ├─> API: { user: { role: { name: "administrator" } } }
   ├─> Lưu raw string: setRole("administrator")
   └─> Chuẩn hóa: resolveRole("administrator") → AppRole.ADMINISTRATOR

2. Kiểm tra quyền
   ├─> useAuthorization() đọc từ store
   ├─> Chuẩn hóa: resolveRole(rawRole)
   └─> Lấy permissions mặc định: getDefaultPermissionsForRole(role)

3. Hiển thị UI
   ├─> Lấy label: APP_ROLE_LABELS[role]
   └─> Render: "Administrator"
```

## Best Practices

### ✅ Nên làm

```typescript
// Sử dụng enum khi so sánh
if (role === AppRole.MANAGER) { }

// Dùng hasRole/hasAnyRole từ hook
const { hasRole } = useAuthorization()
if (hasRole(AppRole.SUPER_ADMIN)) { }

// Chuẩn hóa trước khi sử dụng
const normalizedRole = resolveRole(rawRole)
if (normalizedRole === AppRole.ADMINISTRATOR) { }
```

### ❌ Không nên làm

```typescript
// Không so sánh trực tiếp với string
if (role === "admin") { }  // ❌ Có thể không khớp

// Không hard-code string
if (role === "ADMINISTRATOR") { }  // ❌ Case-sensitive

// Không bỏ qua chuẩn hóa
if (rawRole === AppRole.ADMINISTRATOR) { }  // ❌ Có thể sai
```

## Thêm vai trò mới

### Bước 1: Thêm vào enum

```typescript
export enum AppRole {
  // ... existing roles
  DELIVERY = "delivery",  // ✨ New role
}
```

### Bước 2: Thêm label

```typescript
export const APP_ROLE_LABELS: Record<AppRole, string> = {
  // ... existing labels
  [AppRole.DELIVERY]: "Delivery Staff",  // ✨ New label
}
```

### Bước 3: Thêm alias (optional)

```typescript
const ROLE_ALIAS_ENTRIES: Array<[string, AppRole]> = [
  // ... existing aliases
  ["delivery", AppRole.DELIVERY],
  ["delivery staff", AppRole.DELIVERY],
  ["shipper", AppRole.DELIVERY],  // ✨ Alias
]
```

### Bước 4: Định nghĩa quyền mặc định

```typescript
// src/Authorization/permissionMap.ts
export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  // ... existing mappings
  [AppRole.DELIVERY]: [
    AppAbility.DASHBOARD_VIEW,
    AppAbility.INVOICES_VIEW,
    // ... thêm abilities cần thiết
  ],
}
```

## FAQ

**Q: Tại sao cần chuẩn hóa vai trò?**  
A: Backend có thể thay đổi format hoặc sử dụng các tên khác nhau. Chuẩn hóa đảm bảo code frontend luôn hoạt động đúng.

**Q: Vai trò có thể null được không?**  
A: Có, khi người dùng chưa đăng nhập hoặc không có vai trò hợp lệ.

**Q: Có thể có nhiều vai trò cùng lúc không?**  
A: Hiện tại hệ thống chỉ hỗ trợ 1 vai trò/user. Nếu cần multi-role, cần refactor `role: string` → `roles: string[]`.

**Q: Backend trả về vai trò không có trong danh sách thì sao?**  
A: `resolveRole()` sẽ trả về `null`, và user sẽ không có quyền nào (an toàn).

---

**Xem thêm**:
- [Quyền hạn (Abilities)](./02-ABILITIES.md)
- [Bảng phân quyền](./03-PERMISSION-MAP.md)
- [Hooks](./05-HOOKS.md)
